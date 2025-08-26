require('dotenv').config(); 
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const User = require('./models/User');
const mongoose = require('mongoose');
const client = require('prom-client');
const { createLogger, format, transports } = require('winston');
const LokiTransport = require('winston-loki');
const expressWinston = require('express-winston');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const PY_BASE = process.env.ITEMS_API_URL || 'http://localhost:5005';
const GO_BASE = process.env.PRODUCTS_API_URL || 'http://localhost:7005';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ---------- Winston + Loki ----------
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.json(),
  transports: [
    // Ship to Loki
    new LokiTransport({
      // Self-hosted: http://loki:3100 ; Grafana Cloud: your HTTPS Loki push URL
      host: process.env.LOKI_URL || 'http://loki:3100',
      labels: { app: 'node-api', env: process.env.NODE_ENV || 'dev' },
      // Good defaults for throughput
      batching: true,
      interval: 5, // seconds
      // For Grafana Cloud or protected Loki, set "username:password" or "tenant_id:api_key"
      basicAuth: process.env.LOKI_BASIC_AUTH || undefined,
      // If your endpoint needs custom headers, you can add: headers: { 'X-Scope-OrgID': 'your-tenant' }
      // json: true,        // (default true) send JSON
      // replaceTimestamp: false
    }),
    // Also print to console (useful locally / for Promtail scraping)
    new transports.Console(),
  ],
});

// Structured HTTP access logs -> Winston (and thus Loki)
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    // Include route pattern so you can aggregate in Grafana
    dynamicMeta: (req, res) => ({
      route: req.route?.path || req.path,
    }),
    // Simple message; details live in meta
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}}',
    expressFormat: false,
    colorize: false,
    ignoreRoute: () => false,
  })
);

// ---------- MongoDB connection ----------
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB || 'nodedb',
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => logger.info('Connected to MongoDB'))
  .catch((err) => logger.error({ err }, 'MongoDB connection error'));

// ---------- Prometheus metrics ----------
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5],
});
register.registerMetric(httpRequestDurationSeconds);

// Observe request durations
app.use((req, res, next) => {
  const end = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    end({
      method: req.method,
      route: req.route?.path || req.path,
      code: res.statusCode,
    });
  });
  next();
});

// ---------- Routes ----------
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// test fail
// app.get('/healthz', (_req, res) => res.status(500).send('ok'));

app.get('/ready', async (_req, res) => {
  try {
    // await mongoose.connection.db.admin().ping();
    res.status(200).send('ready');
  } catch (err) {
    res.status(503).send('not ready');
  }
});

// ---------- Routes (users + orchestration) ----------

/* -------------------- UPDATED: create user + fan-out -------------------- */
app.post('/api/users', async (req, res, next) => {
  try {
    const user = new User(req.body);
    await user.save();

    // fan-out to Python & Go in parallel (best-effort)
    const headers = {};
    if (req.headers['x-request-id']) headers['x-request-id'] = req.headers['x-request-id'];

    const itemName = `${user.name}'s item`;
    const productName = `${user.name}'s product`;

    const [itemRes, prodRes] = await Promise.allSettled([
      axios.post(`${PY_BASE}/api/items`, { name: itemName }, { timeout: 4000, headers }),
      axios.post(`${GO_BASE}/api/products`, { name: productName }, { timeout: 4000, headers }),
    ]);

    const createdItem = itemRes.status === 'fulfilled' ? itemRes.value.data : null;
    const createdProduct = prodRes.status === 'fulfilled' ? prodRes.value.data : null;

    const warnings = [];
    if (itemRes.status === 'rejected') warnings.push('Failed to create item in api-python');
    if (prodRes.status === 'rejected') warnings.push('Failed to create product in api-go');

    res.status(201).json({ user, createdItem, createdProduct, warnings });
  } catch (err) {
    next(err);
  }
});
/* ----------------------------------------------------------------------- */

app.get('/api/users', async (req, res, next) => {
  try {
    const users = await User.find().lean();
    res.send(users);
  } catch (err) {
    next(err);
  }
});

/* -------------------- ADD: proxy helpers -------------------- */
// Forward-create an item for a user (Python)
app.post('/api/users/:id/items', async (req, res) => {
  try {
    const { name } = req.body;
    const { data } = await axios.post(`${PY_BASE}/api/items`, { name }, { timeout: 4000 });
    res.status(201).json(data);
  } catch (e) {
    res.status(502).json({ error: 'Failed to create item via api-python' });
  }
});

// Forward-create a product for a user (Go)
app.post('/api/users/:id/products', async (req, res) => {
  try {
    const { name } = req.body;
    const { data } = await axios.post(`${GO_BASE}/api/products`, { name }, { timeout: 4000 });
    res.status(201).json(data);
  } catch (e) {
    res.status(502).json({ error: 'Failed to create product via api-go' });
  }
});
/* ----------------------------------------------------------------------- */

/* -------------------- ADD: aggregation endpoints -------------------- */
// Combine user + items + products (note: items/products are unfiltered in current services)
app.get('/api/users/:id/summary', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [itemsRes, productsRes] = await Promise.allSettled([
      axios.get(`${PY_BASE}/api/items`, { timeout: 4000 }),
      axios.get(`${GO_BASE}/api/products`, { timeout: 4000 }),
    ]);

    res.json({
      user,
      items: itemsRes.status === 'fulfilled' ? itemsRes.value.data : [],
      products: productsRes.status === 'fulfilled' ? productsRes.value.data : [],
    });
  } catch {
    res.status(502).json({ error: 'Failed to build summary' });
  }
});

// Quick all-up aggregation
app.get('/api/summary', async (_req, res) => {
  try {
    const users = await User.find().lean();
    const [itemsRes, productsRes] = await Promise.allSettled([
      axios.get(`${PY_BASE}/api/items`, { timeout: 4000 }),
      axios.get(`${GO_BASE}/api/products`, { timeout: 4000 }),
    ]);
    res.json({
      users,
      items: itemsRes.status === 'fulfilled' ? itemsRes.value.data : [],
      products: productsRes.status === 'fulfilled' ? productsRes.value.data : [],
    });
  } catch {
    res.status(502).json({ error: 'Failed to aggregate' });
  }
});
/* ----------------------------------------------------------------------- */

// Error logger -> Winston/Loki
app.use(
  expressWinston.errorLogger({
    winstonInstance: logger,
  })
);


app.get('/health', (_, res) => res.json({ status: 'ok', service: 'api-node' }));

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

// Optional: flush on shutdown
process.on('SIGTERM', () => {
  logger.info('Shutting down…');
  // winston-loki batches automatically; process exit will flush
  process.exit(0);
});

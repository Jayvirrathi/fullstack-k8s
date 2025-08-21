package loki

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type Client struct {
	url       string
	basicAuth string // "username:password" or "tenant:apiKey" (Grafana Cloud)
	tenant    string // X-Scope-OrgID
	labels    map[string]string
	ch        chan entry
	quit      chan struct{}
	wg        sync.WaitGroup
	interval  time.Duration
	maxBatch  int
	client    *http.Client
	closed    bool
	mu        sync.Mutex
}

type entry struct {
	level string
	msg   string
	meta  map[string]any
	time  time.Time
}

// NewClient creates a background batching Loki client.
func NewClient(pushURL, basicAuth, tenant string, baseLabels map[string]string, maxBatch int, interval time.Duration) (*Client, error) {
	if pushURL == "" {
		return nil, errors.New("loki push URL is empty")
	}
	c := &Client{
		url:       pushURL,
		basicAuth: basicAuth,
		tenant:    tenant,
		labels:    baseLabels,
		ch:        make(chan entry, 4096),
		quit:      make(chan struct{}),
		interval:  interval,
		maxBatch:  maxBatch,
		client:    &http.Client{Timeout: 10 * time.Second},
	}
	c.wg.Add(1)
	go c.loop()
	return c, nil
}

func (c *Client) Close() {
	c.mu.Lock()
	if c.closed { c.mu.Unlock(); return }
	c.closed = true
	close(c.quit)
	c.mu.Unlock()
	c.wg.Wait()
}

// Info / Error helpers
func (c *Client) Info(msg string, meta map[string]any)  { c.enqueue("info", msg, meta) }
func (c *Client) Error(msg string, meta map[string]any) { c.enqueue("error", msg, meta) }
func (c *Client) Warn(msg string, meta map[string]any)  { c.enqueue("warn", msg, meta) }

func (c *Client) enqueue(level, msg string, meta map[string]any) {
	c.mu.Lock()
	closed := c.closed
	c.mu.Unlock()
	if closed { return }
	select {
	case c.ch <- entry{level: level, msg: msg, meta: meta, time: time.Now()}:
	default:
		// drop if buffer full to avoid blocking request path
	}
}

func (c *Client) loop() {
	defer c.wg.Done()
	batch := make([]entry, 0, c.maxBatch)

	flush := func() {
		if len(batch) == 0 { return }
		_ = c.push(batch)
		batch = batch[:0]
	}

	ticker := time.NewTicker(c.interval)
	defer ticker.Stop()

	for {
		select {
		case e := <-c.ch:
			batch = append(batch, e)
			if len(batch) >= c.maxBatch { flush() }
		case <-ticker.C:
			flush()
		case <-c.quit:
			flush()
			return
		}
	}
}

func (c *Client) push(batch []entry) error {
	streams := []map[string]any{}
	labels := map[string]string{}
	for k, v := range c.labels { labels[k] = v }
	// We'll keep labels constant to avoid cardinality explosion
	values := make([][2]string, 0, len(batch))
	for _, e := range batch {
		lineObj := map[string]any{"level": e.level, "msg": e.msg, "ts": e.time.Format(time.RFC3339Nano)}
		for k, v := range e.meta { lineObj[k] = v }
		b, _ := json.Marshal(lineObj)
		values = append(values, [2]string{fmt.Sprintf("%d", e.time.UnixNano()), string(b)})
	}
	streams = append(streams, map[string]any{"stream": labels, "values": values})
	payload := map[string]any{"streams": streams}
	buf, _ := json.Marshal(payload)

	// gzip compress to reduce payload
	var gz bytes.Buffer
	zw := gzip.NewWriter(&gz)
	if _, err := zw.Write(buf); err == nil { zw.Close() } else { return err }

	req, err := http.NewRequest("POST", c.url, bytes.NewReader(gz.Bytes()))
	if err != nil { return err }
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Content-Encoding", "gzip")
	if c.tenant != "" {
		req.Header.Set("X-Scope-OrgID", c.tenant)
	}
	if c.basicAuth != "" {
		u, p, ok := strings.Cut(c.basicAuth, ":")
		if ok { req.SetBasicAuth(u, p) }
	}
	resp, err := c.client.Do(req)
	if err != nil { return err }
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return fmt.Errorf("loki push: unexpected status %d", resp.StatusCode)
	}
	return nil
}

// StdLogger implements a minimal interface used by the access log middleware
type StdLogger interface {
	Info(msg string, meta map[string]any)
	Error(msg string, meta map[string]any)
	Warn(msg string, meta map[string]any)
}

// FallbackStdout implements StdLogger to stdout when Loki is unavailable
type FallbackStdout struct{}

func (FallbackStdout) Info(msg string, meta map[string]any)  { logLine("INFO", msg, meta) }
func (FallbackStdout) Error(msg string, meta map[string]any) { logLine("ERROR", msg, meta) }
func (FallbackStdout) Warn(msg string, meta map[string]any)  { logLine("WARN", msg, meta) }

func logLine(level, msg string, meta map[string]any) {
	m := map[string]any{"level": level, "msg": msg, "time": time.Now().Format(time.RFC3339Nano)}
	for k, v := range meta { m[k] = v }
	b, _ := json.Marshal(m)
	fmt.Fprintln(os.Stdout, string(b))
}

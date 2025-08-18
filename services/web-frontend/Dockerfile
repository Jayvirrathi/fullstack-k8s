FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime stage: Nginx to serve the static files ---
FROM nginx:1.27-alpine

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Optimized config for SPA + caching + gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Simple health endpoint (static file)
RUN printf "ok\n" > /usr/share/nginx/html/healthz

# Non-root (compatible with k8s securityContext: runAsNonRoot: true)
# nginx user exists in this image
RUN chown -R nginx:nginx /var/cache/nginx /var/run /usr/share/nginx/html /etc/nginx
USER nginx

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
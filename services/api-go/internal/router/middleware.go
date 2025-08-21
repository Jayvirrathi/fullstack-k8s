package router

import (
	"net/http"
	"time"

	"example.com/api-go/internal/loki"
)

// WithAccessLog logs structured HTTP access logs to Loki (or stdout fallback)
func WithAccessLog(next http.Handler, logger loki.StdLogger) http.Handler {
	if logger == nil { logger = loki.FallbackStdout{} }
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &statusRecorder{ResponseWriter: w, code: 200}
		next.ServeHTTP(rw, r)
		route := r.URL.Path
		logger.Info("http_request", map[string]any{
			"method": r.Method,
			"route":  route,
			"status": rw.code,
			"duration_ms": time.Since(start).Milliseconds(),
			"remote": r.RemoteAddr,
			"ua":     r.UserAgent(),
		})
	})
}

type statusRecorder struct {
	http.ResponseWriter
	code int
}

func (rw *statusRecorder) WriteHeader(code int) {
	rw.code = code
	rw.ResponseWriter.WriteHeader(code)
}

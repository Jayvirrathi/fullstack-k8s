package metrics

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Setup creates a Prometheus registry and an HTTP request duration histogram.
func Setup() (*prometheus.Registry, *prometheus.HistogramVec) {
	reg := prometheus.NewRegistry()

	// Default Go & process metrics
	reg.MustRegister(collectors.NewGoCollector())
	reg.MustRegister(collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}))

	httpDur := prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duration of HTTP requests in seconds",
			Buckets: []float64{0.1, 0.5, 1, 1.5, 2, 5},
		},
		[]string{"method", "route", "code"},
	)
	reg.MustRegister(httpDur)

	return reg, httpDur
}

// Handler exposes the registry on /metrics
func Handler(reg *prometheus.Registry) http.Handler { return promhttp.HandlerFor(reg, promhttp.HandlerOpts{}) }

// WithHTTPDuration instruments request duration with a HistogramVec
func WithHTTPDuration(next http.Handler, hv *prometheus.HistogramVec) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &statusRecorder{ResponseWriter: w, code: 200}
		next.ServeHTTP(rw, r)
		// route pattern (best effort)
		route := r.URL.Path
		if rp := routePattern(r); rp != "" {
			route = rp
		}
		hv.WithLabelValues(r.Method, route, strconv.Itoa(rw.code)).Observe(time.Since(start).Seconds())
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

// Chi route pattern if available
func routePattern(r *http.Request) string {
	if r == nil {
		return ""
	}
	if rc := r.Context().Value(struct{ chiRouteCtx string }{"RouteContext"}); rc != nil {
		// Not relying on chi internals; fall back
		return ""
	}
	return ""
}

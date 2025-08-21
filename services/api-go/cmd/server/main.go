package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"example.com/api-go/internal/db"
	"example.com/api-go/internal/metrics"
	"example.com/api-go/internal/router"
	"example.com/api-go/internal/loki"
)

func main() {
	ctx := context.Background()

	// ---------- DB ----------
	database := db.MustOpen(ctx)

	// ---------- Prometheus ----------
	reg, httpDur := metrics.Setup()

	// /metrics endpoint
	mux := http.NewServeMux()
	mux.Handle("/metrics", metrics.Handler(reg))

	// ---------- Router (API) ----------
	r := router.New(database)

	// Wrap with CORS, metrics, and access logging
	var handler http.Handler = r
	handler = router.WithCORS(handler, "*") // allow all origins

	// Access log -> Loki (push API)
	lokiURL := getenv("LOKI_URL", "http://loki.default.svc.cluster.local:3100/loki/api/v1/push")
	lokiAuth := os.Getenv("LOKI_BASIC_AUTH") // username:password or tenant:apiKey
	tenant := os.Getenv("LOKI_TENANT")       // sets X-Scope-OrgID when provided
	app := getenv("APP_NAME", "go-api")
	env := getenv("APP_ENV", "dev")

	lk, err := loki.NewClient(
		lokiURL,
		lokiAuth,
		tenant,
		map[string]string{"app": app, "env": env},
		1000,
		5*time.Second,
	)
	if err != nil {
		log.Printf("loki: disabled (%v)", err)
	} else {
		defer lk.Close()
		handler = router.WithAccessLog(handler, lk)
	}

	// Prometheus HTTP duration metrics
	handler = metrics.WithHTTPDuration(handler, httpDur)

	// Mount API under /
	mux.Handle("/", handler)

	port := getenv("GO_PORT", "7000")
	log.Printf("Go API running on :%s (metrics at /metrics)", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"example.com/api-go/internal/db"
	"example.com/api-go/internal/router"
)

func main() {
	ctx := context.Background()

	// Connect to DB (with retry + initSchema)
	database := db.MustOpen(ctx)

	// Setup router
	r := router.New(database)

	// Allow all origins
	handler := router.WithCORS(r, "*")

	port := getenv("GO_PORT", "7000")

	log.Printf("Go API running on :%s (CORS origin: *)", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

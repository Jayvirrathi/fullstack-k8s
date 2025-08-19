package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func MustOpen(ctx context.Context) *DB {
	dsn := os.Getenv("GO_DATABASE_URL")
	if dsn == "" {
		pgUser := getenv("POSTGRES_USER", "postgres")
		pgPass := getenv("POSTGRES_PASSWORD", "postgres")
		pgDB := getenv("POSTGRES_DB", "items_db")
		pgHost := getenv("POSTGRES_HOST", "postgres")
		pgPort := getenv("POSTGRES_PORT", "5432")
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
			pgUser, pgPass, pgHost, pgPort, pgDB)
	}

	// Retry loop in case Postgres is "starting up"
	var pool *pgxpool.Pool
	var err error
	for i := 0; i < 10; i++ {
		pool, err = pgxpool.New(ctx, dsn)
		if err == nil {
			err = pool.Ping(ctx)
		}
		if err == nil {
			break
		}
		log.Printf("waiting for postgres... (%v)", err)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("cannot connect to postgres: %v", err)
	}

	db := &DB{Pool: pool}
	db.initSchema(ctx) // auto-create tables
	return db
}

func (db *DB) initSchema(ctx context.Context) {
	schema := `
	CREATE TABLE IF NOT EXISTS products (
		id SERIAL PRIMARY KEY,
		name TEXT NOT NULL
	);`
	_, err := db.Pool.Exec(ctx, schema)
	if err != nil {
		log.Fatalf("failed to init schema: %v", err)
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

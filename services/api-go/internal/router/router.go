package router

import (
	"encoding/json"
	"net/http"

	"example.com/api-go/internal/db"
	"github.com/go-chi/chi/v5"
)

func New(database *db.DB) http.Handler {
	r := chi.NewRouter()

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	r.Get("/api/products", func(w http.ResponseWriter, r *http.Request) {
		rows, err := database.Pool.Query(r.Context(), "SELECT id, name FROM products")
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer rows.Close()

		type Product struct {
			ID   int    `json:"id"`
			Name string `json:"name"`
		}
		var products []Product
		for rows.Next() {
			var p Product
			if err := rows.Scan(&p.ID, &p.Name); err != nil {
				http.Error(w, err.Error(), 500)
				return
			}
			products = append(products, p)
		}

		writeJSON(w, products)
	})

	r.Post("/api/products", func(w http.ResponseWriter, r *http.Request) {
		type Req struct {
			Name string `json:"name"`
		}
		var req Req
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}

		_, err := database.Pool.Exec(r.Context(), "INSERT INTO products (name) VALUES ($1)", req.Name)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		w.WriteHeader(http.StatusCreated)
		writeJSON(w, map[string]string{"status": "created"})
	})

	return r
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

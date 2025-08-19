
package router

import (
    "encoding/json"
    "net/http"

    "github.com/jackc/pgx/v5/pgxpool"
)

type Handlers struct{ DB *pgxpool.Pool }

type ProductIn struct {
    Name string `json:"name"`
}

type ProductOut struct {
    ID int32  `json:"id"`
    Name string `json:"name"`
}

func (h Handlers) ListProducts(w http.ResponseWriter, r *http.Request) {
    rows, err := h.DB.Query(r.Context(), `SELECT id, name FROM products ORDER BY id`)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer rows.Close()
    var out []ProductOut
    for rows.Next() {
        var p ProductOut
        if err := rows.Scan(&p.ID, &p.Name); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        out = append(out, p)
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(out)
}

func (h Handlers) CreateProduct(w http.ResponseWriter, r *http.Request) {
    var in ProductIn
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        http.Error(w, "invalid json", http.StatusBadRequest)
        return
    }
    if in.Name == "" {
        http.Error(w, "name is required", http.StatusBadRequest)
        return
    }
    var id int32
    err := h.DB.QueryRow(r.Context(), `INSERT INTO products(name) VALUES($1) RETURNING id`, in.Name).Scan(&id)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(ProductOut{ID: id, Name: in.Name})
}

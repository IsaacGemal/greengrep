package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

type Post struct {
	URL    string `json:"url"`
	IsNSFW bool   `json:"is_nsfw"`
}

type RandomResponse struct {
	Results []Post `json:"results"`
	Count   int    `json:"count"`
}

func main() {
	// Load .env file
	if err := godotenv.Load("../.env"); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// Get database URL from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// Connect to database
	db, err := sql.Open("postgres", dbURL+"?sslmode=disable") // TODO: For production, remove sslmode=disable. I think? This is new to me with go.
	if err != nil {
		log.Fatal("Error connecting to database:", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatal("Error pinging database:", err)
	}

	// Create router
	mux := http.NewServeMux()

	// Random posts handler
	mux.HandleFunc("/api/random", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		start := time.Now()

		// Query database for random posts
		rows, err := db.Query(`
			SELECT url, is_nsfw
			FROM "Post"
			WHERE url IS NOT NULL
			ORDER BY RANDOM()
			LIMIT 100
		`)
		if err != nil {
			log.Printf("Database query error: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Parse results
		var posts []Post
		for rows.Next() {
			var post Post
			if err := rows.Scan(&post.URL, &post.IsNSFW); err != nil {
				log.Printf("Error scanning row: %v", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}
			posts = append(posts, post)
		}

		// Check for errors from iterating over rows
		if err := rows.Err(); err != nil {
			log.Printf("Error iterating over rows: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		// Prepare response
		response := RandomResponse{
			Results: posts,
			Count:   len(posts),
		}

		// Set response headers
		w.Header().Set("Content-Type", "application/json")

		// Encode and send response
		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Printf("Error encoding response: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		// After sending response, calculate and log the duration
		duration := time.Since(start)
		log.Printf("Request processed in %v ms", duration.Milliseconds())
	})

	// Setup CORS
	handler := cors.Default().Handler(mux)

	// Start server
	port := os.Getenv("GO_PORT")
	if port == "" {
		port = "3001" // Default port
	}
	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}


package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	// Initialize database
	db, err := NewDatabase()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Create tables
	if err := db.CreateTables(); err != nil {
		log.Fatal("Failed to create tables:", err)
	}

	// Initialize service
	service := NewHappyPaisaService(db)

	// Initialize HTTP server
	router := mux.NewRouter()

	// Health check endpoint
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		response := HealthResponse{
			Status:    "ok",
			Service:   "happy-paisa-ledger",
			Version:   "1.0.0",
			Timestamp: time.Now(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}).Methods("GET")

	// API routes
	api := router.PathPrefix("/api/v1").Subrouter()

	// Get balance
	api.HandleFunc("/balance/{user_id}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		userID, err := uuid.Parse(vars["user_id"])
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}

		balance, err := service.GetBalance(userID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(balance)
	}).Methods("GET")

	// Add funds
	api.HandleFunc("/add-funds", func(w http.ResponseWriter, r *http.Request) {
		var req AddFundsRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		result, err := service.AddFunds(req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if result.Success {
			w.WriteHeader(http.StatusOK)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		json.NewEncoder(w).Encode(result)
	}).Methods("POST")

	// Deduct funds
	api.HandleFunc("/deduct-funds", func(w http.ResponseWriter, r *http.Request) {
		var req DeductFundsRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		result, err := service.DeductFunds(req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if result.Success {
			w.WriteHeader(http.StatusOK)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		json.NewEncoder(w).Encode(result)
	}).Methods("POST")

	// Transfer funds
	api.HandleFunc("/transfer", func(w http.ResponseWriter, r *http.Request) {
		var req TransferRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		result, err := service.Transfer(req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if result.Success {
			w.WriteHeader(http.StatusOK)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		json.NewEncoder(w).Encode(result)
	}).Methods("POST")

	// Get transactions
	api.HandleFunc("/transactions/{user_id}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		userID, err := uuid.Parse(vars["user_id"])
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}

		limitStr := r.URL.Query().Get("limit")
		limit := 50 // default
		if limitStr != "" {
			if parsed, err := strconv.Atoi(limitStr); err == nil {
				limit = parsed
			}
		}

		transactions, err := service.GetTransactions(userID, limit)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(transactions)
	}).Methods("GET")

	// Create wallet
	api.HandleFunc("/wallet", func(w http.ResponseWriter, r *http.Request) {
		var req CreateWalletRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		wallet, err := service.GetOrCreateWallet(req.UserID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(wallet)
	}).Methods("POST")

	// CORS configuration
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	handler := c.Handler(router)

	log.Println("🚀 Happy Paisa Ledger starting on port 8004...")
	log.Println("📋 Available endpoints:")
	log.Println("   GET    /health")
	log.Println("   GET    /api/v1/balance/{user_id}")
	log.Println("   POST   /api/v1/add-funds")
	log.Println("   POST   /api/v1/deduct-funds")
	log.Println("   POST   /api/v1/transfer")
	log.Println("   GET    /api/v1/transactions/{user_id}")
	log.Println("   POST   /api/v1/wallet")

	log.Fatal(http.ListenAndServe(":8004", handler))
}

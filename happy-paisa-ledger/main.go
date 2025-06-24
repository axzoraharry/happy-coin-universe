
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "github.com/gorilla/mux"
)

type HealthResponse struct {
    Status  string `json:"status"`
    Service string `json:"service"`
}

type BalanceResponse struct {
    UserID  string  `json:"user_id"`
    Balance float64 `json:"balance"`
    Currency string `json:"currency"`
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    response := HealthResponse{
        Status:  "ok",
        Service: "happy-paisa-ledger",
    }
    json.NewEncoder(w).Encode(response)
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    response := map[string]string{
        "message": "Hello from Happy Paisa Ledger!",
        "service": "happy-paisa-ledger",
    }
    json.NewEncoder(w).Encode(response)
}

func getBalanceHandler(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    userID := vars["user_id"]
    
    w.Header().Set("Content-Type", "application/json")
    // TODO: Implement actual balance retrieval from database
    response := BalanceResponse{
        UserID:   userID,
        Balance:  1000.0, // Placeholder
        Currency: "HP", // Happy Paisa
    }
    json.NewEncoder(w).Encode(response)
}

func transferHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    // TODO: Implement Happy Paisa transfer logic
    response := map[string]string{
        "message": "Transfer endpoint - implementation needed",
        "status":  "pending",
    }
    json.NewEncoder(w).Encode(response)
}

func main() {
    r := mux.NewRouter()
    
    // Basic routes
    r.HandleFunc("/", rootHandler).Methods("GET")
    r.HandleFunc("/health", healthHandler).Methods("GET")
    
    // Happy Paisa specific endpoints
    r.HandleFunc("/balance/{user_id}", getBalanceHandler).Methods("GET")
    r.HandleFunc("/transfer", transferHandler).Methods("POST")
    
    port := os.Getenv("PORT")
    if port == "" {
        port = "8004"
    }
    
    fmt.Printf("Happy Paisa Ledger server starting on port %s\n", port)
    log.Fatal(http.ListenAndServe(":"+port, r))
}


package main

import (
	"log"
	"os"
)

func main() {
	log.Println("🚀 Initializing Happy Paisa Ledger database...")
	
	// Override database URL for initialization if needed
	if len(os.Args) > 1 {
		os.Setenv("DATABASE_URL", os.Args[1])
	}
	
	db, err := NewDatabase()
	if err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}
	defer db.Close()
	
	if err := db.CreateTables(); err != nil {
		log.Fatal("❌ Failed to create tables:", err)
	}
	
	log.Println("✅ Happy Paisa Ledger database initialized successfully!")
}

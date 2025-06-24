
package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type DB struct {
	*sqlx.DB
}

func NewDatabase() (*DB, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://hp_user:hp_password@localhost:5432/hp_db?sslmode=disable"
	}

	db, err := sqlx.Connect("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	return &DB{db}, nil
}

func (db *DB) CreateTables() error {
	queries := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
		`CREATE TABLE IF NOT EXISTS wallets (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL UNIQUE,
			balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
			total_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
			total_spent DECIMAL(10,2) NOT NULL DEFAULT 0.00,
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			wallet_id UUID NOT NULL,
			user_id UUID NOT NULL,
			amount DECIMAL(10,2) NOT NULL,
			transaction_type VARCHAR(50) NOT NULL,
			description TEXT,
			recipient_id UUID,
			reference_id TEXT,
			status VARCHAR(20) NOT NULL DEFAULT 'completed',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			FOREIGN KEY (wallet_id) REFERENCES wallets(id),
			INDEX idx_transactions_user_id (user_id),
			INDEX idx_transactions_wallet_id (wallet_id),
			INDEX idx_transactions_created_at (created_at)
		);`,
		`CREATE OR REPLACE FUNCTION update_updated_at()
		RETURNS TRIGGER AS $$
		BEGIN
			NEW.updated_at = NOW();
			RETURN NEW;
		END;
		$$ language 'plpgsql';`,
		`DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;`,
		`CREATE TRIGGER update_wallets_updated_at
			BEFORE UPDATE ON wallets
			FOR EACH ROW EXECUTE FUNCTION update_updated_at();`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			log.Printf("Error executing query: %s, Error: %v", query, err)
			return err
		}
	}

	log.Println("✅ Database tables created successfully!")
	return nil
}

func (db *DB) GetWalletByUserID(userID uuid.UUID) (*Wallet, error) {
	var wallet Wallet
	query := `SELECT id, user_id, balance, total_earned, total_spent, is_active, created_at, updated_at 
			  FROM wallets WHERE user_id = $1 AND is_active = true`
	
	err := db.Get(&wallet, query, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &wallet, nil
}

func (db *DB) CreateWallet(userID uuid.UUID) (*Wallet, error) {
	wallet := &Wallet{
		ID:          uuid.New(),
		UserID:      userID,
		Balance:     0.00,
		TotalEarned: 0.00,
		TotalSpent:  0.00,
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	query := `INSERT INTO wallets (id, user_id, balance, total_earned, total_spent, is_active, created_at, updated_at)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	
	_, err := db.Exec(query, wallet.ID, wallet.UserID, wallet.Balance, wallet.TotalEarned, 
		wallet.TotalSpent, wallet.IsActive, wallet.CreatedAt, wallet.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return wallet, nil
}

func (db *DB) UpdateWalletBalance(walletID uuid.UUID, newBalance, totalEarned, totalSpent float64) error {
	query := `UPDATE wallets SET balance = $1, total_earned = $2, total_spent = $3, updated_at = NOW() 
			  WHERE id = $4`
	
	_, err := db.Exec(query, newBalance, totalEarned, totalSpent, walletID)
	return err
}

func (db *DB) CreateTransaction(tx *Transaction) error {
	tx.ID = uuid.New()
	tx.CreatedAt = time.Now()
	
	query := `INSERT INTO transactions (id, wallet_id, user_id, amount, transaction_type, description, 
			  recipient_id, reference_id, status, created_at)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	
	_, err := db.Exec(query, tx.ID, tx.WalletID, tx.UserID, tx.Amount, tx.TransactionType,
		tx.Description, tx.RecipientID, tx.ReferenceID, tx.Status, tx.CreatedAt)
	return err
}

func (db *DB) GetTransactionsByUserID(userID uuid.UUID, limit int) ([]Transaction, error) {
	var transactions []Transaction
	query := `SELECT id, wallet_id, user_id, amount, transaction_type, description, 
			  recipient_id, reference_id, status, created_at 
			  FROM transactions WHERE user_id = $1 
			  ORDER BY created_at DESC LIMIT $2`
	
	err := db.Select(&transactions, query, userID, limit)
	return transactions, err
}

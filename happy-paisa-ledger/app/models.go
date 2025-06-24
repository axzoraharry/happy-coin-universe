
package main

import (
	"time"
	"github.com/google/uuid"
)

type Wallet struct {
	ID           uuid.UUID `json:"id" db:"id"`
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	Balance      float64   `json:"balance" db:"balance"`
	TotalEarned  float64   `json:"total_earned" db:"total_earned"`
	TotalSpent   float64   `json:"total_spent" db:"total_spent"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type Transaction struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	WalletID        uuid.UUID  `json:"wallet_id" db:"wallet_id"`
	UserID          uuid.UUID  `json:"user_id" db:"user_id"`
	Amount          float64    `json:"amount" db:"amount"`
	TransactionType string     `json:"transaction_type" db:"transaction_type"`
	Description     string     `json:"description" db:"description"`
	RecipientID     *uuid.UUID `json:"recipient_id,omitempty" db:"recipient_id"`
	ReferenceID     *string    `json:"reference_id,omitempty" db:"reference_id"`
	Status          string     `json:"status" db:"status"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
}

type CreateWalletRequest struct {
	UserID uuid.UUID `json:"user_id" validate:"required"`
}

type TransferRequest struct {
	FromUserID  uuid.UUID `json:"from_user_id" validate:"required"`
	ToUserID    uuid.UUID `json:"to_user_id" validate:"required"`
	Amount      float64   `json:"amount" validate:"required,gt=0"`
	Description string    `json:"description"`
	ReferenceID *string   `json:"reference_id,omitempty"`
}

type AddFundsRequest struct {
	UserID      uuid.UUID `json:"user_id" validate:"required"`
	Amount      float64   `json:"amount" validate:"required,gt=0"`
	Source      string    `json:"source" validate:"required"`
	ReferenceID *string   `json:"reference_id,omitempty"`
}

type DeductFundsRequest struct {
	UserID      uuid.UUID `json:"user_id" validate:"required"`
	Amount      float64   `json:"amount" validate:"required,gt=0"`
	Reason      string    `json:"reason" validate:"required"`
	ReferenceID *string   `json:"reference_id,omitempty"`
}

type BalanceResponse struct {
	UserID      uuid.UUID `json:"user_id"`
	Balance     float64   `json:"balance"`
	TotalEarned float64   `json:"total_earned"`
	TotalSpent  float64   `json:"total_spent"`
}

type TransactionResponse struct {
	Success       bool         `json:"success"`
	TransactionID uuid.UUID    `json:"transaction_id,omitempty"`
	Message       string       `json:"message"`
	Balance       float64      `json:"balance,omitempty"`
	Transaction   *Transaction `json:"transaction,omitempty"`
}

type HealthResponse struct {
	Status    string    `json:"status"`
	Service   string    `json:"service"`
	Version   string    `json:"version"`
	Timestamp time.Time `json:"timestamp"`
}

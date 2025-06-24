
package main

import (
	"fmt"
	"log"

	"github.com/google/uuid"
)

type HappyPaisaService struct {
	db *DB
}

func NewHappyPaisaService(db *DB) *HappyPaisaService {
	return &HappyPaisaService{db: db}
}

func (s *HappyPaisaService) GetOrCreateWallet(userID uuid.UUID) (*Wallet, error) {
	// Try to get existing wallet
	wallet, err := s.db.GetWalletByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get wallet: %w", err)
	}

	// Create wallet if it doesn't exist
	if wallet == nil {
		wallet, err = s.db.CreateWallet(userID)
		if err != nil {
			return nil, fmt.Errorf("failed to create wallet: %w", err)
		}
		log.Printf("Created new wallet for user %s", userID)
	}

	return wallet, nil
}

func (s *HappyPaisaService) GetBalance(userID uuid.UUID) (*BalanceResponse, error) {
	wallet, err := s.GetOrCreateWallet(userID)
	if err != nil {
		return nil, err
	}

	return &BalanceResponse{
		UserID:      userID,
		Balance:     wallet.Balance,
		TotalEarned: wallet.TotalEarned,
		TotalSpent:  wallet.TotalSpent,
	}, nil
}

func (s *HappyPaisaService) AddFunds(req AddFundsRequest) (*TransactionResponse, error) {
	wallet, err := s.GetOrCreateWallet(req.UserID)
	if err != nil {
		return &TransactionResponse{Success: false, Message: err.Error()}, err
	}

	// Create transaction record
	transaction := &Transaction{
		WalletID:        wallet.ID,
		UserID:          req.UserID,
		Amount:          req.Amount,
		TransactionType: "credit",
		Description:     fmt.Sprintf("Funds added: %s", req.Source),
		ReferenceID:     req.ReferenceID,
		Status:          "completed",
	}

	err = s.db.CreateTransaction(transaction)
	if err != nil {
		return &TransactionResponse{Success: false, Message: "Failed to create transaction"}, err
	}

	// Update wallet balance
	newBalance := wallet.Balance + req.Amount
	newTotalEarned := wallet.TotalEarned + req.Amount

	err = s.db.UpdateWalletBalance(wallet.ID, newBalance, newTotalEarned, wallet.TotalSpent)
	if err != nil {
		return &TransactionResponse{Success: false, Message: "Failed to update balance"}, err
	}

	log.Printf("Added %.2f Happy Paisa to user %s, new balance: %.2f", req.Amount, req.UserID, newBalance)

	return &TransactionResponse{
		Success:       true,
		TransactionID: transaction.ID,
		Message:       "Funds added successfully",
		Balance:       newBalance,
		Transaction:   transaction,
	}, nil
}

func (s *HappyPaisaService) DeductFunds(req DeductFundsRequest) (*TransactionResponse, error) {
	wallet, err := s.GetOrCreateWallet(req.UserID)
	if err != nil {
		return &TransactionResponse{Success: false, Message: err.Error()}, err
	}

	// Check sufficient balance
	if wallet.Balance < req.Amount {
		return &TransactionResponse{
			Success: false,
			Message: "Insufficient balance",
			Balance: wallet.Balance,
		}, nil
	}

	// Create transaction record
	transaction := &Transaction{
		WalletID:        wallet.ID,
		UserID:          req.UserID,
		Amount:          -req.Amount, // Negative for deduction
		TransactionType: "debit",
		Description:     fmt.Sprintf("Funds deducted: %s", req.Reason),
		ReferenceID:     req.ReferenceID,
		Status:          "completed",
	}

	err = s.db.CreateTransaction(transaction)
	if err != nil {
		return &TransactionResponse{Success: false, Message: "Failed to create transaction"}, err
	}

	// Update wallet balance
	newBalance := wallet.Balance - req.Amount
	newTotalSpent := wallet.TotalSpent + req.Amount

	err = s.db.UpdateWalletBalance(wallet.ID, newBalance, wallet.TotalEarned, newTotalSpent)
	if err != nil {
		return &TransactionResponse{Success: false, Message: "Failed to update balance"}, err
	}

	log.Printf("Deducted %.2f Happy Paisa from user %s, new balance: %.2f", req.Amount, req.UserID, newBalance)

	return &TransactionResponse{
		Success:       true,
		TransactionID: transaction.ID,
		Message:       "Funds deducted successfully",
		Balance:       newBalance,
		Transaction:   transaction,
	}, nil
}

func (s *HappyPaisaService) Transfer(req TransferRequest) (*TransactionResponse, error) {
	// Get sender wallet
	senderWallet, err := s.GetOrCreateWallet(req.FromUserID)
	if err != nil {
		return &TransactionResponse{Success: false, Message: "Failed to get sender wallet"}, err
	}

	// Check sufficient balance
	if senderWallet.Balance < req.Amount {
		return &TransactionResponse{
			Success: false,
			Message: "Insufficient balance",
			Balance: senderWallet.Balance,
		}, nil
	}

	// Get or create recipient wallet
	recipientWallet, err := s.GetOrCreateWallet(req.ToUserID)
	if err != nil {
		return &TransactionResponse{Success: false, Message: "Failed to get recipient wallet"}, err
	}

	// Create sender transaction (debit)
	senderTx := &Transaction{
		WalletID:        senderWallet.ID,
		UserID:          req.FromUserID,
		Amount:          -req.Amount,
		TransactionType: "transfer_out",
		Description:     fmt.Sprintf("Transfer to user %s: %s", req.ToUserID, req.Description),
		RecipientID:     &req.ToUserID,
		ReferenceID:     req.ReferenceID,
		Status:          "completed",
	}

	err = s.db.CreateTransaction(senderTx)
	if err != nil {
		return &TransactionResponse{Success: false, Message: "Failed to create sender transaction"}, err
	}

	// Create recipient transaction (credit)
	recipientTx := &Transaction{
		WalletID:        recipientWallet.ID,
		UserID:          req.ToUserID,
		Amount:          req.Amount,
		TransactionType: "transfer_in",
		Description:     fmt.Sprintf("Transfer from user %s: %s", req.FromUserID, req.Description),
		RecipientID:     &req.FromUserID,
		ReferenceID:     req.ReferenceID,
		Status:          "completed",
	}

	err = s.db.CreateTransaction(recipientTx)
	if err != nil {
		return &TransactionResponse{Success: false, Message: "Failed to create recipient transaction"}, err
	}

	// Update sender balance
	newSenderBalance := senderWallet.Balance - req.Amount
	newSenderSpent := senderWallet.TotalSpent + req.Amount

	err = s.db.UpdateWalletBalance(senderWallet.ID, newSenderBalance, senderWallet.TotalEarned, newSenderSpent)
	if err != nil {
		return &TransactionResponse{Success: false, Message: "Failed to update sender balance"}, err
	}

	// Update recipient balance
	newRecipientBalance := recipientWallet.Balance + req.Amount
	newRecipientEarned := recipientWallet.TotalEarned + req.Amount

	err = s.db.UpdateWalletBalance(recipientWallet.ID, newRecipientBalance, newRecipientEarned, recipientWallet.TotalSpent)
	if err != nil {
		return &TransactionResponse{Success: false, Message: "Failed to update recipient balance"}, err
	}

	log.Printf("Transfer completed: %.2f Happy Paisa from %s to %s", req.Amount, req.FromUserID, req.ToUserID)

	return &TransactionResponse{
		Success:       true,
		TransactionID: senderTx.ID,
		Message:       "Transfer completed successfully",
		Balance:       newSenderBalance,
		Transaction:   senderTx,
	}, nil
}

func (s *HappyPaisaService) GetTransactions(userID uuid.UUID, limit int) ([]Transaction, error) {
	if limit <= 0 || limit > 100 {
		limit = 50 // Default limit
	}

	return s.db.GetTransactionsByUserID(userID, limit)
}

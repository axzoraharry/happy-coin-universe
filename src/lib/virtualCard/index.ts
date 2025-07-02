
import { CardManagementService } from './cardManagement';
import { CardValidationService } from './cardValidation';
import { TransactionService } from './transactionService';
import { EnhancedTransactionService } from './enhancedTransactionService';

// Re-export all types
export * from './types';

// Main API class that delegates to specialized services
export class VirtualCardAPI {
  // Card Management methods
  static async issueVirtualCard(params: {
    pin: string;
    daily_limit?: number;
    monthly_limit?: number;
  }) {
    return CardManagementService.issueVirtualCard(params);
  }

  static async getUserCards() {
    return CardManagementService.getUserCards();
  }

  static async updateCardStatus(cardId: string, newStatus: 'active' | 'inactive' | 'blocked' | 'expired') {
    return CardManagementService.updateCardStatus(cardId, newStatus);
  }

  static async deleteVirtualCard(cardId: string) {
    return CardManagementService.deleteVirtualCard(cardId);
  }

  // Card Validation methods
  static async validateCard(params: {
    card_number: string;
    pin: string;
    ip_address?: string;
    user_agent?: string;
  }) {
    return CardValidationService.validateCard(params);
  }

  static async getCardStatus(cardId: string) {
    return CardValidationService.getCardStatus(cardId);
  }

  // Transaction methods (legacy - using card IDs)
  static async getCardTransactions(cardId?: string) {
    return TransactionService.getCardTransactions(cardId);
  }

  static async recordTransaction(params: {
    card_id: string;
    transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
    amount?: number;
    description?: string;
    merchant_info?: Record<string, any>;
    reference_id?: string;
    metadata?: Record<string, any>;
  }) {
    return TransactionService.recordTransaction(params);
  }

  static async processPayment(params: {
    card_number: string;
    pin: string;
    amount: number;
    merchant_id: string;
    description?: string;
    ip_address?: string;
    user_agent?: string;
  }) {
    return TransactionService.processPayment(params);
  }

  static async getCardBalance(cardId: string) {
    return TransactionService.getCardBalance(cardId);
  }

  // Enhanced Transaction methods (using card numbers)
  static async processTransactionByNumber(params: {
    card_number: string;
    transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
    amount?: number;
    description?: string;
    merchant_info?: Record<string, any>;
    reference_id?: string;
    user_id?: string;
  }) {
    return EnhancedTransactionService.processTransaction(params);
  }

  static async validateTransactionLimitsByNumber(params: {
    card_number: string;
    amount: number;
    user_id?: string;
  }) {
    return EnhancedTransactionService.validateTransactionLimits(params);
  }

  static async getCardByNumber(cardNumber: string, userId?: string) {
    return EnhancedTransactionService.getCardByNumber(cardNumber, userId);
  }
}

// Export individual services for direct use if needed
export { CardManagementService, CardValidationService, TransactionService, EnhancedTransactionService };

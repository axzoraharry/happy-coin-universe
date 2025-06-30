
export interface VirtualCard {
  id: string;
  user_id: string;
  card_number?: string; // Only available during issuance
  cvv?: string; // Only available during issuance
  masked_card_number?: string; // New field for secure display
  expiry_date: string;
  status: 'active' | 'inactive' | 'blocked' | 'expired';
  card_type: 'virtual' | 'physical';
  issuer_name: string;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
  activation_date?: string;
  daily_limit: number;
  monthly_limit: number;
  current_daily_spent: number;
  current_monthly_spent: number;
  metadata: Record<string, any>;
}

export interface VirtualCardTransaction {
  id: string;
  card_id: string;
  user_id: string;
  transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
  amount: number;
  description?: string;
  merchant_info: Record<string, any>;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference_id?: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface CardAccessLog {
  id: string;
  card_id: string;
  user_id: string;
  access_type: 'view_details' | 'copy_number' | 'copy_cvv' | 'status_change' | 'delete';
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  created_at: string;
}

export interface CardValidationResult {
  success: boolean;
  card_id?: string;
  user_id?: string;
  status?: string;
  daily_limit?: number;
  monthly_limit?: number;
  daily_spent?: number;
  monthly_spent?: number;
  cards_checked?: number;
  error?: string;
}

export interface CardIssuanceResult {
  success: boolean;
  card_id?: string;
  card_number?: string;
  cvv?: string;
  expiry_date?: string;
  masked_card_number?: string; // New field
  status?: string;
  daily_limit?: number;
  monthly_limit?: number;
  error?: string;
}

export interface CardStatusUpdateResult {
  success: boolean;
  card_id?: string;
  new_status?: string;
  updated_at?: string;
  error?: string;
}

export interface CardDeleteResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CardBalanceResult {
  success: boolean;
  daily_limit?: number;
  monthly_limit?: number;
  daily_spent?: number;
  monthly_spent?: number;
  daily_remaining?: number;
  monthly_remaining?: number;
  error?: string;
}

export interface CardStatusResult {
  success: boolean;
  card?: VirtualCard;
  validation_attempts_today?: number;
  last_validation?: string;
  error?: string;
}

export interface PaymentResult {
  success: boolean;
  transaction_id?: string;
  error?: string;
}

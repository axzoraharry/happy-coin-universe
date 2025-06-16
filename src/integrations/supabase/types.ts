export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          allowed_domains: string[] | null
          api_key: string
          application_name: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          last_used_at: string | null
          secret_key: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          allowed_domains?: string[] | null
          api_key: string
          application_name: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          secret_key: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          allowed_domains?: string[] | null
          api_key?: string
          application_name?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          secret_key?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      coin_exchanges: {
        Row: {
          amount_received: number
          coins_spent: number
          created_at: string
          exchange_rate: number
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount_received: number
          coins_spent: number
          created_at?: string
          exchange_rate: number
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_received?: number
          coins_spent?: number
          created_at?: string
          exchange_rate?: number
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          coin_reward: number
          created_at: string
          description: string
          expires_at: string | null
          id: string
          is_active: boolean
          offer_type: string
          title: string
        }
        Insert: {
          coin_reward?: number
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          offer_type: string
          title: string
        }
        Update: {
          coin_reward?: number
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          offer_type?: string
          title?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          api_key_id: string
          callback_url: string | null
          created_at: string
          description: string | null
          external_order_id: string
          id: string
          metadata: Json | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          api_key_id: string
          callback_url?: string | null
          created_at?: string
          description?: string | null
          external_order_id: string
          id?: string
          metadata?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          api_key_id?: string
          callback_url?: string | null
          created_at?: string
          description?: string | null
          external_order_id?: string
          id?: string
          metadata?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          referral_code: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_awarded: boolean
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          bonus_awarded?: boolean
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          bonus_awarded?: boolean
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      sso_access_tokens: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          revoked: boolean
          scope: string | null
          token: string
          user_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at: string
          id?: string
          revoked?: boolean
          scope?: string | null
          token: string
          user_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          revoked?: boolean
          scope?: string | null
          token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sso_auth_codes: {
        Row: {
          client_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          redirect_uri: string
          scope: string | null
          state: string | null
          used: boolean
          user_id: string | null
        }
        Insert: {
          client_id: string
          code: string
          created_at?: string
          expires_at: string
          id?: string
          redirect_uri: string
          scope?: string | null
          state?: string | null
          used?: boolean
          user_id?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri?: string
          scope?: string | null
          state?: string | null
          used?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      transaction_pins: {
        Row: {
          created_at: string
          id: string
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pin_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          recipient_id: string | null
          reference_id: string | null
          status: string
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          recipient_id?: string | null
          reference_id?: string | null
          status?: string
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          recipient_id?: string | null
          reference_id?: string | null
          status?: string
          transaction_type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coins: {
        Row: {
          created_at: string
          earned_today: number
          id: string
          last_daily_claim: string | null
          total_coins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          earned_today?: number
          id?: string
          last_daily_claim?: string | null
          total_coins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          earned_today?: number
          id?: string
          last_daily_claim?: string | null
          total_coins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_offers: {
        Row: {
          coins_earned: number
          completed_at: string
          id: string
          offer_id: string
          user_id: string
        }
        Insert: {
          coins_earned?: number
          completed_at?: string
          id?: string
          offer_id: string
          user_id: string
        }
        Update: {
          coins_earned?: number
          completed_at?: string
          id?: string
          offer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          last_sign_in: string | null
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          last_sign_in?: string | null
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          last_sign_in?: string | null
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          api_key_id: string
          attempt_count: number
          created_at: string
          id: string
          payload: Json
          payment_request_id: string | null
          response_body: string | null
          response_status: number | null
          success: boolean
          webhook_url: string
        }
        Insert: {
          api_key_id: string
          attempt_count?: number
          created_at?: string
          id?: string
          payload: Json
          payment_request_id?: string | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_url: string
        }
        Update: {
          api_key_id?: string
          attempt_count?: number
          created_at?: string
          id?: string
          payload?: Json
          payment_request_id?: string | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_completely: {
        Args: { p_user_id: string }
        Returns: Json
      }
      delete_user_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
      exchange_coins_to_balance: {
        Args: {
          p_user_id: string
          p_coins_to_exchange: number
          p_exchange_rate?: number
        }
        Returns: Json
      }
      generate_api_keys: {
        Args: {
          p_user_id: string
          p_application_name: string
          p_webhook_url?: string
          p_allowed_domains?: string[]
        }
        Returns: Json
      }
      process_external_payment: {
        Args: {
          p_api_key: string
          p_external_order_id: string
          p_user_email: string
          p_amount: number
          p_description?: string
          p_callback_url?: string
          p_metadata?: Json
        }
        Returns: Json
      }
      process_external_payment_secure: {
        Args: {
          p_api_key: string
          p_external_order_id: string
          p_user_email: string
          p_amount: number
          p_description?: string
          p_callback_url?: string
          p_metadata?: Json
          p_user_pin?: string
        }
        Returns: Json
      }
      process_referral: {
        Args: { p_referred_user_id: string; p_referral_code: string }
        Returns: Json
      }
      process_secure_wallet_transfer: {
        Args: {
          sender_id: string
          recipient_id: string
          transfer_amount: number
          transfer_description?: string
          sender_pin?: string
        }
        Returns: Json
      }
      process_wallet_transfer: {
        Args: {
          sender_id: string
          recipient_id: string
          transfer_amount: number
          transfer_description?: string
        }
        Returns: Json
      }
      reactivate_user_account: {
        Args: { p_user_id: string }
        Returns: Json
      }
      reset_daily_coins: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_secure_transaction_pin: {
        Args: { p_user_id: string; p_pin: string }
        Returns: Json
      }
      verify_transaction_pin: {
        Args: { p_user_id: string; p_pin: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

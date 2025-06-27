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
      card_validation_attempts: {
        Row: {
          card_number_hash: string
          created_at: string
          id: string
          ip_address: string | null
          pin_attempt_hash: string
          success: boolean
          user_agent: string | null
        }
        Insert: {
          card_number_hash: string
          created_at?: string
          id?: string
          ip_address?: string | null
          pin_attempt_hash: string
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          card_number_hash?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          pin_attempt_hash?: string
          success?: boolean
          user_agent?: string | null
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
      happy_auto_users: {
        Row: {
          created_at: string
          id: number
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      happy_paisa_purchases: {
        Row: {
          amount_happy_paisa: number
          amount_usd: number
          created_at: string
          exchange_rate: number
          id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_happy_paisa: number
          amount_usd: number
          created_at?: string
          exchange_rate?: number
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_happy_paisa?: number
          amount_usd?: number
          created_at?: string
          exchange_rate?: number
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      happy_paisa_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          recipient_id: string | null
          reference_id: string | null
          status: string
          transaction_type: string
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          recipient_id?: string | null
          reference_id?: string | null
          status?: string
          transaction_type: string
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          recipient_id?: string | null
          reference_id?: string | null
          status?: string
          transaction_type?: string
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "happy_paisa_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "happy_paisa_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_paisa_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_purchased: number
          total_spent: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_spent?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_spent?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      network_data: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          name: string
          segment: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          name: string
          segment?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          name?: string
          segment?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      properties: {
        Row: {
          address: string
          agent_id: string | null
          bathrooms: number
          bedrooms: number
          created_at: string | null
          description: string | null
          features: string[] | null
          garage_spaces: number | null
          has_fireplace: boolean | null
          has_pool: boolean | null
          id: string
          images: string[] | null
          latitude: number | null
          listing_date: string | null
          longitude: number | null
          lot_size: number | null
          mls_number: string | null
          neighborhood: string
          price: number
          property_type: string
          school_district: string | null
          square_footage: number
          status: string | null
          title: string
          updated_at: string | null
          updated_kitchen: boolean | null
          year_built: number | null
        }
        Insert: {
          address: string
          agent_id?: string | null
          bathrooms: number
          bedrooms: number
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          garage_spaces?: number | null
          has_fireplace?: boolean | null
          has_pool?: boolean | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          listing_date?: string | null
          longitude?: number | null
          lot_size?: number | null
          mls_number?: string | null
          neighborhood: string
          price: number
          property_type: string
          school_district?: string | null
          square_footage: number
          status?: string | null
          title: string
          updated_at?: string | null
          updated_kitchen?: boolean | null
          year_built?: number | null
        }
        Update: {
          address?: string
          agent_id?: string | null
          bathrooms?: number
          bedrooms?: number
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          garage_spaces?: number | null
          has_fireplace?: boolean | null
          has_pool?: boolean | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          listing_date?: string | null
          longitude?: number | null
          lot_size?: number | null
          mls_number?: string | null
          neighborhood?: string
          price?: number
          property_type?: string
          school_district?: string | null
          square_footage?: number
          status?: string | null
          title?: string
          updated_at?: string | null
          updated_kitchen?: boolean | null
          year_built?: number | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          requests: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          requests?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          requests?: number
          window_start?: string
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
          api_key_id: string
          created_at: string
          expires_at: string
          id: string
          scope: string | null
          token: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          expires_at: string
          id?: string
          scope?: string | null
          token: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          scope?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_access_tokens_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_auth_codes: {
        Row: {
          api_key_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          redirect_uri: string
          scope: string | null
          state: string | null
          used_at: string | null
        }
        Insert: {
          api_key_id: string
          code: string
          created_at?: string
          expires_at: string
          id?: string
          redirect_uri: string
          scope?: string | null
          state?: string | null
          used_at?: string | null
        }
        Update: {
          api_key_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri?: string
          scope?: string | null
          state?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_auth_codes_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
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
      user_preferences: {
        Row: {
          active_segment: string | null
          created_at: string | null
          id: string
          preferred_layout: string | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active_segment?: string | null
          created_at?: string | null
          id?: string
          preferred_layout?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active_segment?: string | null
          created_at?: string | null
          id?: string
          preferred_layout?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      virtual_card_transactions: {
        Row: {
          amount: number | null
          card_id: string
          created_at: string
          description: string | null
          id: string
          merchant_info: Json | null
          metadata: Json | null
          reference_id: string | null
          status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          card_id: string
          created_at?: string
          description?: string | null
          id?: string
          merchant_info?: Json | null
          metadata?: Json | null
          reference_id?: string | null
          status?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number | null
          card_id?: string
          created_at?: string
          description?: string | null
          id?: string
          merchant_info?: Json | null
          metadata?: Json | null
          reference_id?: string | null
          status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_card_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "virtual_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_cards: {
        Row: {
          activation_date: string | null
          card_number_encrypted: string
          card_type: string
          created_at: string
          current_daily_spent: number | null
          current_monthly_spent: number | null
          cvv_encrypted: string
          daily_limit: number | null
          expiry_date: string
          id: string
          issuer_name: string
          last_used_at: string | null
          metadata: Json | null
          monthly_limit: number | null
          pin_hash: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activation_date?: string | null
          card_number_encrypted: string
          card_type?: string
          created_at?: string
          current_daily_spent?: number | null
          current_monthly_spent?: number | null
          cvv_encrypted: string
          daily_limit?: number | null
          expiry_date: string
          id?: string
          issuer_name?: string
          last_used_at?: string | null
          metadata?: Json | null
          monthly_limit?: number | null
          pin_hash: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activation_date?: string | null
          card_number_encrypted?: string
          card_type?: string
          created_at?: string
          current_daily_spent?: number | null
          current_monthly_spent?: number | null
          cvv_encrypted?: string
          daily_limit?: number | null
          expiry_date?: string
          id?: string
          issuer_name?: string
          last_used_at?: string | null
          metadata?: Json | null
          monthly_limit?: number | null
          pin_hash?: string
          status?: string
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
      armor: {
        Args: { "": string }
        Returns: string
      }
      cleanup_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      dearmor: {
        Args: { "": string }
        Returns: string
      }
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
      gen_random_bytes: {
        Args: { "": number }
        Returns: string
      }
      gen_random_uuid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gen_salt: {
        Args: { "": string }
        Returns: string
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
      generate_card_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_cvv: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      issue_virtual_card: {
        Args: {
          p_user_id: string
          p_pin: string
          p_daily_limit?: number
          p_monthly_limit?: number
        }
        Returns: Json
      }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      pgp_key_id: {
        Args: { "": string }
        Returns: string
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
      process_happy_paisa_purchase: {
        Args: {
          p_user_id: string
          p_stripe_session_id: string
          p_amount_usd: number
          p_amount_happy_paisa: number
          p_exchange_rate: number
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
      process_secure_wallet_transfer_v2: {
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
      reset_transaction_pin_with_password: {
        Args: {
          p_user_id: string
          p_current_password: string
          p_new_pin: string
        }
        Returns: Json
      }
      set_secure_transaction_pin: {
        Args: { p_user_id: string; p_pin: string }
        Returns: Json
      }
      spend_happy_paisa: {
        Args: {
          p_user_id: string
          p_amount: number
          p_description: string
          p_reference_id?: string
        }
        Returns: Json
      }
      transfer_happy_paisa: {
        Args: {
          p_sender_id: string
          p_recipient_email: string
          p_amount: number
          p_description?: string
        }
        Returns: Json
      }
      update_card_status: {
        Args: { p_user_id: string; p_card_id: string; p_new_status: string }
        Returns: Json
      }
      update_user_preferences: {
        Args: { new_preferences: Json }
        Returns: undefined
      }
      validate_api_key_format: {
        Args: { p_api_key: string }
        Returns: boolean
      }
      validate_redirect_uri: {
        Args: { p_uri: string; p_allowed_domains: string[] }
        Returns: boolean
      }
      validate_virtual_card: {
        Args: {
          p_card_number: string
          p_pin: string
          p_ip_address?: string
          p_user_agent?: string
        }
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

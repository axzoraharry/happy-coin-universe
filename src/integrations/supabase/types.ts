export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_automation_preferences: {
        Row: {
          auto_categorization: boolean
          automation_level: string
          created_at: string
          fraud_detection: boolean
          id: string
          savings_recommendations: boolean
          spending_alerts: boolean
          updated_at: string
          user_id: string
          voice_assistant: boolean
        }
        Insert: {
          auto_categorization?: boolean
          automation_level?: string
          created_at?: string
          fraud_detection?: boolean
          id?: string
          savings_recommendations?: boolean
          spending_alerts?: boolean
          updated_at?: string
          user_id: string
          voice_assistant?: boolean
        }
        Update: {
          auto_categorization?: boolean
          automation_level?: string
          created_at?: string
          fraud_detection?: boolean
          id?: string
          savings_recommendations?: boolean
          spending_alerts?: boolean
          updated_at?: string
          user_id?: string
          voice_assistant?: boolean
        }
        Relationships: []
      }
      amadeus_config: {
        Row: {
          api_key: string
          api_secret: string
          created_at: string
          environment: string
          id: string
          updated_at: string
        }
        Insert: {
          api_key: string
          api_secret: string
          created_at?: string
          environment?: string
          id?: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          api_secret?: string
          created_at?: string
          environment?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      automation_workflows: {
        Row: {
          actions: Json | null
          created_at: string
          execution_count: number
          id: string
          is_active: boolean
          last_executed: string | null
          n8n_workflow_id: string | null
          trigger_conditions: Json | null
          updated_at: string
          user_id: string
          workflow_name: string
          workflow_type: string
        }
        Insert: {
          actions?: Json | null
          created_at?: string
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed?: string | null
          n8n_workflow_id?: string | null
          trigger_conditions?: Json | null
          updated_at?: string
          user_id: string
          workflow_name: string
          workflow_type: string
        }
        Update: {
          actions?: Json | null
          created_at?: string
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed?: string | null
          n8n_workflow_id?: string | null
          trigger_conditions?: Json | null
          updated_at?: string
          user_id?: string
          workflow_name?: string
          workflow_type?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_data: Json
          booking_reference: string | null
          booking_type: string
          created_at: string
          currency: string
          id: string
          status: string
          total_amount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_data: Json
          booking_reference?: string | null
          booking_type: string
          created_at?: string
          currency?: string
          id?: string
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_data?: Json
          booking_reference?: string | null
          booking_type?: string
          created_at?: string
          currency?: string
          id?: string
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      card_access_logs: {
        Row: {
          access_type: string
          card_id: string
          created_at: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          card_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          card_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_access_logs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_transaction_analytics"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "card_access_logs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "virtual_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_transaction_webhooks: {
        Row: {
          attempts: number | null
          card_id: string | null
          created_at: string
          event_type: string
          id: string
          last_attempt_at: string | null
          payload: Json
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          attempts?: number | null
          card_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          last_attempt_at?: string | null
          payload: Json
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          attempts?: number | null
          card_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          last_attempt_at?: string | null
          payload?: Json
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_transaction_webhooks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_transaction_analytics"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "card_transaction_webhooks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "virtual_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transaction_webhooks_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "virtual_card_transactions"
            referencedColumns: ["id"]
          },
        ]
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
      flight_searches: {
        Row: {
          cabin_class: string
          created_at: string
          departure_date: string
          destination: string
          id: string
          origin: string
          passengers: number
          return_date: string | null
          search_results: Json | null
          user_id: string | null
        }
        Insert: {
          cabin_class?: string
          created_at?: string
          departure_date: string
          destination: string
          id?: string
          origin: string
          passengers?: number
          return_date?: string | null
          search_results?: Json | null
          user_id?: string | null
        }
        Update: {
          cabin_class?: string
          created_at?: string
          departure_date?: string
          destination?: string
          id?: string
          origin?: string
          passengers?: number
          return_date?: string | null
          search_results?: Json | null
          user_id?: string | null
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
      happy_paisa_accounts: {
        Row: {
          created_at: string
          hp_balance: number
          id: string
          inr_equivalent: number | null
          is_active: boolean
          stellar_address: string
          stellar_secret_encrypted: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hp_balance?: number
          id?: string
          inr_equivalent?: number | null
          is_active?: boolean
          stellar_address: string
          stellar_secret_encrypted: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hp_balance?: number
          id?: string
          inr_equivalent?: number | null
          is_active?: boolean
          stellar_address?: string
          stellar_secret_encrypted?: string
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
      hotel_searches: {
        Row: {
          check_in_date: string
          check_out_date: string
          city_code: string
          created_at: string
          guests: number
          id: string
          rooms: number
          search_results: Json | null
          user_id: string | null
        }
        Insert: {
          check_in_date: string
          check_out_date: string
          city_code: string
          created_at?: string
          guests?: number
          id?: string
          rooms?: number
          search_results?: Json | null
          user_id?: string | null
        }
        Update: {
          check_in_date?: string
          check_out_date?: string
          city_code?: string
          created_at?: string
          guests?: number
          id?: string
          rooms?: number
          search_results?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      hp_conversion_rates: {
        Row: {
          created_at: string
          effective_from: string
          hp_to_inr_rate: number
          id: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          effective_from?: string
          hp_to_inr_rate?: number
          id?: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          effective_from?: string
          hp_to_inr_rate?: number
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      hp_transactions: {
        Row: {
          created_at: string
          fee_hp: number | null
          from_address: string | null
          hp_amount: number
          id: string
          inr_amount: number | null
          memo: string | null
          status: string
          stellar_ledger: number | null
          stellar_transaction_id: string
          to_address: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fee_hp?: number | null
          from_address?: string | null
          hp_amount: number
          id?: string
          inr_amount?: number | null
          memo?: string | null
          status?: string
          stellar_ledger?: number | null
          stellar_transaction_id: string
          to_address?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          fee_hp?: number | null
          from_address?: string | null
          hp_amount?: number
          id?: string
          inr_amount?: number | null
          memo?: string | null
          status?: string
          stellar_ledger?: number | null
          stellar_transaction_id?: string
          to_address?: string | null
          transaction_type?: string
          user_id?: string
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
      stellar_config: {
        Row: {
          asset_code: string
          asset_issuer: string | null
          created_at: string
          horizon_url: string
          id: string
          is_active: boolean
          network_name: string
        }
        Insert: {
          asset_code?: string
          asset_issuer?: string | null
          created_at?: string
          horizon_url?: string
          id?: string
          is_active?: boolean
          network_name?: string
        }
        Update: {
          asset_code?: string
          asset_issuer?: string | null
          created_at?: string
          horizon_url?: string
          id?: string
          is_active?: boolean
          network_name?: string
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
            referencedRelation: "card_transaction_analytics"
            referencedColumns: ["card_id"]
          },
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
          ai_fraud_protection: boolean
          card_number_encrypted: string
          card_type: string
          created_at: string
          current_daily_spent: number | null
          current_monthly_spent: number | null
          cvv_encrypted: string
          daily_limit: number | null
          expires_at: string | null
          expiry_date: string
          id: string
          is_temporary: boolean
          issuer_name: string
          last_transaction_at: string | null
          last_used_at: string | null
          masked_card_number: string
          merchant_restrictions: Json | null
          metadata: Json | null
          monthly_limit: number | null
          pin_hash: string
          status: string
          total_transactions: number | null
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          activation_date?: string | null
          ai_fraud_protection?: boolean
          card_number_encrypted: string
          card_type?: string
          created_at?: string
          current_daily_spent?: number | null
          current_monthly_spent?: number | null
          cvv_encrypted: string
          daily_limit?: number | null
          expires_at?: string | null
          expiry_date: string
          id?: string
          is_temporary?: boolean
          issuer_name?: string
          last_transaction_at?: string | null
          last_used_at?: string | null
          masked_card_number: string
          merchant_restrictions?: Json | null
          metadata?: Json | null
          monthly_limit?: number | null
          pin_hash: string
          status?: string
          total_transactions?: number | null
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          activation_date?: string | null
          ai_fraud_protection?: boolean
          card_number_encrypted?: string
          card_type?: string
          created_at?: string
          current_daily_spent?: number | null
          current_monthly_spent?: number | null
          cvv_encrypted?: string
          daily_limit?: number | null
          expires_at?: string | null
          expiry_date?: string
          id?: string
          is_temporary?: boolean
          issuer_name?: string
          last_transaction_at?: string | null
          last_used_at?: string | null
          masked_card_number?: string
          merchant_restrictions?: Json | null
          metadata?: Json | null
          monthly_limit?: number | null
          pin_hash?: string
          status?: string
          total_transactions?: number | null
          updated_at?: string
          usage_count?: number
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
      card_transaction_analytics: {
        Row: {
          card_id: string | null
          card_status: string | null
          daily_spent: number | null
          daily_transactions: number | null
          failed_transactions: number | null
          last_transaction_at: string | null
          masked_card_number: string | null
          monthly_spent: number | null
          total_purchases: number | null
          total_refunds: number | null
          total_transactions: number | null
          user_id: string | null
        }
        Relationships: []
      }
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
      get_card_by_number: {
        Args: { p_card_number: string; p_user_id?: string }
        Returns: {
          card_id: string
          user_id: string
          status: string
          daily_limit: number
          monthly_limit: number
          current_daily_spent: number
          current_monthly_spent: number
          expiry_date: string
          masked_card_number: string
        }[]
      }
      get_card_secure_details: {
        Args: {
          p_card_id: string
          p_user_pin: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: Json
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
      log_card_action: {
        Args: {
          p_card_id: string
          p_action_type: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: boolean
      }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      pgp_key_id: {
        Args: { "": string }
        Returns: string
      }
      process_card_transaction: {
        Args: {
          p_card_id: string
          p_transaction_type: string
          p_amount?: number
          p_description?: string
          p_merchant_info?: Json
          p_reference_id?: string
        }
        Returns: Json
      }
      process_card_transaction_by_number: {
        Args: {
          p_card_number: string
          p_transaction_type: string
          p_amount?: number
          p_description?: string
          p_merchant_info?: Json
          p_reference_id?: string
          p_user_id?: string
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
      validate_transaction_limits_by_number: {
        Args: { p_card_number: string; p_amount: number; p_user_id?: string }
        Returns: Json
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_financial_ledger: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string | null
          description: string | null
          entry_type: string
          id: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string | null
          description?: string | null
          entry_type: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string | null
          description?: string | null
          entry_type?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          level: number
          paid_at: string | null
          rate: number
          referred_id: string
          referrer_id: string
          source_transaction_id: string | null
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          level: number
          paid_at?: string | null
          rate: number
          referred_id: string
          referrer_id: string
          source_transaction_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          level?: number
          paid_at?: string | null
          rate?: number
          referred_id?: string
          referrer_id?: string
          source_transaction_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_source_transaction_id_fkey"
            columns: ["source_transaction_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_wallets: {
        Row: {
          available_balance: number
          created_at: string
          id: string
          pending_balance: number
          total_earnings: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          total_earnings?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          total_earnings?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          pix_key: string | null
          processed_at: string | null
          rejected_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          pix_key?: string | null
          processed_at?: string | null
          rejected_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          pix_key?: string | null
          processed_at?: string | null
          rejected_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_registry: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          edge_function: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          metrics: Json | null
          name: string
          role: string
          slug: string
          system_prompt: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          edge_function?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          metrics?: Json | null
          name: string
          role: string
          slug: string
          system_prompt: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          edge_function?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          metrics?: Json | null
          name?: string
          role?: string
          slug?: string
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      agentic_orders: {
        Row: {
          created_at: string
          id: string
          items: Json
          patient_id: string
          payment_method: string | null
          prescription_id: string | null
          regulatory_hash: string
          status: string | null
          total_amount: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          patient_id: string
          payment_method?: string | null
          prescription_id?: string | null
          regulatory_hash: string
          status?: string | null
          total_amount: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          patient_id?: string
          payment_method?: string | null
          prescription_id?: string | null
          regulatory_hash?: string
          status?: string | null
          total_amount?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_orders_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_events: {
        Row: {
          action: string | null
          ai_name: string
          compliance: Json | null
          created_at: string
          duration_ms: number | null
          event_type: string
          id: string
          input_data: Json | null
          output_data: Json | null
          session_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          action?: string | null
          ai_name: string
          compliance?: Json | null
          created_at?: string
          duration_ms?: number | null
          event_type: string
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          action?: string | null
          ai_name?: string
          compliance?: Json | null
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_personas: {
        Row: {
          active: boolean
          avatar_url: string | null
          channel: string
          created_at: string
          display_name: string
          id: string
          persona_key: string
          requires_payment: boolean
          system_prompt: string
          triggers_intents: string[] | null
          updated_at: string
          voice_tone: string | null
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          channel?: string
          created_at?: string
          display_name: string
          id?: string
          persona_key: string
          requires_payment?: boolean
          system_prompt: string
          triggers_intents?: string[] | null
          updated_at?: string
          voice_tone?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          channel?: string
          created_at?: string
          display_name?: string
          id?: string
          persona_key?: string
          requires_payment?: boolean
          system_prompt?: string
          triggers_intents?: string[] | null
          updated_at?: string
          voice_tone?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      ai_registry: {
        Row: {
          capabilities: string[] | null
          config: Json | null
          created_at: string
          id: string
          last_heartbeat: string | null
          name: string
          permission_level: string
          rate_limit_rpm: number | null
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          capabilities?: string[] | null
          config?: Json | null
          created_at?: string
          id?: string
          last_heartbeat?: string | null
          name: string
          permission_level?: string
          rate_limit_rpm?: number | null
          status?: string
          updated_at?: string
          version?: string
        }
        Update: {
          capabilities?: string[] | null
          config?: Json | null
          created_at?: string
          id?: string
          last_heartbeat?: string | null
          name?: string
          permission_level?: string
          rate_limit_rpm?: number | null
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      ai_token_usage: {
        Row: {
          cost: number
          created_at: string
          function_name: string
          id: string
          metadata: Json | null
          model: string | null
          tokens_used: number
          user_id: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          function_name: string
          id?: string
          metadata?: Json | null
          model?: string | null
          tokens_used?: number
          user_id?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          function_name?: string
          id?: string
          metadata?: Json | null
          model?: string | null
          tokens_used?: number
          user_id?: string | null
        }
        Relationships: []
      }
      alert_history: {
        Row: {
          alert_id: string | null
          channel: string
          delivered: boolean | null
          error_message: string | null
          id: string
          metadata: Json | null
          recipient: string | null
          sent_at: string
        }
        Insert: {
          alert_id?: string | null
          channel?: string
          delivered?: boolean | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient?: string | null
          sent_at?: string
        }
        Update: {
          alert_id?: string | null
          channel?: string
          delivered?: boolean | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "appointment_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      anvisa_dou_alerts: {
        Row: {
          created_at: string
          id: string
          notified: boolean
          summary: string | null
          term: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          notified?: boolean
          summary?: string | null
          term: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          notified?: boolean
          summary?: string | null
          term?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      anvisa_import_processes: {
        Row: {
          address_proof_url: string | null
          approved_at: string | null
          authorization_pdf_url: string | null
          created_at: string
          delivered_at: string | null
          dispatched_at: string | null
          doctor_crm: string | null
          doctor_id: string | null
          doctor_name: string | null
          id: string
          id_document_url: string | null
          in_transit_at: string | null
          international_tracking_code: string | null
          notes: string | null
          patient_cpf: string | null
          patient_id: string
          patient_name: string | null
          power_of_attorney_url: string | null
          prescription_id: string | null
          product_name: string | null
          protocol_number: string | null
          status: string
          submitted_at: string | null
          under_review_at: string | null
          updated_at: string
        }
        Insert: {
          address_proof_url?: string | null
          approved_at?: string | null
          authorization_pdf_url?: string | null
          created_at?: string
          delivered_at?: string | null
          dispatched_at?: string | null
          doctor_crm?: string | null
          doctor_id?: string | null
          doctor_name?: string | null
          id?: string
          id_document_url?: string | null
          in_transit_at?: string | null
          international_tracking_code?: string | null
          notes?: string | null
          patient_cpf?: string | null
          patient_id: string
          patient_name?: string | null
          power_of_attorney_url?: string | null
          prescription_id?: string | null
          product_name?: string | null
          protocol_number?: string | null
          status?: string
          submitted_at?: string | null
          under_review_at?: string | null
          updated_at?: string
        }
        Update: {
          address_proof_url?: string | null
          approved_at?: string | null
          authorization_pdf_url?: string | null
          created_at?: string
          delivered_at?: string | null
          dispatched_at?: string | null
          doctor_crm?: string | null
          doctor_id?: string | null
          doctor_name?: string | null
          id?: string
          id_document_url?: string | null
          in_transit_at?: string | null
          international_tracking_code?: string | null
          notes?: string | null
          patient_cpf?: string | null
          patient_id?: string
          patient_name?: string | null
          power_of_attorney_url?: string | null
          prescription_id?: string | null
          product_name?: string | null
          protocol_number?: string | null
          status?: string
          submitted_at?: string | null
          under_review_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_downloads: {
        Row: {
          created_at: string
          id: string
          manychat_name: string | null
          manychat_user_id: string | null
          metadata: Json | null
          platform: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          manychat_name?: string | null
          manychat_user_id?: string | null
          metadata?: Json | null
          platform?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          manychat_name?: string | null
          manychat_user_id?: string | null
          metadata?: Json | null
          platform?: string | null
          source?: string | null
        }
        Relationships: []
      }
      appointment_alerts: {
        Row: {
          alert_type: string
          appointment_id: string | null
          created_at: string
          doctor_id: string | null
          id: string
          message: string
          patient_id: string
          priority: string
          scheduled_for: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          alert_type?: string
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          message: string
          patient_id: string
          priority?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          message?: string
          patient_id?: string
          priority?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_alerts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_alerts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["appointment_id"]
          },
        ]
      }
      appointments: {
        Row: {
          amount: number
          cancellation_reason: string | null
          created_at: string
          doctor_id: string
          duration_minutes: number
          id: string
          notes: string | null
          organization_id: string | null
          patient_id: string
          payment_id: string | null
          payment_status: string
          scheduled_at: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          cancellation_reason?: string | null
          created_at?: string
          doctor_id: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          organization_id?: string | null
          patient_id: string
          payment_id?: string | null
          payment_status?: string
          scheduled_at: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cancellation_reason?: string | null
          created_at?: string
          doctor_id?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          organization_id?: string | null
          patient_id?: string
          payment_id?: string | null
          payment_status?: string
          scheduled_at?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      automation_flows: {
        Row: {
          category: string
          clicks: number | null
          conversions: number | null
          created_at: string
          ctr: number | null
          description: string | null
          error_log: string | null
          id: string
          impressions: number | null
          last_triggered_at: string | null
          metadata: Json | null
          name: string
          platform: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          ctr?: number | null
          description?: string | null
          error_log?: string | null
          id?: string
          impressions?: number | null
          last_triggered_at?: string | null
          metadata?: Json | null
          name: string
          platform?: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          ctr?: number | null
          description?: string | null
          error_log?: string | null
          id?: string
          impressions?: number | null
          last_triggered_at?: string | null
          metadata?: Json | null
          name?: string
          platform?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author?: string
          category?: string
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      brand_assets: {
        Row: {
          active: boolean
          asset_key: string
          asset_url: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          active?: boolean
          asset_key: string
          asset_url: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          active?: boolean
          asset_key?: string
          asset_url?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      brand_identity: {
        Row: {
          brand_name: string
          created_at: string
          effective_from: string
          favicon_url: string
          icon_url: string
          id: string
          is_active: boolean
          legal_name: string
          logo_url: string
          notes: string | null
          primary_color: string
          secondary_color: string
          splash_url: string
          updated_at: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          effective_from?: string
          favicon_url: string
          icon_url: string
          id?: string
          is_active?: boolean
          legal_name: string
          logo_url: string
          notes?: string | null
          primary_color?: string
          secondary_color?: string
          splash_url: string
          updated_at?: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          effective_from?: string
          favicon_url?: string
          icon_url?: string
          id?: string
          is_active?: boolean
          legal_name?: string
          logo_url?: string
          notes?: string | null
          primary_color?: string
          secondary_color?: string
          splash_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      brisa_audio_config: {
        Row: {
          audio_enabled: boolean
          id: boolean
          monthly_budget_brl: number
          paused_reason: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          audio_enabled?: boolean
          id?: boolean
          monthly_budget_brl?: number
          paused_reason?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          audio_enabled?: boolean
          id?: boolean
          monthly_budget_brl?: number
          paused_reason?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      brisa_audio_usage: {
        Row: {
          channel: string
          contact_id: string | null
          cost_brl: number
          created_at: string
          error: string | null
          id: string
          intent: string | null
          phone: string | null
          reason: string | null
          success: boolean
          text_length: number
          voice_id: string
        }
        Insert: {
          channel?: string
          contact_id?: string | null
          cost_brl?: number
          created_at?: string
          error?: string | null
          id?: string
          intent?: string | null
          phone?: string | null
          reason?: string | null
          success?: boolean
          text_length: number
          voice_id: string
        }
        Update: {
          channel?: string
          contact_id?: string | null
          cost_brl?: number
          created_at?: string
          error?: string | null
          id?: string
          intent?: string | null
          phone?: string | null
          reason?: string | null
          success?: boolean
          text_length?: number
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brisa_audio_usage_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "brisa_unified_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      brisa_human_takeover: {
        Row: {
          contact_id: string
          expires_at: string
          reason: string | null
          taken_at: string | null
          taken_by: string
        }
        Insert: {
          contact_id: string
          expires_at: string
          reason?: string | null
          taken_at?: string | null
          taken_by: string
        }
        Update: {
          contact_id?: string
          expires_at?: string
          reason?: string | null
          taken_at?: string | null
          taken_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "brisa_human_takeover_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "brisa_unified_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      brisa_image_pool: {
        Row: {
          created_at: string
          id: string
          image_url: string
          last_used_at: string | null
          prompt: string
          theme: string | null
          used_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          last_used_at?: string | null
          prompt: string
          theme?: string | null
          used_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          last_used_at?: string | null
          prompt?: string
          theme?: string | null
          used_count?: number
        }
        Relationships: []
      }
      brisa_interaction_logs: {
        Row: {
          channel: string
          created_at: string
          error: string | null
          http_status: number | null
          id: string
          latency_ms: number | null
          message_in: string | null
          message_out: string | null
          meta: Json
          model: string | null
          provider: string | null
          status: string
          user_ref: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          error?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          message_in?: string | null
          message_out?: string | null
          meta?: Json
          model?: string | null
          provider?: string | null
          status?: string
          user_ref?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          error?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          message_in?: string | null
          message_out?: string | null
          meta?: Json
          model?: string | null
          provider?: string | null
          status?: string
          user_ref?: string | null
        }
        Relationships: []
      }
      brisa_orientacao_payments: {
        Row: {
          amount: number
          consultation_completed_at: string | null
          consultation_scheduled_at: string | null
          created_at: string
          doctor_notified_at: string | null
          external_reference: string
          id: string
          patient_email: string | null
          patient_name: string | null
          patient_notified_at: string | null
          patient_phone: string | null
          patient_user_id: string | null
          payment_id: string
          payout_released_at: string | null
          raw_payload: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          consultation_completed_at?: string | null
          consultation_scheduled_at?: string | null
          created_at?: string
          doctor_notified_at?: string | null
          external_reference: string
          id?: string
          patient_email?: string | null
          patient_name?: string | null
          patient_notified_at?: string | null
          patient_phone?: string | null
          patient_user_id?: string | null
          payment_id: string
          payout_released_at?: string | null
          raw_payload?: Json | null
          status: string
          updated_at?: string
        }
        Update: {
          amount?: number
          consultation_completed_at?: string | null
          consultation_scheduled_at?: string | null
          created_at?: string
          doctor_notified_at?: string | null
          external_reference?: string
          id?: string
          patient_email?: string | null
          patient_name?: string | null
          patient_notified_at?: string | null
          patient_phone?: string | null
          patient_user_id?: string | null
          payment_id?: string
          payout_released_at?: string | null
          raw_payload?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      brisa_triage_severity: {
        Row: {
          created_at: string
          id: string
          is_urgent: boolean
          lead_id: string | null
          notes: string | null
          notified_doctor_at: string | null
          red_flags: string[] | null
          severity_score: number
          symptoms: Json
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_urgent?: boolean
          lead_id?: string | null
          notes?: string | null
          notified_doctor_at?: string | null
          red_flags?: string[] | null
          severity_score?: number
          symptoms?: Json
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_urgent?: boolean
          lead_id?: string | null
          notes?: string | null
          notified_doctor_at?: string | null
          red_flags?: string[] | null
          severity_score?: number
          symptoms?: Json
          whatsapp?: string | null
        }
        Relationships: []
      }
      brisa_triages: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          id: string
          matched_doctor_id: string | null
          patient_id: string
          patient_info: Json | null
          pre_record: string | null
          session_id: string
          specialty: string | null
          status: string
          suggested_conditions: string[] | null
          symptoms: string
          triage_result: string | null
          updated_at: string
          urgency: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          matched_doctor_id?: string | null
          patient_id: string
          patient_info?: Json | null
          pre_record?: string | null
          session_id?: string
          specialty?: string | null
          status?: string
          suggested_conditions?: string[] | null
          symptoms: string
          triage_result?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          matched_doctor_id?: string | null
          patient_id?: string
          patient_info?: Json | null
          pre_record?: string | null
          session_id?: string
          specialty?: string | null
          status?: string
          suggested_conditions?: string[] | null
          symptoms?: string
          triage_result?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brisa_triages_matched_doctor_id_fkey"
            columns: ["matched_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      brisa_unified_contacts: {
        Row: {
          age_bracket: string
          created_at: string | null
          display_name: string | null
          facebook_psid: string | null
          first_seen_at: string | null
          funnel_stage: string | null
          id: string
          instagram_id: string | null
          instagram_username: string | null
          intent_history: Json | null
          last_channel: string | null
          last_message_at: string | null
          lead_classification: string | null
          metadata: Json | null
          phone_e164: string | null
          prefers_audio: boolean
          total_messages: number | null
          updated_at: string | null
          whatsapp_jid: string | null
        }
        Insert: {
          age_bracket?: string
          created_at?: string | null
          display_name?: string | null
          facebook_psid?: string | null
          first_seen_at?: string | null
          funnel_stage?: string | null
          id?: string
          instagram_id?: string | null
          instagram_username?: string | null
          intent_history?: Json | null
          last_channel?: string | null
          last_message_at?: string | null
          lead_classification?: string | null
          metadata?: Json | null
          phone_e164?: string | null
          prefers_audio?: boolean
          total_messages?: number | null
          updated_at?: string | null
          whatsapp_jid?: string | null
        }
        Update: {
          age_bracket?: string
          created_at?: string | null
          display_name?: string | null
          facebook_psid?: string | null
          first_seen_at?: string | null
          funnel_stage?: string | null
          id?: string
          instagram_id?: string | null
          instagram_username?: string | null
          intent_history?: Json | null
          last_channel?: string | null
          last_message_at?: string | null
          lead_classification?: string | null
          metadata?: Json | null
          phone_e164?: string | null
          prefers_audio?: boolean
          total_messages?: number | null
          updated_at?: string | null
          whatsapp_jid?: string | null
        }
        Relationships: []
      }
      brisa_unified_conversations: {
        Row: {
          audio_transcript: string | null
          channel: string
          contact_id: string
          content: string | null
          created_at: string | null
          direction: string
          external_message_id: string | null
          human_takeover_by: string | null
          id: string
          intent: string | null
          is_bot_handled: boolean | null
          message_type: string | null
          raw_payload: Json | null
          urgency_score: number | null
        }
        Insert: {
          audio_transcript?: string | null
          channel: string
          contact_id: string
          content?: string | null
          created_at?: string | null
          direction: string
          external_message_id?: string | null
          human_takeover_by?: string | null
          id?: string
          intent?: string | null
          is_bot_handled?: boolean | null
          message_type?: string | null
          raw_payload?: Json | null
          urgency_score?: number | null
        }
        Update: {
          audio_transcript?: string | null
          channel?: string
          contact_id?: string
          content?: string | null
          created_at?: string | null
          direction?: string
          external_message_id?: string | null
          human_takeover_by?: string | null
          id?: string
          intent?: string | null
          is_bot_handled?: boolean | null
          message_type?: string | null
          raw_payload?: Json | null
          urgency_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brisa_unified_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "brisa_unified_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      btc_payment_verifications: {
        Row: {
          btc_address: string
          confirmations: number
          confirmed_at: string | null
          created_at: string
          expected_amount_btc: number
          id: string
          order_id: string | null
          status: string
          tx_hash: string | null
          updated_at: string
        }
        Insert: {
          btc_address: string
          confirmations?: number
          confirmed_at?: string | null
          created_at?: string
          expected_amount_btc: number
          id?: string
          order_id?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
        }
        Update: {
          btc_address?: string
          confirmations?: number
          confirmed_at?: string | null
          created_at?: string
          expected_amount_btc?: number
          id?: string
          order_id?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      btc_subscriptions: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          email: string
          id: string
          plan_id: string
          plan_name: string
          status: string
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          email: string
          id?: string
          plan_id: string
          plan_name: string
          status?: string
          updated_at?: string
          user_id: string
          wallet_address?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          email?: string
          id?: string
          plan_id?: string
          plan_name?: string
          status?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      clinic_profiles: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          doctor_name: string
          domain: string | null
          email: string | null
          id: string
          logo_url: string | null
          owner_user_id: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          specialty: string
          tagline: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          doctor_name: string
          domain?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          owner_user_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          specialty: string
          tagline?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          doctor_name?: string
          domain?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          owner_user_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          specialty?: string
          tagline?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      clinical_outcomes: {
        Row: {
          created_at: string
          id: string
          mood: string
          notes: string | null
          symptom_level: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood?: string
          notes?: string | null
          symptom_level?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: string
          notes?: string | null
          symptom_level?: number
          user_id?: string
        }
        Relationships: []
      }
      club_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "club_post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      club_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          post_id: string | null
          title: string
          triggered_by_user_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          post_id?: string | null
          title: string
          triggered_by_user_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          post_id?: string | null
          title?: string
          triggered_by_user_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "club_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      club_post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          post_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "club_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      club_post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "club_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      club_posts: {
        Row: {
          comment_count: number | null
          content: string
          created_at: string | null
          id: string
          images: string[] | null
          likes_count: number | null
          share_count: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          likes_count?: number | null
          share_count?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          likes_count?: number | null
          share_count?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consultation_credit_audit: {
        Row: {
          amount: number | null
          audit_phone: string | null
          consultation_id: string
          created_at: string
          id: string
          patient_id: string
          payout_status: string
          professional_id: string
          rating_id: string | null
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          stars: number
          status: string
        }
        Insert: {
          amount?: number | null
          audit_phone?: string | null
          consultation_id: string
          created_at?: string
          id?: string
          patient_id: string
          payout_status?: string
          professional_id: string
          rating_id?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stars: number
          status: string
        }
        Update: {
          amount?: number | null
          audit_phone?: string | null
          consultation_id?: string
          created_at?: string
          id?: string
          patient_id?: string
          payout_status?: string
          professional_id?: string
          rating_id?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stars?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_credit_audit_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "consultation_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_offers: {
        Row: {
          accepted_at: string | null
          amount: number
          appointment_id: string | null
          consultation_type: string
          created_at: string
          distance_km: number | null
          doctor_id: string
          expires_at: string
          id: string
          patient_id: string
          patient_lat: number | null
          patient_lng: number | null
          payload: Json | null
          status: string
          triage_id: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          amount?: number
          appointment_id?: string | null
          consultation_type?: string
          created_at?: string
          distance_km?: number | null
          doctor_id: string
          expires_at?: string
          id?: string
          patient_id: string
          patient_lat?: number | null
          patient_lng?: number | null
          payload?: Json | null
          status?: string
          triage_id?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          amount?: number
          appointment_id?: string | null
          consultation_type?: string
          created_at?: string
          distance_km?: number | null
          doctor_id?: string
          expires_at?: string
          id?: string
          patient_id?: string
          patient_lat?: number | null
          patient_lng?: number | null
          payload?: Json | null
          status?: string
          triage_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_offers_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_offers_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "consultation_offers_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_queue: {
        Row: {
          amount: number | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          jitsi_room: string | null
          matched_at: string | null
          matched_doctor_id: string | null
          patient_id: string
          payment_confirmed: boolean | null
          payment_id: string | null
          priority: number | null
          specialty: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          jitsi_room?: string | null
          matched_at?: string | null
          matched_doctor_id?: string | null
          patient_id: string
          payment_confirmed?: boolean | null
          payment_id?: string | null
          priority?: number | null
          specialty?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          jitsi_room?: string | null
          matched_at?: string | null
          matched_doctor_id?: string | null
          patient_id?: string
          payment_confirmed?: boolean | null
          payment_id?: string | null
          priority?: number | null
          specialty?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultation_ratings: {
        Row: {
          amount: number | null
          comment: string | null
          consultation_id: string
          created_at: string
          id: string
          patient_id: string
          professional_id: string
          stars: number
        }
        Insert: {
          amount?: number | null
          comment?: string | null
          consultation_id: string
          created_at?: string
          id?: string
          patient_id: string
          professional_id: string
          stars: number
        }
        Update: {
          amount?: number | null
          comment?: string | null
          consultation_id?: string
          created_at?: string
          id?: string
          patient_id?: string
          professional_id?: string
          stars?: number
        }
        Relationships: []
      }
      consultations: {
        Row: {
          appointment_id: string | null
          copilot_summary: string | null
          created_at: string | null
          doctor_id: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          modality: string | null
          notes: string | null
          patient_feedback: string | null
          patient_id: string | null
          patient_rating: number | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          copilot_summary?: string | null
          created_at?: string | null
          doctor_id?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          modality?: string | null
          notes?: string | null
          patient_feedback?: string | null
          patient_id?: string | null
          patient_rating?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          copilot_summary?: string | null
          created_at?: string | null
          doctor_id?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          modality?: string | null
          notes?: string | null
          patient_feedback?: string | null
          patient_id?: string | null
          patient_rating?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversion_leads: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
          reference_id: string | null
          source: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          reference_id?: string | null
          source: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          reference_id?: string | null
          source?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cost_metrics: {
        Row: {
          created_at: string
          date: string
          id: string
          infrastructure_cost: number
          marketing_spend: number
          operational_cost: number
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          infrastructure_cost?: number
          marketing_spend?: number
          operational_cost?: number
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          infrastructure_cost?: number
          marketing_spend?: number
          operational_cost?: number
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cron_circuit_breaker: {
        Row: {
          consecutive_failures: number
          consecutive_successes: number
          cooldown_minutes: number
          created_at: string
          id: string
          job_name: string
          last_failure_at: string | null
          last_success_at: string | null
          notes: string | null
          opened_at: string | null
          state: string
          threshold: number
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number
          consecutive_successes?: number
          cooldown_minutes?: number
          created_at?: string
          id?: string
          job_name: string
          last_failure_at?: string | null
          last_success_at?: string | null
          notes?: string | null
          opened_at?: string | null
          state?: string
          threshold?: number
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number
          consecutive_successes?: number
          cooldown_minutes?: number
          created_at?: string
          id?: string
          job_name?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          notes?: string | null
          opened_at?: string | null
          state?: string
          threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      data_deletion_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      delivery_confirmations: {
        Row: {
          confirmed_at: string
          escrow_id: string
          id: string
          patient_id: string
          payout_triggered: boolean
        }
        Insert: {
          confirmed_at?: string
          escrow_id: string
          id?: string
          patient_id: string
          payout_triggered?: boolean
        }
        Update: {
          confirmed_at?: string
          escrow_id?: string
          id?: string
          patient_id?: string
          payout_triggered?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "delivery_confirmations_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_exams: {
        Row: {
          ai_diagnosis: Json | null
          created_at: string
          exam_type: string
          id: string
          results: Json | null
          risk_level: string | null
          user_id: string
        }
        Insert: {
          ai_diagnosis?: Json | null
          created_at?: string
          exam_type: string
          id?: string
          results?: Json | null
          risk_level?: string | null
          user_id: string
        }
        Update: {
          ai_diagnosis?: Json | null
          created_at?: string
          exam_type?: string
          id?: string
          results?: Json | null
          risk_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      doctor_availability: {
        Row: {
          appointment_id: string | null
          created_at: string
          doctor_id: string
          id: string
          reserved_by: string | null
          reserved_until: string | null
          slot_date: string
          status: string
          time_slot: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          reserved_by?: string | null
          reserved_until?: string | null
          slot_date: string
          status?: string
          time_slot: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          reserved_by?: string | null
          reserved_until?: string | null
          slot_date?: string
          status?: string
          time_slot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_availability_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_kyc_documents: {
        Row: {
          created_at: string
          doctor_user_id: string
          document_kind: string
          id: string
          mime_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
          verification_notes: string | null
          verification_status: string
        }
        Insert: {
          created_at?: string
          doctor_user_id: string
          document_kind: string
          id?: string
          mime_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
        }
        Update: {
          created_at?: string
          doctor_user_id?: string
          document_kind?: string
          id?: string
          mime_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
        }
        Relationships: []
      }
      doctor_performance_metrics: {
        Row: {
          average_rating: number
          consultations_count: number
          created_at: string
          doctor_id: string
          estimated_share: number
          hours_online: number
          id: string
          month: number
          performance_score: number
          tier_multiplier: number
          updated_at: string
          weighted_score: number
          year: number
        }
        Insert: {
          average_rating?: number
          consultations_count?: number
          created_at?: string
          doctor_id: string
          estimated_share?: number
          hours_online?: number
          id?: string
          month: number
          performance_score?: number
          tier_multiplier?: number
          updated_at?: string
          weighted_score?: number
          year: number
        }
        Update: {
          average_rating?: number
          consultations_count?: number
          created_at?: string
          doctor_id?: string
          estimated_share?: number
          hours_online?: number
          id?: string
          month?: number
          performance_score?: number
          tier_multiplier?: number
          updated_at?: string
          weighted_score?: number
          year?: number
        }
        Relationships: []
      }
      doctor_simulations: {
        Row: {
          created_at: string
          difficulty: string | null
          doctor_id: string
          id: string
          plantacoins_earned: number
          scenario_id: string
          scenario_title: string | null
          score: number
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          doctor_id: string
          id?: string
          plantacoins_earned?: number
          scenario_id: string
          scenario_title?: string | null
          score?: number
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          doctor_id?: string
          id?: string
          plantacoins_earned?: number
          scenario_id?: string
          scenario_title?: string | null
          score?: number
        }
        Relationships: []
      }
      doctor_wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          doctor_id: string
          id: string
          pix_key: string | null
          pix_type: string | null
          total_earned: number | null
          total_withdrawn: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          doctor_id: string
          id?: string
          pix_key?: string | null
          pix_type?: string | null
          total_earned?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          doctor_id?: string
          id?: string
          pix_key?: string | null
          pix_type?: string | null
          total_earned?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_wallets_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          approval_status: string
          available_hours: Json | null
          bio: string | null
          city: string | null
          consultation_price: number
          country: string | null
          created_at: string
          crm: string
          crm_back_url: string | null
          crm_front_url: string | null
          crm_state: string
          document_type: string
          fraud_score: number | null
          id: string
          is_approved_by_admin: boolean
          is_available: boolean
          is_crm_valid: boolean
          is_online: boolean
          is_verified: boolean
          kyc_status: string
          last_crm_check: string | null
          last_seen_online: string | null
          latitude: number | null
          longitude: number | null
          mp_collector_id: string | null
          organization_id: string | null
          plan_tier: string
          price_chat_only: number
          price_return: number
          price_video_chat: number
          rating: number | null
          rqe: string | null
          signature_url: string | null
          specialty: string
          suspended_at: string | null
          suspension_reason: string | null
          total_consultations: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string
          available_hours?: Json | null
          bio?: string | null
          city?: string | null
          consultation_price?: number
          country?: string | null
          created_at?: string
          crm: string
          crm_back_url?: string | null
          crm_front_url?: string | null
          crm_state?: string
          document_type?: string
          fraud_score?: number | null
          id?: string
          is_approved_by_admin?: boolean
          is_available?: boolean
          is_crm_valid?: boolean
          is_online?: boolean
          is_verified?: boolean
          kyc_status?: string
          last_crm_check?: string | null
          last_seen_online?: string | null
          latitude?: number | null
          longitude?: number | null
          mp_collector_id?: string | null
          organization_id?: string | null
          plan_tier?: string
          price_chat_only?: number
          price_return?: number
          price_video_chat?: number
          rating?: number | null
          rqe?: string | null
          signature_url?: string | null
          specialty?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          total_consultations?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string
          available_hours?: Json | null
          bio?: string | null
          city?: string | null
          consultation_price?: number
          country?: string | null
          created_at?: string
          crm?: string
          crm_back_url?: string | null
          crm_front_url?: string | null
          crm_state?: string
          document_type?: string
          fraud_score?: number | null
          id?: string
          is_approved_by_admin?: boolean
          is_available?: boolean
          is_crm_valid?: boolean
          is_online?: boolean
          is_verified?: boolean
          kyc_status?: string
          last_crm_check?: string | null
          last_seen_online?: string | null
          latitude?: number | null
          longitude?: number | null
          mp_collector_id?: string | null
          organization_id?: string | null
          plan_tier?: string
          price_chat_only?: number
          price_return?: number
          price_video_chat?: number
          rating?: number | null
          rqe?: string | null
          signature_url?: string | null
          specialty?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          total_consultations?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doctors_financial: {
        Row: {
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          created_at: string
          doctor_id: string
          document_number: string | null
          id: string
          pix_key: string | null
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string
          doctor_id: string
          document_number?: string | null
          id?: string
          pix_key?: string | null
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string
          doctor_id?: string
          document_number?: string | null
          id?: string
          pix_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_financial_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors_public: {
        Row: {
          available_hours: Json | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          consultation_price: number
          country: string | null
          created_at: string
          crm: string
          crm_state: string
          document_type: string
          full_name: string | null
          id: string
          is_available: boolean
          is_online: boolean
          is_verified: boolean
          plan_tier: string
          price_chat_only: number
          price_return: number
          price_video_chat: number
          rating: number | null
          rqe: string | null
          specialty: string
          total_consultations: number | null
          user_id: string
        }
        Insert: {
          available_hours?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          consultation_price: number
          country?: string | null
          created_at: string
          crm: string
          crm_state: string
          document_type: string
          full_name?: string | null
          id: string
          is_available: boolean
          is_online: boolean
          is_verified: boolean
          plan_tier: string
          price_chat_only: number
          price_return: number
          price_video_chat: number
          rating?: number | null
          rqe?: string | null
          specialty: string
          total_consultations?: number | null
          user_id: string
        }
        Update: {
          available_hours?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          consultation_price?: number
          country?: string | null
          created_at?: string
          crm?: string
          crm_state?: string
          document_type?: string
          full_name?: string | null
          id?: string
          is_available?: boolean
          is_online?: boolean
          is_verified?: boolean
          plan_tier?: string
          price_chat_only?: number
          price_return?: number
          price_video_chat?: number
          rating?: number | null
          rqe?: string | null
          specialty?: string
          total_consultations?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_public_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      dr_edilson_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          model: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          moderation_status: string
          role: string
          sources: Json
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          model?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          role: string
          sources?: Json
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          model?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          role?: string
          sources?: Json
          user_id?: string
        }
        Relationships: []
      }
      dr_edilson_user_status: {
        Row: {
          is_paused: boolean
          pause_reason: string | null
          paused_at: string | null
          paused_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          is_paused?: boolean
          pause_reason?: string | null
          paused_at?: string | null
          paused_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          is_paused?: boolean
          pause_reason?: string | null
          paused_at?: string | null
          paused_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ebook_funnel_log: {
        Row: {
          conversion_type: string | null
          converted_at: string | null
          created_at: string
          ebook_slug: string
          email: string | null
          followup_sent_at: string | null
          id: string
          metadata: Json | null
          name: string | null
          pdf_sent_at: string | null
          profession: string | null
          source: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          conversion_type?: string | null
          converted_at?: string | null
          created_at?: string
          ebook_slug?: string
          email?: string | null
          followup_sent_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          pdf_sent_at?: string | null
          profession?: string | null
          source?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          conversion_type?: string | null
          converted_at?: string | null
          created_at?: string
          ebook_slug?: string
          email?: string | null
          followup_sent_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          pdf_sent_at?: string | null
          profession?: string | null
          source?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      edge_rate_limit: {
        Row: {
          bucket: string
          created_at: string
          id: number
          key: string
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: number
          key: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: number
          key?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number | null
          body_html: string | null
          body_text: string | null
          created_at: string | null
          id: string
          last_error: string | null
          max_attempts: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template: string | null
          to_email: string
          to_name: string | null
        }
        Insert: {
          attempts?: number | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template?: string | null
          to_email: string
          to_name?: string | null
        }
        Update: {
          attempts?: number | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template?: string | null
          to_email?: string
          to_name?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      error_autohealing: {
        Row: {
          ai_confidence: number | null
          ai_diagnosis: string | null
          ai_suggested_fix: string | null
          context: Json | null
          error_message: string
          error_type: string | null
          fingerprint: string | null
          first_seen_at: string
          id: string
          last_seen_at: string
          occurrences: number
          resolved_at: string | null
          severity: string
          source: string
          source_ref: string | null
          stack: string | null
          status: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_diagnosis?: string | null
          ai_suggested_fix?: string | null
          context?: Json | null
          error_message: string
          error_type?: string | null
          fingerprint?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          occurrences?: number
          resolved_at?: string | null
          severity?: string
          source: string
          source_ref?: string | null
          stack?: string | null
          status?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_diagnosis?: string | null
          ai_suggested_fix?: string | null
          context?: Json | null
          error_message?: string
          error_type?: string | null
          fingerprint?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          occurrences?: number
          resolved_at?: string | null
          severity?: string
          source?: string
          source_ref?: string | null
          stack?: string | null
          status?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_type: string | null
          id: string
          message: string | null
          metadata: Json | null
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_type?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          source?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_type?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          confirmed_at: string | null
          created_at: string
          doctor_id: string | null
          doctor_payout: number | null
          id: string
          order_id: string | null
          patient_id: string
          platform_fee: number
          released_at: string | null
          status: string
          type: string
          updated_at: string
          vendor_id: string | null
          vendor_payout: number | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_payout?: number | null
          id?: string
          order_id?: string | null
          patient_id: string
          platform_fee?: number
          released_at?: string | null
          status?: string
          type?: string
          updated_at?: string
          vendor_id?: string | null
          vendor_payout?: number | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_payout?: number | null
          id?: string
          order_id?: string | null
          patient_id?: string
          platform_fee?: number
          released_at?: string | null
          status?: string
          type?: string
          updated_at?: string
          vendor_id?: string | null
          vendor_payout?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["appointment_id"]
          },
        ]
      }
      financial_metrics: {
        Row: {
          affiliate_commissions: number
          average_consultation_time: string | null
          created_at: string
          date: string
          doctor_bonuses: number
          id: string
          philanthropy_revenue: number
          platform_revenue: number
          total_conversions: number
          total_leads: number
          total_revenue: number
          updated_at: string
          vendor_revenue: number
        }
        Insert: {
          affiliate_commissions?: number
          average_consultation_time?: string | null
          created_at?: string
          date: string
          doctor_bonuses?: number
          id?: string
          philanthropy_revenue?: number
          platform_revenue?: number
          total_conversions?: number
          total_leads?: number
          total_revenue?: number
          updated_at?: string
          vendor_revenue?: number
        }
        Update: {
          affiliate_commissions?: number
          average_consultation_time?: string | null
          created_at?: string
          date?: string
          doctor_bonuses?: number
          id?: string
          philanthropy_revenue?: number
          platform_revenue?: number
          total_conversions?: number
          total_leads?: number
          total_revenue?: number
          updated_at?: string
          vendor_revenue?: number
        }
        Relationships: []
      }
      financial_reconciliation: {
        Row: {
          actual_amount: number | null
          details: Json | null
          diff: number | null
          expected_amount: number | null
          id: string
          mp_payment_id: string | null
          order_id: string | null
          reconciled_at: string
          reference_date: string
          source: string
          status: string
        }
        Insert: {
          actual_amount?: number | null
          details?: Json | null
          diff?: number | null
          expected_amount?: number | null
          id?: string
          mp_payment_id?: string | null
          order_id?: string | null
          reconciled_at?: string
          reference_date: string
          source?: string
          status?: string
        }
        Update: {
          actual_amount?: number | null
          details?: Json | null
          diff?: number | null
          expected_amount?: number | null
          id?: string
          mp_payment_id?: string | null
          order_id?: string | null
          reconciled_at?: string
          reference_date?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      fiscal_invoices: {
        Row: {
          authorized_at: string | null
          created_at: string
          cryptographic_hash: string
          external_invoice_id: string | null
          gross_amount: number
          id: string
          invoice_status: string | null
          invoice_type: string
          net_provider_amount: number
          nfe_number: string | null
          nfe_series: string | null
          nfe_verification_code: string | null
          order_type: string
          pdf_url: string
          platform_fee: number
          recipient_address: Json | null
          recipient_cpf_cnpj: string
          recipient_email: string
          recipient_name: string
          reference_id: string
          user_id: string
          xml_url: string | null
        }
        Insert: {
          authorized_at?: string | null
          created_at?: string
          cryptographic_hash: string
          external_invoice_id?: string | null
          gross_amount: number
          id?: string
          invoice_status?: string | null
          invoice_type: string
          net_provider_amount?: number
          nfe_number?: string | null
          nfe_series?: string | null
          nfe_verification_code?: string | null
          order_type: string
          pdf_url: string
          platform_fee?: number
          recipient_address?: Json | null
          recipient_cpf_cnpj: string
          recipient_email: string
          recipient_name: string
          reference_id: string
          user_id: string
          xml_url?: string | null
        }
        Update: {
          authorized_at?: string | null
          created_at?: string
          cryptographic_hash?: string
          external_invoice_id?: string | null
          gross_amount?: number
          id?: string
          invoice_status?: string | null
          invoice_type?: string
          net_provider_amount?: number
          nfe_number?: string | null
          nfe_series?: string | null
          nfe_verification_code?: string | null
          order_type?: string
          pdf_url?: string
          platform_fee?: number
          recipient_address?: Json | null
          recipient_cpf_cnpj?: string
          recipient_email?: string
          recipient_name?: string
          reference_id?: string
          user_id?: string
          xml_url?: string | null
        }
        Relationships: []
      }
      funnel_events: {
        Row: {
          created_at: string
          event_name: string
          funnel: string
          id: string
          lead_id: string | null
          metadata: Json
          session_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          funnel: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          session_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          funnel?: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_achievements: {
        Row: {
          badge_id: string
          id: string
          notified_at: string | null
          professional_id: string
          unlocked_at: string
        }
        Insert: {
          badge_id: string
          id?: string
          notified_at?: string | null
          professional_id: string
          unlocked_at?: string
        }
        Update: {
          badge_id?: string
          id?: string
          notified_at?: string | null
          professional_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_achievements_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "gamification_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_badges: {
        Row: {
          bonus_points: number
          created_at: string
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
          rarity: string
        }
        Insert: {
          bonus_points?: number
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          rarity?: string
        }
        Update: {
          bonus_points?: number
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      gamification_bonuses: {
        Row: {
          amount: number
          bonus_type: string
          created_at: string
          distributed_at: string | null
          id: string
          meta_id: string | null
          professional_id: string
          reason: string | null
          status: string
        }
        Insert: {
          amount: number
          bonus_type?: string
          created_at?: string
          distributed_at?: string | null
          id?: string
          meta_id?: string | null
          professional_id: string
          reason?: string | null
          status?: string
        }
        Update: {
          amount?: number
          bonus_type?: string
          created_at?: string
          distributed_at?: string | null
          id?: string
          meta_id?: string | null
          professional_id?: string
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_bonuses_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "gamification_metas"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_history: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          points: number
          professional_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          points?: number
          professional_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          points?: number
          professional_id?: string
        }
        Relationships: []
      }
      gamification_leaderboard: {
        Row: {
          achievement_count: number
          id: string
          nps_score: number
          period: string
          professional_id: string
          rank: number
          total_bonuses: number
          updated_at: string
        }
        Insert: {
          achievement_count?: number
          id?: string
          nps_score?: number
          period?: string
          professional_id: string
          rank?: number
          total_bonuses?: number
          updated_at?: string
        }
        Update: {
          achievement_count?: number
          id?: string
          nps_score?: number
          period?: string
          professional_id?: string
          rank?: number
          total_bonuses?: number
          updated_at?: string
        }
        Relationships: []
      }
      gamification_metas: {
        Row: {
          bonus_amount: number
          created_at: string
          end_date: string | null
          id: string
          nps_target: number
          period: string
          professional_id: string
          start_date: string | null
          status: string
        }
        Insert: {
          bonus_amount: number
          created_at?: string
          end_date?: string | null
          id?: string
          nps_target: number
          period?: string
          professional_id: string
          start_date?: string | null
          status?: string
        }
        Update: {
          bonus_amount?: number
          created_at?: string
          end_date?: string | null
          id?: string
          nps_target?: number
          period?: string
          professional_id?: string
          start_date?: string | null
          status?: string
        }
        Relationships: []
      }
      gamification_streak: {
        Row: {
          current_streak: number
          id: string
          last_updated_at: string
          max_streak: number
          professional_id: string
          streak_broken_at: string | null
        }
        Insert: {
          current_streak?: number
          id?: string
          last_updated_at?: string
          max_streak?: number
          professional_id: string
          streak_broken_at?: string | null
        }
        Update: {
          current_streak?: number
          id?: string
          last_updated_at?: string
          max_streak?: number
          professional_id?: string
          streak_broken_at?: string | null
        }
        Relationships: []
      }
      health_card_redemptions: {
        Row: {
          created_at: string
          discount_amount: number
          discount_percent: number
          final_amount: number
          id: string
          metadata: Json | null
          original_amount: number
          partner_name: string
          partner_type: string | null
          redeemed_at: string
          service_description: string | null
          subscription_id: string
          user_id: string
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          discount_percent?: number
          final_amount: number
          id?: string
          metadata?: Json | null
          original_amount: number
          partner_name: string
          partner_type?: string | null
          redeemed_at?: string
          service_description?: string | null
          subscription_id: string
          user_id: string
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: number
          discount_percent?: number
          final_amount?: number
          id?: string
          metadata?: Json | null
          original_amount?: number
          partner_name?: string
          partner_type?: string | null
          redeemed_at?: string
          service_description?: string | null
          subscription_id?: string
          user_id?: string
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_card_redemptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "health_card_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      health_card_subscriptions: {
        Row: {
          activated_at: string | null
          amount: number
          billing_cycle: string
          cancelled_at: string | null
          card_number: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          mp_preapproval_id: string | null
          mp_subscription_id: string | null
          next_billing_date: string | null
          plan_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          amount: number
          billing_cycle: string
          cancelled_at?: string | null
          card_number: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          mp_preapproval_id?: string | null
          mp_subscription_id?: string | null
          next_billing_date?: string | null
          plan_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          amount?: number
          billing_cycle?: string
          cancelled_at?: string | null
          card_number?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          mp_preapproval_id?: string | null
          mp_subscription_id?: string | null
          next_billing_date?: string | null
          plan_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_card_wallet: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_loaded: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_loaded?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_loaded?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_card_wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          mp_payment_id: string | null
          partner_name: string | null
          status: string
          tx_type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          mp_payment_id?: string | null
          partner_name?: string | null
          status?: string
          tx_type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          mp_payment_id?: string | null
          partner_name?: string | null
          status?: string
          tx_type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_card_wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "health_card_wallet"
            referencedColumns: ["id"]
          },
        ]
      }
      health_subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          external_subscription_id: string | null
          features: Json | null
          id: string
          next_billing_at: string | null
          payment_method: string | null
          plan_name: string
          plan_type: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          external_subscription_id?: string | null
          features?: Json | null
          id?: string
          next_billing_at?: string | null
          payment_method?: string | null
          plan_name?: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          external_subscription_id?: string | null
          features?: Json | null
          id?: string
          next_billing_at?: string | null
          payment_method?: string | null
          plan_name?: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      infra_services: {
        Row: {
          category: string
          cost_brl: number | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_alert_at: string | null
          name: string
          notes: string | null
          provider: string | null
          renewal_url: string | null
          updated_at: string
        }
        Insert: {
          category: string
          cost_brl?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_alert_at?: string | null
          name: string
          notes?: string | null
          provider?: string | null
          renewal_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          cost_brl?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_alert_at?: string | null
          name?: string
          notes?: string | null
          provider?: string | null
          renewal_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      intent_routing_rules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          intent_key: string
          keywords: string[]
          priority: number
          requires_payment: boolean
          target_persona_key: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          intent_key: string
          keywords?: string[]
          priority?: number
          requires_payment?: boolean
          target_persona_key: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          intent_key?: string
          keywords?: string[]
          priority?: number
          requires_payment?: boolean
          target_persona_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "intent_routing_rules_target_persona_key_fkey"
            columns: ["target_persona_key"]
            isOneToOne: false
            referencedRelation: "ai_personas"
            referencedColumns: ["persona_key"]
          },
          {
            foreignKeyName: "intent_routing_rules_target_persona_key_fkey"
            columns: ["target_persona_key"]
            isOneToOne: false
            referencedRelation: "ai_personas_public"
            referencedColumns: ["persona_key"]
          },
        ]
      }
      job_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_log: string | null
          id: string
          max_retries: number
          payload: Json
          queue: string
          scheduled_for: string
          started_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_log?: string | null
          id?: string
          max_retries?: number
          payload?: Json
          queue: string
          scheduled_for?: string
          started_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_log?: string | null
          id?: string
          max_retries?: number
          payload?: Json
          queue?: string
          scheduled_for?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      lead_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          lead_id: string
          note: string | null
          to_status: string
          whatsapp_error: string | null
          whatsapp_message: string | null
          whatsapp_sent: boolean
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id: string
          note?: string | null
          to_status: string
          whatsapp_error?: string | null
          whatsapp_message?: string | null
          whatsapp_sent?: boolean
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id?: string
          note?: string | null
          to_status?: string
          whatsapp_error?: string | null
          whatsapp_message?: string | null
          whatsapp_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          condition_interest: string | null
          created_at: string
          id: string
          lead_score: number
          metadata: Json
          name: string
          source: string
          status: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          condition_interest?: string | null
          created_at?: string
          id?: string
          lead_score?: number
          metadata?: Json
          name: string
          source?: string
          status?: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          condition_interest?: string | null
          created_at?: string
          id?: string
          lead_score?: number
          metadata?: Json
          name?: string
          source?: string
          status?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      leads_contatos: {
        Row: {
          categoria: string | null
          created_at: string
          email: string | null
          id: string
          idioma: string | null
          nome: string
          origem: string
          tags: string[] | null
          telefone: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          email?: string | null
          id?: string
          idioma?: string | null
          nome: string
          origem?: string
          tags?: string[] | null
          telefone: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          email?: string | null
          id?: string
          idioma?: string | null
          nome?: string
          origem?: string
          tags?: string[] | null
          telefone?: string
        }
        Relationships: []
      }
      manus_ceo_reports: {
        Row: {
          created_at: string
          delivery_status: string | null
          id: string
          markdown: string | null
          metrics: Json
          report_date: string
          report_type: string
          sent_to: string | null
        }
        Insert: {
          created_at?: string
          delivery_status?: string | null
          id?: string
          markdown?: string | null
          metrics?: Json
          report_date?: string
          report_type?: string
          sent_to?: string | null
        }
        Update: {
          created_at?: string
          delivery_status?: string | null
          id?: string
          markdown?: string | null
          metrics?: Json
          report_date?: string
          report_type?: string
          sent_to?: string | null
        }
        Relationships: []
      }
      manus_growth_kpis: {
        Row: {
          clicks: number | null
          conv_rate: number | null
          created_at: string
          ctr: number | null
          id: string
          impressions: number | null
          position: number | null
          query: string | null
          snapshot_date: string
          url: string
        }
        Insert: {
          clicks?: number | null
          conv_rate?: number | null
          created_at?: string
          ctr?: number | null
          id?: string
          impressions?: number | null
          position?: number | null
          query?: string | null
          snapshot_date?: string
          url: string
        }
        Update: {
          clicks?: number | null
          conv_rate?: number | null
          created_at?: string
          ctr?: number | null
          id?: string
          impressions?: number | null
          position?: number | null
          query?: string | null
          snapshot_date?: string
          url?: string
        }
        Relationships: []
      }
      manus_growth_logs: {
        Row: {
          action: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          error_message: string | null
          id: string
          kpi_delta: Json | null
          phase: string
          run_id: string | null
          status: string
          url: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          kpi_delta?: Json | null
          phase: string
          run_id?: string | null
          status?: string
          url?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          kpi_delta?: Json | null
          phase?: string
          run_id?: string | null
          status?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manus_growth_logs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "manus_growth_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      manus_growth_proposals: {
        Row: {
          body_md: string
          created_at: string
          github_issue_url: string | null
          id: string
          proposed_files: Json | null
          status: string
          title: string
        }
        Insert: {
          body_md: string
          created_at?: string
          github_issue_url?: string | null
          id?: string
          proposed_files?: Json | null
          status?: string
          title: string
        }
        Update: {
          body_md?: string
          created_at?: string
          github_issue_url?: string | null
          id?: string
          proposed_files?: Json | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      manus_growth_runs: {
        Row: {
          errors_count: number | null
          finished_at: string | null
          id: string
          metrics: Json | null
          pages_analyzed: number | null
          pages_optimized: number | null
          posts_generated: number | null
          started_at: string
          status: string
          summary_md: string | null
          triggered_by: string | null
        }
        Insert: {
          errors_count?: number | null
          finished_at?: string | null
          id?: string
          metrics?: Json | null
          pages_analyzed?: number | null
          pages_optimized?: number | null
          posts_generated?: number | null
          started_at?: string
          status?: string
          summary_md?: string | null
          triggered_by?: string | null
        }
        Update: {
          errors_count?: number | null
          finished_at?: string | null
          id?: string
          metrics?: Json | null
          pages_analyzed?: number | null
          pages_optimized?: number | null
          posts_generated?: number | null
          started_at?: string
          status?: string
          summary_md?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      manus_sentinel_runs: {
        Row: {
          checks: Json
          corrections: Json
          duration_ms: number | null
          escalations: Json
          id: string
          is_simulation: boolean
          issues: Json
          overall_status: string
          ran_at: string
          triggered_by: string | null
          whatsapp_sent: boolean | null
        }
        Insert: {
          checks?: Json
          corrections?: Json
          duration_ms?: number | null
          escalations?: Json
          id?: string
          is_simulation?: boolean
          issues?: Json
          overall_status?: string
          ran_at?: string
          triggered_by?: string | null
          whatsapp_sent?: boolean | null
        }
        Update: {
          checks?: Json
          corrections?: Json
          duration_ms?: number | null
          escalations?: Json
          id?: string
          is_simulation?: boolean
          issues?: Json
          overall_status?: string
          ran_at?: string
          triggered_by?: string | null
          whatsapp_sent?: boolean | null
        }
        Relationships: []
      }
      manus_seo_overrides: {
        Row: {
          body_injection: string | null
          created_at: string
          created_by_run: string | null
          h1: string | null
          h2_list: Json | null
          id: string
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          route: string
          schema_org: Json | null
          updated_at: string
        }
        Insert: {
          body_injection?: string | null
          created_at?: string
          created_by_run?: string | null
          h1?: string | null
          h2_list?: Json | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          route: string
          schema_org?: Json | null
          updated_at?: string
        }
        Update: {
          body_injection?: string | null
          created_at?: string
          created_by_run?: string | null
          h1?: string | null
          h2_list?: Json | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          route?: string
          schema_org?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manus_seo_overrides_created_by_run_fkey"
            columns: ["created_by_run"]
            isOneToOne: false
            referencedRelation: "manus_growth_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      manus_social_queue: {
        Row: {
          caption: string | null
          caption_hash: string | null
          created_at: string
          created_by_run: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          platform: string
          posted_at: string | null
          scheduled_for: string | null
          script: string
          status: string
          topic: string | null
        }
        Insert: {
          caption?: string | null
          caption_hash?: string | null
          created_at?: string
          created_by_run?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform: string
          posted_at?: string | null
          scheduled_for?: string | null
          script: string
          status?: string
          topic?: string | null
        }
        Update: {
          caption?: string | null
          caption_hash?: string | null
          created_at?: string
          created_by_run?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform?: string
          posted_at?: string | null
          scheduled_for?: string | null
          script?: string
          status?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manus_social_queue_created_by_run_fkey"
            columns: ["created_by_run"]
            isOneToOne: false
            referencedRelation: "manus_growth_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_daily_snapshot: {
        Row: {
          created_at: string
          delta_vs_target: number
          leads: number
          on_track: boolean
          orientacao_starts: number
          signups: number
          snapshot_date: string
          target_new_visitors: number
          visitors_new: number
          visitors_total: number
        }
        Insert: {
          created_at?: string
          delta_vs_target?: number
          leads?: number
          on_track?: boolean
          orientacao_starts?: number
          signups?: number
          snapshot_date: string
          target_new_visitors?: number
          visitors_new?: number
          visitors_total?: number
        }
        Update: {
          created_at?: string
          delta_vs_target?: number
          leads?: number
          on_track?: boolean
          orientacao_starts?: number
          signups?: number
          snapshot_date?: string
          target_new_visitors?: number
          visitors_new?: number
          visitors_total?: number
        }
        Relationships: []
      }
      marketing_kpi_targets: {
        Row: {
          baseline_set_at: string
          baseline_visitors: number
          daily_new_visitors_target: number
          id: string
          lead_nurture_target: number
          notes: string | null
          orientacao_conversion_target: number
          scope: string
          signup_conversion_target: number
          updated_at: string
        }
        Insert: {
          baseline_set_at?: string
          baseline_visitors?: number
          daily_new_visitors_target?: number
          id?: string
          lead_nurture_target?: number
          notes?: string | null
          orientacao_conversion_target?: number
          scope?: string
          signup_conversion_target?: number
          updated_at?: string
        }
        Update: {
          baseline_set_at?: string
          baseline_visitors?: number
          daily_new_visitors_target?: number
          id?: string
          lead_nurture_target?: number
          notes?: string | null
          orientacao_conversion_target?: number
          scope?: string
          signup_conversion_target?: number
          updated_at?: string
        }
        Relationships: []
      }
      master_reports: {
        Row: {
          content_summary: Json
          created_at: string
          generated_by: string | null
          id: string
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          report_date: string
          storage_path: string | null
        }
        Insert: {
          content_summary?: Json
          created_at?: string
          generated_by?: string | null
          id?: string
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          report_date?: string
          storage_path?: string | null
        }
        Update: {
          content_summary?: Json
          created_at?: string
          generated_by?: string | null
          id?: string
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          report_date?: string
          storage_path?: string | null
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          attachments: Json | null
          chief_complaint: string | null
          created_at: string
          diagnosis: string | null
          diagnosis_cid: string | null
          doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          treatment_plan: string | null
          updated_at: string
          vitals: Json | null
        }
        Insert: {
          appointment_id?: string | null
          attachments?: Json | null
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          diagnosis_cid?: string | null
          doctor_id: string
          id?: string
          notes?: string | null
          patient_id: string
          treatment_plan?: string | null
          updated_at?: string
          vitals?: Json | null
        }
        Update: {
          appointment_id?: string | null
          attachments?: Json | null
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          diagnosis_cid?: string | null
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          treatment_plan?: string | null
          updated_at?: string
          vitals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_subscriptions: {
        Row: {
          amount: number
          created_at: string
          doctor_id: string
          expires_at: string | null
          id: string
          mercadopago_subscription_id: string | null
          plan_tier: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          doctor_id: string
          expires_at?: string | null
          id?: string
          mercadopago_subscription_id?: string | null
          plan_tier?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          doctor_id?: string
          expires_at?: string | null
          id?: string
          mercadopago_subscription_id?: string | null
          plan_tier?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      medicoes_cardiacas: {
        Row: {
          bpm: number
          classificacao: string
          created_at: string
          device_info: Json | null
          duracao_segundos: number | null
          hrv_sdnn: number | null
          id: string
          qualidade_sinal: string | null
          user_id: string | null
        }
        Insert: {
          bpm: number
          classificacao: string
          created_at?: string
          device_info?: Json | null
          duracao_segundos?: number | null
          hrv_sdnn?: number | null
          id?: string
          qualidade_sinal?: string | null
          user_id?: string | null
        }
        Update: {
          bpm?: number
          classificacao?: string
          created_at?: string
          device_info?: Json | null
          duracao_segundos?: number | null
          hrv_sdnn?: number | null
          id?: string
          qualidade_sinal?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      meta_messenger_log: {
        Row: {
          channel: string
          error: string | null
          id: string
          message_in: string | null
          processed_at: string
          red_flag: boolean
          reply_out: string | null
          sender_id: string
        }
        Insert: {
          channel: string
          error?: string | null
          id?: string
          message_in?: string | null
          processed_at?: string
          red_flag?: boolean
          reply_out?: string | null
          sender_id: string
        }
        Update: {
          channel?: string
          error?: string | null
          id?: string
          message_in?: string | null
          processed_at?: string
          red_flag?: boolean
          reply_out?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      meta_token_storage: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          refreshed_at: string
          token: string
          user_token: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id: string
          refreshed_at?: string
          token: string
          user_token?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          refreshed_at?: string
          token?: string
          user_token?: string | null
        }
        Relationships: []
      }
      monitoring_profiles: {
        Row: {
          conv_drop_ratio: number
          conv_min_baseline: number
          created_at: string
          cron_overdue_max: number
          err_critical_max: number
          err_total_max: number
          id: string
          is_active: boolean
          mp_error_rate_max: number
          name: string
          notes: string | null
          queue_stuck_max: number
          queue_stuck_minutes: number
          updated_at: string
        }
        Insert: {
          conv_drop_ratio?: number
          conv_min_baseline?: number
          created_at?: string
          cron_overdue_max?: number
          err_critical_max?: number
          err_total_max?: number
          id?: string
          is_active?: boolean
          mp_error_rate_max?: number
          name: string
          notes?: string | null
          queue_stuck_max?: number
          queue_stuck_minutes?: number
          updated_at?: string
        }
        Update: {
          conv_drop_ratio?: number
          conv_min_baseline?: number
          created_at?: string
          cron_overdue_max?: number
          err_critical_max?: number
          err_total_max?: number
          id?: string
          is_active?: boolean
          mp_error_rate_max?: number
          name?: string
          notes?: string | null
          queue_stuck_max?: number
          queue_stuck_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      nps_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string | null
          professional_id: string
          response_id: string
          severity: string
          status: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string | null
          professional_id: string
          response_id: string
          severity?: string
          status?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string | null
          professional_id?: string
          response_id?: string
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "nps_alerts_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "nps_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_analytics: {
        Row: {
          avg_score: number | null
          created_at: string
          detractors: number
          id: string
          nps_score: number | null
          passives: number
          period: string
          period_date: string
          promoters: number
          response_rate: number | null
          total_responses: number
        }
        Insert: {
          avg_score?: number | null
          created_at?: string
          detractors?: number
          id?: string
          nps_score?: number | null
          passives?: number
          period: string
          period_date: string
          promoters?: number
          response_rate?: number | null
          total_responses?: number
        }
        Update: {
          avg_score?: number | null
          created_at?: string
          detractors?: number
          id?: string
          nps_score?: number | null
          passives?: number
          period?: string
          period_date?: string
          promoters?: number
          response_rate?: number | null
          total_responses?: number
        }
        Relationships: []
      }
      nps_feedback_analysis: {
        Row: {
          action_items: Json | null
          created_at: string
          id: string
          keywords: Json | null
          response_id: string
          sentiment: string | null
          sentiment_score: number | null
          topics: Json | null
        }
        Insert: {
          action_items?: Json | null
          created_at?: string
          id?: string
          keywords?: Json | null
          response_id: string
          sentiment?: string | null
          sentiment_score?: number | null
          topics?: Json | null
        }
        Update: {
          action_items?: Json | null
          created_at?: string
          id?: string
          keywords?: Json | null
          response_id?: string
          sentiment?: string | null
          sentiment_score?: number | null
          topics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "nps_feedback_analysis_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "nps_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_professional: {
        Row: {
          avg_score: number | null
          detractors: number
          id: string
          last_response_at: string | null
          nps_score: number | null
          passives: number
          professional_id: string
          promoters: number
          total_responses: number
          updated_at: string
        }
        Insert: {
          avg_score?: number | null
          detractors?: number
          id?: string
          last_response_at?: string | null
          nps_score?: number | null
          passives?: number
          professional_id: string
          promoters?: number
          total_responses?: number
          updated_at?: string
        }
        Update: {
          avg_score?: number | null
          detractors?: number
          id?: string
          last_response_at?: string | null
          nps_score?: number | null
          passives?: number
          professional_id?: string
          promoters?: number
          total_responses?: number
          updated_at?: string
        }
        Relationships: []
      }
      nps_responses: {
        Row: {
          category: string
          consultation_id: string
          created_at: string
          feedback: string | null
          id: string
          patient_id: string
          professional_id: string
          score: number
          sentiment: string | null
          updated_at: string
        }
        Insert: {
          category: string
          consultation_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          patient_id: string
          professional_id: string
          score: number
          sentiment?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          consultation_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          patient_id?: string
          professional_id?: string
          score?: number
          sentiment?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          organization_id: string | null
          payment_id: string | null
          platform_fee: number | null
          settlement_receipt: Json | null
          shipping_carrier: string | null
          shipping_cep: string | null
          shipping_cost: number | null
          shipping_days: number | null
          shipping_deadline_days: number | null
          shipping_method: string | null
          split_details: Json | null
          status: string
          subtotal: number
          total: number
          tracking_code: string | null
          tracking_url: string | null
          updated_at: string | null
          user_id: string
          vendor_id: string | null
          vendor_net_amount: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items?: Json
          organization_id?: string | null
          payment_id?: string | null
          platform_fee?: number | null
          settlement_receipt?: Json | null
          shipping_carrier?: string | null
          shipping_cep?: string | null
          shipping_cost?: number | null
          shipping_days?: number | null
          shipping_deadline_days?: number | null
          shipping_method?: string | null
          split_details?: Json | null
          status?: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id: string
          vendor_id?: string | null
          vendor_net_amount?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          organization_id?: string | null
          payment_id?: string | null
          platform_fee?: number | null
          settlement_receipt?: Json | null
          shipping_carrier?: string | null
          shipping_cep?: string | null
          shipping_cost?: number | null
          shipping_days?: number | null
          shipping_deadline_days?: number | null
          shipping_method?: string | null
          split_details?: Json | null
          status?: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string
          vendor_id?: string | null
          vendor_net_amount?: number | null
        }
        Relationships: []
      }
      orientacao_tecnica_orders: {
        Row: {
          ai_analysis: string | null
          amount: number
          amount_brl: number | null
          btc_address: string | null
          btc_amount: number | null
          btc_tx_hash: string | null
          created_at: string
          currency: string
          dispatched_at: string | null
          doctor_payout: number
          document_id: string | null
          external_reference: string
          google_review_requested_at: string | null
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          patient_email: string | null
          patient_name: string
          patient_whatsapp: string
          payment_method: string
          pdf_storage_path: string | null
          pdf_url: string | null
          platform_fee: number
          proof_url: string | null
          qr_code: string | null
          qr_code_base64: string | null
          signature_hash: string | null
          status: string
          stripe_session_id: string | null
          ticket_url: string | null
          topic: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_analysis?: string | null
          amount?: number
          amount_brl?: number | null
          btc_address?: string | null
          btc_amount?: number | null
          btc_tx_hash?: string | null
          created_at?: string
          currency?: string
          dispatched_at?: string | null
          doctor_payout?: number
          document_id?: string | null
          external_reference: string
          google_review_requested_at?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          patient_email?: string | null
          patient_name: string
          patient_whatsapp: string
          payment_method?: string
          pdf_storage_path?: string | null
          pdf_url?: string | null
          platform_fee?: number
          proof_url?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          signature_hash?: string | null
          status?: string
          stripe_session_id?: string | null
          ticket_url?: string | null
          topic?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_analysis?: string | null
          amount?: number
          amount_brl?: number | null
          btc_address?: string | null
          btc_amount?: number | null
          btc_tx_hash?: string | null
          created_at?: string
          currency?: string
          dispatched_at?: string | null
          doctor_payout?: number
          document_id?: string | null
          external_reference?: string
          google_review_requested_at?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_whatsapp?: string
          payment_method?: string
          pdf_storage_path?: string | null
          pdf_url?: string | null
          platform_fee?: number
          proof_url?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          signature_hash?: string | null
          status?: string
          stripe_session_id?: string | null
          ticket_url?: string | null
          topic?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ot_access_tokens: {
        Row: {
          attempts: number
          contact: string
          contact_type: string
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          session_expires_at: string | null
          session_token: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          contact: string
          contact_type: string
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash: string
          session_expires_at?: string | null
          session_token?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          contact?: string
          contact_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          session_expires_at?: string | null
          session_token?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      ot_dispatch_events: {
        Row: {
          created_at: string
          external_reference: string
          id: string
          message: string | null
          meta: Json | null
          order_id: string
          stage: string
        }
        Insert: {
          created_at?: string
          external_reference: string
          id?: string
          message?: string | null
          meta?: Json | null
          order_id: string
          stage: string
        }
        Update: {
          created_at?: string
          external_reference?: string
          id?: string
          message?: string | null
          meta?: Json | null
          order_id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "ot_dispatch_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orientacao_tecnica_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_token_access_log: {
        Row: {
          accessed_at: string
          id: string
          ip: string | null
          order_id: string
          session_token_hash: string
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip?: string | null
          order_id: string
          session_token_hash: string
        }
        Update: {
          accessed_at?: string
          id?: string
          ip?: string | null
          order_id?: string
          session_token_hash?: string
        }
        Relationships: []
      }
      pacientes_leads: {
        Row: {
          cidade: string | null
          clinical_score: number | null
          created_at: string
          email: string | null
          id: string
          idade: number | null
          intensidade: number | null
          nome: string
          payload: Json | null
          peso: number | null
          sintoma: string | null
          source: string | null
          whatsapp: string
        }
        Insert: {
          cidade?: string | null
          clinical_score?: number | null
          created_at?: string
          email?: string | null
          id?: string
          idade?: number | null
          intensidade?: number | null
          nome: string
          payload?: Json | null
          peso?: number | null
          sintoma?: string | null
          source?: string | null
          whatsapp: string
        }
        Update: {
          cidade?: string | null
          clinical_score?: number | null
          created_at?: string
          email?: string | null
          id?: string
          idade?: number | null
          intensidade?: number | null
          nome?: string
          payload?: Json | null
          peso?: number | null
          sintoma?: string | null
          source?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      pagamentos_audit: {
        Row: {
          amount: number
          amount_brl: number | null
          created_at: string
          currency: string
          external_reference: string | null
          fx_rate: number | null
          id: string
          metadata: Json | null
          order_id: string | null
          payment_method: string
          provider_id: string | null
          status: string
        }
        Insert: {
          amount: number
          amount_brl?: number | null
          created_at?: string
          currency: string
          external_reference?: string | null
          fx_rate?: number | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method: string
          provider_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          amount_brl?: number | null
          created_at?: string
          currency?: string
          external_reference?: string | null
          fx_rate?: number | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method?: string
          provider_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_audit_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orientacao_tecnica_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_clinical_context: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          scientific_reference: Json | null
          source: string
          suggestions: string | null
          summary: string
          symptoms: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          scientific_reference?: Json | null
          source?: string
          suggestions?: string | null
          summary: string
          symptoms?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          scientific_reference?: Json | null
          source?: string
          suggestions?: string | null
          summary?: string
          symptoms?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_passports: {
        Row: {
          access_count: number
          appointment_id: string | null
          created_at: string
          expires_at: string
          id: string
          last_accessed_at: string | null
          metadata: Json
          patient_id: string
          token: string
          updated_at: string
        }
        Insert: {
          access_count?: number
          appointment_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          metadata?: Json
          patient_id: string
          token: string
          updated_at?: string
        }
        Update: {
          access_count?: number
          appointment_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          metadata?: Json
          patient_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_symptom_diary: {
        Row: {
          created_at: string
          drops_used: number | null
          entry_date: string
          id: string
          mood: number | null
          notes: string | null
          pain_level: number | null
          patient_id: string
          sleep_quality: number | null
        }
        Insert: {
          created_at?: string
          drops_used?: number | null
          entry_date?: string
          id?: string
          mood?: number | null
          notes?: string | null
          pain_level?: number | null
          patient_id: string
          sleep_quality?: number | null
        }
        Update: {
          created_at?: string
          drops_used?: number | null
          entry_date?: string
          id?: string
          mood?: number | null
          notes?: string | null
          pain_level?: number | null
          patient_id?: string
          sleep_quality?: number | null
        }
        Relationships: []
      }
      payment_contingency_config: {
        Row: {
          beneficiary_doc: string | null
          beneficiary_name: string
          created_at: string
          id: string
          is_active: boolean
          pix_key: string
          pix_key_type: string
          updated_at: string
          whatsapp_proof_number: string
        }
        Insert: {
          beneficiary_doc?: string | null
          beneficiary_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          pix_key: string
          pix_key_type: string
          updated_at?: string
          whatsapp_proof_number?: string
        }
        Update: {
          beneficiary_doc?: string | null
          beneficiary_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          pix_key?: string
          pix_key_type?: string
          updated_at?: string
          whatsapp_proof_number?: string
        }
        Relationships: []
      }
      payment_provider_health: {
        Row: {
          checked_at: string
          created_at: string
          error_rate: number | null
          id: string
          last_error: string | null
          latency_ms: number | null
          provider: string
          status: string
        }
        Insert: {
          checked_at?: string
          created_at?: string
          error_rate?: number | null
          id?: string
          last_error?: string | null
          latency_ms?: number | null
          provider: string
          status: string
        }
        Update: {
          checked_at?: string
          created_at?: string
          error_rate?: number | null
          id?: string
          last_error?: string | null
          latency_ms?: number | null
          provider?: string
          status?: string
        }
        Relationships: []
      }
      payment_webhooks: {
        Row: {
          action: string | null
          amount: number | null
          created_at: string
          doctor_payout: number | null
          id: string
          payer_email: string | null
          payment_id: string
          platform_fee: number | null
          raw_data: Json | null
          split_processed: boolean | null
          status: string
        }
        Insert: {
          action?: string | null
          amount?: number | null
          created_at?: string
          doctor_payout?: number | null
          id?: string
          payer_email?: string | null
          payment_id: string
          platform_fee?: number | null
          raw_data?: Json | null
          split_processed?: boolean | null
          status?: string
        }
        Update: {
          action?: string | null
          amount?: number | null
          created_at?: string
          doctor_payout?: number | null
          id?: string
          payer_email?: string | null
          payment_id?: string
          platform_fee?: number | null
          raw_data?: Json | null
          split_processed?: boolean | null
          status?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          consultation_id: string | null
          created_at: string | null
          doctor_id: string | null
          doctor_net_amount: number | null
          gross_amount: number
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          paid_at: string | null
          patient_id: string | null
          payment_method: string | null
          pix_transaction_id: string | null
          platform_fee_amount: number | null
          platform_fee_pct: number | null
          released_at: string | null
          settlement_receipt: Json | null
          split_details: Json | null
          status: string | null
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          doctor_net_amount?: number | null
          gross_amount: number
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          pix_transaction_id?: string | null
          platform_fee_amount?: number | null
          platform_fee_pct?: number | null
          released_at?: string | null
          settlement_receipt?: Json | null
          split_details?: Json | null
          status?: string | null
        }
        Update: {
          consultation_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          doctor_net_amount?: number | null
          gross_amount?: number
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          pix_transaction_id?: string | null
          platform_fee_amount?: number | null
          platform_fee_pct?: number | null
          released_at?: string | null
          settlement_receipt?: Json | null
          split_details?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_history: {
        Row: {
          amount: number
          created_at: string
          doctor_id: string
          error_message: string | null
          id: string
          mercadopago_payment_id: string | null
          period_month: number
          period_year: number
          pix_key: string
          processed_at: string | null
          share_percentage: number
          status: string
          user_id: string
          weighted_score: number
        }
        Insert: {
          amount: number
          created_at?: string
          doctor_id: string
          error_message?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          period_month: number
          period_year: number
          pix_key: string
          processed_at?: string | null
          share_percentage?: number
          status?: string
          user_id: string
          weighted_score?: number
        }
        Update: {
          amount?: number
          created_at?: string
          doctor_id?: string
          error_message?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          period_month?: number
          period_year?: number
          pix_key?: string
          processed_at?: string | null
          share_percentage?: number
          status?: string
          user_id?: string
          weighted_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "payout_history_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          appointment_id: string | null
          country_code: string | null
          created_at: string
          currency: string
          doctor_amount: number
          doctor_id: string | null
          id: string
          patient_id: string | null
          philanthropy_amount: number
          platform_amount: number
          provider_id: string
          provider_payment_id: string | null
          status: string
          total_amount: number
          updated_at: string
          vendor_amount: number
          vendor_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          doctor_amount?: number
          doctor_id?: string | null
          id?: string
          patient_id?: string | null
          philanthropy_amount?: number
          platform_amount?: number
          provider_id?: string
          provider_payment_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          vendor_amount?: number
          vendor_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          doctor_amount?: number
          doctor_id?: string | null
          id?: string
          patient_id?: string | null
          philanthropy_amount?: number
          platform_amount?: number
          provider_id?: string
          provider_payment_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_amount?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "payouts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_prescriptions_inbox: {
        Row: {
          created_at: string
          delivery_address: Json | null
          dispatch_mode: string
          id: string
          motivo_recusa: string | null
          order_id: string | null
          patient_id: string
          patient_name: string
          patient_whatsapp: string | null
          prescription_id: string | null
          prescription_pdf_url: string
          regulatory_hash: string
          status: string
          tracking_code: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          delivery_address?: Json | null
          dispatch_mode: string
          id?: string
          motivo_recusa?: string | null
          order_id?: string | null
          patient_id: string
          patient_name: string
          patient_whatsapp?: string | null
          prescription_id?: string | null
          prescription_pdf_url: string
          regulatory_hash: string
          status?: string
          tracking_code?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: Json | null
          dispatch_mode?: string
          id?: string
          motivo_recusa?: string | null
          order_id?: string | null
          patient_id?: string
          patient_name?: string
          patient_whatsapp?: string | null
          prescription_id?: string | null
          prescription_pdf_url?: string
          regulatory_hash?: string
          status?: string
          tracking_code?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_prescriptions_inbox_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "agentic_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescriptions_inbox_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescriptions_inbox_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescriptions_inbox_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      post_moderation_queue: {
        Row: {
          admin_decision_at: string | null
          admin_decision_by: string | null
          admin_notes: string | null
          author_name: string
          brisa_categories: Json | null
          brisa_reason: string | null
          brisa_verdict: string
          content: string
          created_at: string
          id: string
          images: Json
          published_facebook: boolean | null
          published_instagram: boolean | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_decision_at?: string | null
          admin_decision_by?: string | null
          admin_notes?: string | null
          author_name: string
          brisa_categories?: Json | null
          brisa_reason?: string | null
          brisa_verdict?: string
          content: string
          created_at?: string
          id?: string
          images?: Json
          published_facebook?: boolean | null
          published_instagram?: boolean | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_decision_at?: string | null
          admin_decision_by?: string | null
          admin_notes?: string | null
          author_name?: string
          brisa_categories?: Json | null
          brisa_reason?: string | null
          brisa_verdict?: string
          content?: string
          created_at?: string
          id?: string
          images?: Json
          published_facebook?: boolean | null
          published_instagram?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prescription_carts: {
        Row: {
          cart_token: string
          completed_at: string | null
          created_at: string
          discount_percent: number | null
          doctor_id: string
          expires_at: string | null
          id: string
          items: Json
          patient_id: string
          payment_id: string | null
          prescription_id: string | null
          status: string
          total_amount: number | null
        }
        Insert: {
          cart_token?: string
          completed_at?: string | null
          created_at?: string
          discount_percent?: number | null
          doctor_id: string
          expires_at?: string | null
          id?: string
          items?: Json
          patient_id: string
          payment_id?: string | null
          prescription_id?: string | null
          status?: string
          total_amount?: number | null
        }
        Update: {
          cart_token?: string
          completed_at?: string | null
          created_at?: string
          discount_percent?: number | null
          doctor_id?: string
          expires_at?: string | null
          id?: string
          items?: Json
          patient_id?: string
          payment_id?: string | null
          prescription_id?: string | null
          status?: string
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_carts_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_hash_audit: {
        Row: {
          audited_at: string
          hash_present: boolean
          http_status: number | null
          id: string
          is_valid: boolean
          notes: string | null
          pdf_reachable: boolean | null
          prescription_id: string
          signature_hash: string | null
          signed_pdf_url: string | null
        }
        Insert: {
          audited_at?: string
          hash_present?: boolean
          http_status?: number | null
          id?: string
          is_valid?: boolean
          notes?: string | null
          pdf_reachable?: boolean | null
          prescription_id: string
          signature_hash?: string | null
          signed_pdf_url?: string | null
        }
        Update: {
          audited_at?: string
          hash_present?: boolean
          http_status?: number | null
          id?: string
          is_valid?: boolean
          notes?: string | null
          pdf_reachable?: boolean | null
          prescription_id?: string
          signature_hash?: string | null
          signed_pdf_url?: string | null
        }
        Relationships: []
      }
      prescription_requests: {
        Row: {
          created_at: string
          doctor_id: string | null
          id: string
          notes: string | null
          patient_id: string
          prescription_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          prescription_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          prescription_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_requests_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          anvisa_code: string | null
          appointment_id: string | null
          copies: number
          created_at: string
          diagnosis_cid: string | null
          digital_signature: string | null
          doctor_id: string
          icp_provider: string | null
          id: string
          instructions: string | null
          medical_record_id: string | null
          medications: Json
          patient_id: string
          pharmacy_id: string | null
          pharmacy_name: string | null
          prescription_type: string
          signature_date: string | null
          signature_hash: string | null
          signature_provider: string | null
          signed_pdf_url: string | null
          status: string
          thc_percentage: number | null
          updated_at: string
          valid_until: string | null
          verification_code: string | null
        }
        Insert: {
          anvisa_code?: string | null
          appointment_id?: string | null
          copies?: number
          created_at?: string
          diagnosis_cid?: string | null
          digital_signature?: string | null
          doctor_id: string
          icp_provider?: string | null
          id?: string
          instructions?: string | null
          medical_record_id?: string | null
          medications?: Json
          patient_id: string
          pharmacy_id?: string | null
          pharmacy_name?: string | null
          prescription_type?: string
          signature_date?: string | null
          signature_hash?: string | null
          signature_provider?: string | null
          signed_pdf_url?: string | null
          status?: string
          thc_percentage?: number | null
          updated_at?: string
          valid_until?: string | null
          verification_code?: string | null
        }
        Update: {
          anvisa_code?: string | null
          appointment_id?: string | null
          copies?: number
          created_at?: string
          diagnosis_cid?: string | null
          digital_signature?: string | null
          doctor_id?: string
          icp_provider?: string | null
          id?: string
          instructions?: string | null
          medical_record_id?: string | null
          medications?: Json
          patient_id?: string
          pharmacy_id?: string | null
          pharmacy_name?: string | null
          prescription_type?: string
          signature_date?: string | null
          signature_hash?: string | null
          signature_provider?: string | null
          signed_pdf_url?: string | null
          status?: string
          thc_percentage?: number | null
          updated_at?: string
          valid_until?: string | null
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      product_alert_subscriptions: {
        Row: {
          categories: string[]
          channels: string[]
          created_at: string
          id: string
          is_active: boolean
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: string[]
          channels?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: string[]
          channels?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_complement: string | null
          address_number: string | null
          address_street: string | null
          anvisa_protocol: string | null
          avatar_url: string | null
          cannabis_experience: string | null
          cep: string | null
          city: string | null
          country: string | null
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          geo_updated_at: string | null
          health_goal: string | null
          id: string
          is_subscriber: boolean | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          onboarding_completed: boolean
          phone: string | null
          pix_key: string | null
          pix_type: string | null
          planta_coins: number | null
          referred_by: string | null
          region: string | null
          signature_url: string | null
          signup_role: string | null
          updated_at: string
          user_type: string
        }
        Insert: {
          address_complement?: string | null
          address_number?: string | null
          address_street?: string | null
          anvisa_protocol?: string | null
          avatar_url?: string | null
          cannabis_experience?: string | null
          cep?: string | null
          city?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          geo_updated_at?: string | null
          health_goal?: string | null
          id: string
          is_subscriber?: boolean | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          pix_key?: string | null
          pix_type?: string | null
          planta_coins?: number | null
          referred_by?: string | null
          region?: string | null
          signature_url?: string | null
          signup_role?: string | null
          updated_at?: string
          user_type?: string
        }
        Update: {
          address_complement?: string | null
          address_number?: string | null
          address_street?: string | null
          anvisa_protocol?: string | null
          avatar_url?: string | null
          cannabis_experience?: string | null
          cep?: string | null
          city?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          geo_updated_at?: string | null
          health_goal?: string | null
          id?: string
          is_subscriber?: boolean | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          pix_key?: string | null
          pix_type?: string | null
          planta_coins?: number | null
          referred_by?: string | null
          region?: string | null
          signature_url?: string | null
          signup_role?: string | null
          updated_at?: string
          user_type?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      recovery_campaigns: {
        Row: {
          affiliate_notified: boolean | null
          coupon_code: string | null
          created_at: string
          discount_amount: number | null
          expires_at: string | null
          id: string
          message_sent_via: string | null
          metadata: Json | null
          status: string
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_notified?: boolean | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          expires_at?: string | null
          id?: string
          message_sent_via?: string | null
          metadata?: Json | null
          status?: string
          trigger_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_notified?: boolean | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          expires_at?: string | null
          id?: string
          message_sent_via?: string | null
          metadata?: Json | null
          status?: string
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_links: {
        Row: {
          code: string
          created_at: string
          id: string
          level1_referrer: string | null
          level2_referrer: string | null
          level3_referrer: string | null
          referred_by: string | null
          total_earnings: number | null
          total_referrals: number | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          level1_referrer?: string | null
          level2_referrer?: string | null
          level3_referrer?: string | null
          referred_by?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          level1_referrer?: string | null
          level2_referrer?: string | null
          level3_referrer?: string | null
          referred_by?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          user_id?: string
        }
        Relationships: []
      }
      remote_command_log: {
        Row: {
          action: string
          created_at: string
          error: string | null
          id: string
          key: string | null
          payload: Json | null
          source_ip: string | null
          success: boolean
        }
        Insert: {
          action: string
          created_at?: string
          error?: string | null
          id?: string
          key?: string | null
          payload?: Json | null
          source_ip?: string | null
          success?: boolean
        }
        Update: {
          action?: string
          created_at?: string
          error?: string | null
          id?: string
          key?: string | null
          payload?: Json | null
          source_ip?: string | null
          success?: boolean
        }
        Relationships: []
      }
      revenue_distribution_pool: {
        Row: {
          created_at: string
          distributed_amount: number
          id: string
          month: number
          status: string
          total_pool: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          distributed_amount?: number
          id?: string
          month: number
          status?: string
          total_pool?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          distributed_amount?: number
          id?: string
          month?: number
          status?: string
          total_pool?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      rls_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          reason: string | null
          row_pk: string | null
          table_name: string
          user_id: string | null
          user_role: string | null
          was_allowed: boolean
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          reason?: string | null
          row_pk?: string | null
          table_name: string
          user_id?: string | null
          user_role?: string | null
          was_allowed: boolean
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          reason?: string | null
          row_pk?: string | null
          table_name?: string
          user_id?: string | null
          user_role?: string | null
          was_allowed?: boolean
        }
        Relationships: []
      }
      saas_subscriptions: {
        Row: {
          alert_days_before: number | null
          api_key_env_var: string | null
          auto_pay: boolean | null
          billing_day: number | null
          created_at: string | null
          dashboard_url: string | null
          id: string
          monthly_cost_brl: number | null
          monthly_cost_usd: number | null
          next_due_date: string | null
          notes: string | null
          payment_method: string | null
          provider: string
          service_name: string
          status: string | null
        }
        Insert: {
          alert_days_before?: number | null
          api_key_env_var?: string | null
          auto_pay?: boolean | null
          billing_day?: number | null
          created_at?: string | null
          dashboard_url?: string | null
          id?: string
          monthly_cost_brl?: number | null
          monthly_cost_usd?: number | null
          next_due_date?: string | null
          notes?: string | null
          payment_method?: string | null
          provider: string
          service_name: string
          status?: string | null
        }
        Update: {
          alert_days_before?: number | null
          api_key_env_var?: string | null
          auto_pay?: boolean | null
          billing_day?: number | null
          created_at?: string | null
          dashboard_url?: string | null
          id?: string
          monthly_cost_brl?: number | null
          monthly_cost_usd?: number | null
          next_due_date?: string | null
          notes?: string | null
          payment_method?: string | null
          provider?: string
          service_name?: string
          status?: string | null
        }
        Relationships: []
      }
      saude_verde_appointments: {
        Row: {
          appointment_type: string | null
          beneficiary_name: string | null
          created_at: string | null
          discount_pct: number | null
          final_price_brl: number | null
          id: string
          mp_payment_id: string | null
          notes: string | null
          original_price_brl: number | null
          partner_id: string | null
          payment_method: string | null
          payment_status: string | null
          savings_brl: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          specialty_id: string | null
          status: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          appointment_type?: string | null
          beneficiary_name?: string | null
          created_at?: string | null
          discount_pct?: number | null
          final_price_brl?: number | null
          id?: string
          mp_payment_id?: string | null
          notes?: string | null
          original_price_brl?: number | null
          partner_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          savings_brl?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          specialty_id?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_type?: string | null
          beneficiary_name?: string | null
          created_at?: string | null
          discount_pct?: number | null
          final_price_brl?: number | null
          id?: string
          mp_payment_id?: string | null
          notes?: string | null
          original_price_brl?: number | null
          partner_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          savings_brl?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          specialty_id?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saude_verde_appointments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "saude_verde_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saude_verde_appointments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "saude_verde_partners_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saude_verde_appointments_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "saude_verde_specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saude_verde_appointments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "saude_verde_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      saude_verde_partner_requests: {
        Row: {
          category: string | null
          city: string | null
          cnpj: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          id: string
          message: string | null
          state: string | null
          status: string | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          cnpj?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          state?: string | null
          status?: string | null
        }
        Update: {
          category?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          state?: string | null
          status?: string | null
        }
        Relationships: []
      }
      saude_verde_partners: {
        Row: {
          accepts_online: boolean | null
          address: string | null
          api_key_hash: string | null
          available_exams: Json | null
          available_specialties: Json | null
          category: string
          city: string | null
          country: string | null
          created_at: string | null
          discount_pct: number | null
          discount_pct_max: number | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          price_from_brl: number | null
          rating: number | null
          slug: string | null
          state: string | null
          subcategory: string | null
          total_reviews: number | null
          website: string | null
          whatsapp: string | null
          zipcode: string | null
        }
        Insert: {
          accepts_online?: boolean | null
          address?: string | null
          api_key_hash?: string | null
          available_exams?: Json | null
          available_specialties?: Json | null
          category: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          discount_pct?: number | null
          discount_pct_max?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          price_from_brl?: number | null
          rating?: number | null
          slug?: string | null
          state?: string | null
          subcategory?: string | null
          total_reviews?: number | null
          website?: string | null
          whatsapp?: string | null
          zipcode?: string | null
        }
        Update: {
          accepts_online?: boolean | null
          address?: string | null
          api_key_hash?: string | null
          available_exams?: Json | null
          available_specialties?: Json | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          discount_pct?: number | null
          discount_pct_max?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          price_from_brl?: number | null
          rating?: number | null
          slug?: string | null
          state?: string | null
          subcategory?: string | null
          total_reviews?: number | null
          website?: string | null
          whatsapp?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
      saude_verde_plans: {
        Row: {
          created_at: string | null
          discount_pct_max: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_beneficiaries: number | null
          name: string
          period: string
          price_brl: number
          price_eur: number | null
          price_usd: number | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          discount_pct_max?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_beneficiaries?: number | null
          name: string
          period?: string
          price_brl: number
          price_eur?: number | null
          price_usd?: number | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          discount_pct_max?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_beneficiaries?: number | null
          name?: string
          period?: string
          price_brl?: number
          price_eur?: number | null
          price_usd?: number | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      saude_verde_referral_commissions: {
        Row: {
          affiliate_user_id: string
          amount_brl: number
          created_at: string
          id: string
          payment_id: string | null
          referred_user_id: string
          status: string
          subscription_id: string | null
        }
        Insert: {
          affiliate_user_id: string
          amount_brl?: number
          created_at?: string
          id?: string
          payment_id?: string | null
          referred_user_id: string
          status?: string
          subscription_id?: string | null
        }
        Update: {
          affiliate_user_id?: string
          amount_brl?: number
          created_at?: string
          id?: string
          payment_id?: string | null
          referred_user_id?: string
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saude_verde_referral_commissions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "saude_verde_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      saude_verde_specialties: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_featured: boolean | null
          name: string
          partners_count: number | null
          price_from_brl: number | null
          slug: string | null
          sort_order: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          name: string
          partners_count?: number | null
          price_from_brl?: number | null
          slug?: string | null
          sort_order?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          partners_count?: number | null
          price_from_brl?: number | null
          slug?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      saude_verde_subscriptions: {
        Row: {
          affiliate_referrer: string | null
          auto_renew: boolean
          beneficiaries: Json | null
          card_number: string | null
          card_qrcode_url: string | null
          created_at: string | null
          currency: string | null
          expires_at: string | null
          expiry_reminded_at: string | null
          id: string
          last_payment_id: string | null
          mp_subscription_id: string | null
          plan_id: string | null
          renewal_count: number
          started_at: string | null
          status: string | null
          stripe_subscription_id: string | null
          total_appointments: number | null
          total_savings_brl: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_referrer?: string | null
          auto_renew?: boolean
          beneficiaries?: Json | null
          card_number?: string | null
          card_qrcode_url?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          expiry_reminded_at?: string | null
          id?: string
          last_payment_id?: string | null
          mp_subscription_id?: string | null
          plan_id?: string | null
          renewal_count?: number
          started_at?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          total_appointments?: number | null
          total_savings_brl?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_referrer?: string | null
          auto_renew?: boolean
          beneficiaries?: Json | null
          card_number?: string | null
          card_qrcode_url?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          expiry_reminded_at?: string | null
          id?: string
          last_payment_id?: string | null
          mp_subscription_id?: string | null
          plan_id?: string | null
          renewal_count?: number
          started_at?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          total_appointments?: number | null
          total_savings_brl?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saude_verde_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saude_verde_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      scientific_articles: {
        Row: {
          abstract: string
          authors: string | null
          created_at: string
          doi: string | null
          id: string
          keywords: string[] | null
          source: string | null
          title: string
          url: string | null
          year: number | null
        }
        Insert: {
          abstract: string
          authors?: string | null
          created_at?: string
          doi?: string | null
          id?: string
          keywords?: string[] | null
          source?: string | null
          title: string
          url?: string | null
          year?: number | null
        }
        Update: {
          abstract?: string
          authors?: string | null
          created_at?: string
          doi?: string | null
          id?: string
          keywords?: string[] | null
          source?: string | null
          title?: string
          url?: string | null
          year?: number | null
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          delivered_at: string | null
          delivered_to_whatsapp: boolean
          delivery_attempts: number
          id: string
          message: string
          payload: Json | null
          related_user_id: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          delivered_at?: string | null
          delivered_to_whatsapp?: boolean
          delivery_attempts?: number
          id?: string
          message: string
          payload?: Json | null
          related_user_id?: string | null
          severity?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          delivered_at?: string | null
          delivered_to_whatsapp?: boolean
          delivery_attempts?: number
          id?: string
          message?: string
          payload?: Json | null
          related_user_id?: string | null
          severity?: string
        }
        Relationships: []
      }
      sentinel_escalation_rules: {
        Row: {
          consecutive_threshold: number
          cooldown_minutes: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          issue_code: string
          last_escalated_at: string | null
          primary_channel: string
          primary_target: string
          secondary_channel: string | null
          secondary_target: string | null
          updated_at: string
        }
        Insert: {
          consecutive_threshold?: number
          cooldown_minutes?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          issue_code: string
          last_escalated_at?: string | null
          primary_channel?: string
          primary_target: string
          secondary_channel?: string | null
          secondary_target?: string | null
          updated_at?: string
        }
        Update: {
          consecutive_threshold?: number
          cooldown_minutes?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          issue_code?: string
          last_escalated_at?: string | null
          primary_channel?: string
          primary_target?: string
          secondary_channel?: string | null
          secondary_target?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_counters: {
        Row: {
          count: number
          id: string
          updated_at: string
        }
        Insert: {
          count?: number
          id: string
          updated_at?: string
        }
        Update: {
          count?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_interactions: {
        Row: {
          ad_id: string | null
          campaign_source: string | null
          conversion_event: string | null
          converted_at: string | null
          created_at: string
          custom_fields: Json | null
          device_type: string | null
          engagement_data: Json | null
          flow_triggered: string | null
          funnel_stage: string | null
          geo_location: string | null
          id: string
          interaction_type: string
          keyword_matched: string | null
          lead_score: number | null
          message_content: string | null
          platform: string
          post_caption: string | null
          post_id: string | null
          post_url: string | null
          responded_at: string | null
          sentiment: string | null
          subscriber_id: string | null
          subscriber_name: string | null
          subscriber_phone: string | null
          subscriber_profile_url: string | null
          subscriber_username: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          ad_id?: string | null
          campaign_source?: string | null
          conversion_event?: string | null
          converted_at?: string | null
          created_at?: string
          custom_fields?: Json | null
          device_type?: string | null
          engagement_data?: Json | null
          flow_triggered?: string | null
          funnel_stage?: string | null
          geo_location?: string | null
          id?: string
          interaction_type?: string
          keyword_matched?: string | null
          lead_score?: number | null
          message_content?: string | null
          platform?: string
          post_caption?: string | null
          post_id?: string | null
          post_url?: string | null
          responded_at?: string | null
          sentiment?: string | null
          subscriber_id?: string | null
          subscriber_name?: string | null
          subscriber_phone?: string | null
          subscriber_profile_url?: string | null
          subscriber_username?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          ad_id?: string | null
          campaign_source?: string | null
          conversion_event?: string | null
          converted_at?: string | null
          created_at?: string
          custom_fields?: Json | null
          device_type?: string | null
          engagement_data?: Json | null
          flow_triggered?: string | null
          funnel_stage?: string | null
          geo_location?: string | null
          id?: string
          interaction_type?: string
          keyword_matched?: string | null
          lead_score?: number | null
          message_content?: string | null
          platform?: string
          post_caption?: string | null
          post_id?: string | null
          post_url?: string | null
          responded_at?: string | null
          sentiment?: string | null
          subscriber_id?: string | null
          subscriber_name?: string | null
          subscriber_phone?: string | null
          subscriber_profile_url?: string | null
          subscriber_username?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      sre_alert_dedup: {
        Row: {
          alert_date: string
          alert_key: string
          first_sent_at: string
          id: string
          last_seen_at: string
          level: string
          occurrences: number
          title: string | null
        }
        Insert: {
          alert_date?: string
          alert_key: string
          first_sent_at?: string
          id?: string
          last_seen_at?: string
          level: string
          occurrences?: number
          title?: string | null
        }
        Update: {
          alert_date?: string
          alert_key?: string
          first_sent_at?: string
          id?: string
          last_seen_at?: string
          level?: string
          occurrences?: number
          title?: string | null
        }
        Relationships: []
      }
      strain_images: {
        Row: {
          created_at: string
          id: number
          image_url: string
          strain_id: number
          strain_name: string
        }
        Insert: {
          created_at?: string
          id?: number
          image_url: string
          strain_id: number
          strain_name: string
        }
        Update: {
          created_at?: string
          id?: number
          image_url?: string
          strain_id?: number
          strain_name?: string
        }
        Relationships: []
      }
      strains_library: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          indications: string[] | null
          name: string
          slug: string
          terpenes: string[] | null
          thc_cbd_ratio: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          indications?: string[] | null
          name: string
          slug: string
          terpenes?: string[] | null
          thc_cbd_ratio?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          indications?: string[] | null
          name?: string
          slug?: string
          terpenes?: string[] | null
          thc_cbd_ratio?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          metric_value: number | null
          resolved: boolean
          resolved_at: string | null
          severity: string
          threshold_value: number | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metric_value?: number | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          threshold_value?: number | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metric_value?: number | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          threshold_value?: number | null
        }
        Relationships: []
      }
      system_cache: {
        Row: {
          cache_key: string
          cache_value: Json | null
          created_at: string
          expires_at: string
          id: string
          namespace: string
          updated_at: string
        }
        Insert: {
          cache_key: string
          cache_value?: Json | null
          created_at?: string
          expires_at: string
          id?: string
          namespace: string
          updated_at?: string
        }
        Update: {
          cache_key?: string
          cache_value?: Json | null
          created_at?: string
          expires_at?: string
          id?: string
          namespace?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_errors: {
        Row: {
          context: Json | null
          created_at: string
          endpoint: string | null
          error_message: string
          id: string
          resolved: boolean
          resolved_at: string | null
          stack: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          endpoint?: string | null
          error_message: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          stack?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          endpoint?: string | null
          error_message?: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          stack?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tcle_consents: {
        Row: {
          accepted_at: string
          appointment_id: string | null
          checks: Json
          created_at: string
          doctor_name: string | null
          id: string
          ip_hint: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          appointment_id?: string | null
          checks?: Json
          created_at?: string
          doctor_name?: string | null
          id?: string
          ip_hint?: string | null
          user_agent?: string | null
          user_id: string
          version?: string
        }
        Update: {
          accepted_at?: string
          appointment_id?: string | null
          checks?: Json
          created_at?: string
          doctor_name?: string | null
          id?: string
          ip_hint?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      treatment_logs: {
        Row: {
          anxiety_level: number
          cbd_pct: number
          created_at: string
          dosage_mg: number
          id: string
          logged_at: string
          mood_level: number
          notes: string | null
          pain_level: number
          product: string
          route: string
          side_effects: string[] | null
          sleep_quality: number
          thc_pct: number
          user_id: string
        }
        Insert: {
          anxiety_level?: number
          cbd_pct?: number
          created_at?: string
          dosage_mg?: number
          id?: string
          logged_at?: string
          mood_level?: number
          notes?: string | null
          pain_level?: number
          product: string
          route?: string
          side_effects?: string[] | null
          sleep_quality?: number
          thc_pct?: number
          user_id: string
        }
        Update: {
          anxiety_level?: number
          cbd_pct?: number
          created_at?: string
          dosage_mg?: number
          id?: string
          logged_at?: string
          mood_level?: number
          notes?: string | null
          pain_level?: number
          product?: string
          route?: string
          side_effects?: string[] | null
          sleep_quality?: number
          thc_pct?: number
          user_id?: string
        }
        Relationships: []
      }
      treatment_subscriptions: {
        Row: {
          created_at: string
          id: string
          last_charge_at: string | null
          metadata: Json | null
          monthly_amount: number
          mp_subscription_id: string | null
          next_charge_at: string
          patient_id: string
          plan_code: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_charge_at?: string | null
          metadata?: Json | null
          monthly_amount?: number
          mp_subscription_id?: string | null
          next_charge_at?: string
          patient_id: string
          plan_code?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_charge_at?: string | null
          metadata?: Json | null
          monthly_amount?: number
          mp_subscription_id?: string | null
          next_charge_at?: string
          patient_id?: string
          plan_code?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      triage_abandonment_tracking: {
        Row: {
          abandoned_at: string | null
          converted: boolean | null
          converted_at: string | null
          coupon_code: string | null
          coupon_sent: boolean | null
          created_at: string
          id: string
          manychat_notified: boolean | null
          patient_name: string | null
          patient_phone: string | null
          session_id: string
          triage_started_at: string
          user_id: string | null
        }
        Insert: {
          abandoned_at?: string | null
          converted?: boolean | null
          converted_at?: string | null
          coupon_code?: string | null
          coupon_sent?: boolean | null
          created_at?: string
          id?: string
          manychat_notified?: boolean | null
          patient_name?: string | null
          patient_phone?: string | null
          session_id: string
          triage_started_at?: string
          user_id?: string | null
        }
        Update: {
          abandoned_at?: string | null
          converted?: boolean | null
          converted_at?: string | null
          coupon_code?: string | null
          coupon_sent?: boolean | null
          created_at?: string
          id?: string
          manychat_notified?: boolean | null
          patient_name?: string | null
          patient_phone?: string | null
          session_id?: string
          triage_started_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      uptime_alerts: {
        Row: {
          created_at: string
          error: string | null
          id: string
          resolved_at: string | null
          route: string
          status_code: number | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          resolved_at?: string | null
          route: string
          status_code?: number | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          resolved_at?: string | null
          route?: string
          status_code?: number | null
        }
        Relationships: []
      }
      uptime_log: {
        Row: {
          checked_at: string
          error: string | null
          id: string
          is_up: boolean
          latency_ms: number | null
          route: string
          status_code: number | null
          url: string
        }
        Insert: {
          checked_at?: string
          error?: string | null
          id?: string
          is_up: boolean
          latency_ms?: number | null
          route: string
          status_code?: number | null
          url: string
        }
        Update: {
          checked_at?: string
          error?: string | null
          id?: string
          is_up?: boolean
          latency_ms?: number | null
          route?: string
          status_code?: number | null
          url?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          accepted: boolean
          consent_type: string
          created_at: string
          id: string
          ip_address: string | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted?: boolean
          consent_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
          version?: string
        }
        Update: {
          accepted?: boolean
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      user_content_bans: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          reason: string
          severity: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          reason: string
          severity?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          reason?: string
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      user_experiences: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          image_urls: string[] | null
          likes_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          likes_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          likes_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_products: {
        Row: {
          category: string
          compare_price: number | null
          concentration: string | null
          created_at: string
          description: string | null
          endorsed_by_doctor: boolean
          id: string
          image_url: string | null
          image_url_2: string | null
          image_url_3: string | null
          is_active: boolean
          is_approved_by_admin: boolean
          is_showcase: boolean
          name: string
          price: number
          rating: number | null
          requires_prescription: boolean
          review_count: number
          sold_count: number
          stock: number
          stock_quantity: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category?: string
          compare_price?: number | null
          concentration?: string | null
          created_at?: string
          description?: string | null
          endorsed_by_doctor?: boolean
          id?: string
          image_url?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          is_active?: boolean
          is_approved_by_admin?: boolean
          is_showcase?: boolean
          name: string
          price: number
          rating?: number | null
          requires_prescription?: boolean
          review_count?: number
          sold_count?: number
          stock?: number
          stock_quantity?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category?: string
          compare_price?: number | null
          concentration?: string | null
          created_at?: string
          description?: string | null
          endorsed_by_doctor?: boolean
          id?: string
          image_url?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          is_active?: boolean
          is_approved_by_admin?: boolean
          is_showcase?: boolean
          name?: string
          price?: number
          rating?: number | null
          requires_prescription?: boolean
          review_count?: number
          sold_count?: number
          stock?: number
          stock_quantity?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_sales_splits: {
        Row: {
          created_at: string
          id: string
          order_id: string
          paid_at: string | null
          payout_status: string
          platform_fee_5pct: number
          total_item_amount: number
          vendor_id: string
          vendor_net_95pct: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          paid_at?: string | null
          payout_status?: string
          platform_fee_5pct: number
          total_item_amount: number
          vendor_id: string
          vendor_net_95pct: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          payout_status?: string
          platform_fee_5pct?: number
          total_item_amount?: number
          vendor_id?: string
          vendor_net_95pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_sales_splits_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_sales_splits_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_transactions: {
        Row: {
          amount: number
          buyer_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_id: string | null
          payment_method: string | null
          platform_fee: number
          product_id: string | null
          status: string
          type: string
          vendor_amount: number
          vendor_id: string
        }
        Insert: {
          amount: number
          buyer_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_method?: string | null
          platform_fee?: number
          product_id?: string | null
          status?: string
          type?: string
          vendor_amount?: number
          vendor_id: string
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_method?: string | null
          platform_fee?: number
          product_id?: string | null
          status?: string
          type?: string
          vendor_amount?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vendor_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          afe_doc_url: string | null
          anvisa_ae: string | null
          anvisa_afe: string | null
          balance: number
          cnpj: string | null
          contrato_social_url: string | null
          created_at: string
          crf_doc_url: string | null
          crf_numero: string | null
          crf_uf: string | null
          endereco_completo: Json | null
          fachada_foto_url: string | null
          id: string
          is_active: boolean
          is_kyc_approved: boolean
          kyc_approved_at: string | null
          kyc_approved_by: string | null
          kyc_rejection_reason: string | null
          kyc_status: string
          logo_url: string | null
          max_showcase_products: number
          mp_collector_id: string | null
          nome_fantasia: string | null
          pix_key: string | null
          rating: number | null
          razao_social: string | null
          responsavel_tecnico: string | null
          shipping_origin_cep: string | null
          store_banner_url: string | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string
          telefone_whatsapp: string | null
          total_products: number
          total_sales: number
          updated_at: string
          user_id: string
        }
        Insert: {
          afe_doc_url?: string | null
          anvisa_ae?: string | null
          anvisa_afe?: string | null
          balance?: number
          cnpj?: string | null
          contrato_social_url?: string | null
          created_at?: string
          crf_doc_url?: string | null
          crf_numero?: string | null
          crf_uf?: string | null
          endereco_completo?: Json | null
          fachada_foto_url?: string | null
          id?: string
          is_active?: boolean
          is_kyc_approved?: boolean
          kyc_approved_at?: string | null
          kyc_approved_by?: string | null
          kyc_rejection_reason?: string | null
          kyc_status?: string
          logo_url?: string | null
          max_showcase_products?: number
          mp_collector_id?: string | null
          nome_fantasia?: string | null
          pix_key?: string | null
          rating?: number | null
          razao_social?: string | null
          responsavel_tecnico?: string | null
          shipping_origin_cep?: string | null
          store_banner_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name: string
          telefone_whatsapp?: string | null
          total_products?: number
          total_sales?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          afe_doc_url?: string | null
          anvisa_ae?: string | null
          anvisa_afe?: string | null
          balance?: number
          cnpj?: string | null
          contrato_social_url?: string | null
          created_at?: string
          crf_doc_url?: string | null
          crf_numero?: string | null
          crf_uf?: string | null
          endereco_completo?: Json | null
          fachada_foto_url?: string | null
          id?: string
          is_active?: boolean
          is_kyc_approved?: boolean
          kyc_approved_at?: string | null
          kyc_approved_by?: string | null
          kyc_rejection_reason?: string | null
          kyc_status?: string
          logo_url?: string | null
          max_showcase_products?: number
          mp_collector_id?: string | null
          nome_fantasia?: string | null
          pix_key?: string | null
          rating?: number | null
          razao_social?: string | null
          responsavel_tecnico?: string | null
          shipping_origin_cep?: string | null
          store_banner_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string
          telefone_whatsapp?: string | null
          total_products?: number
          total_sales?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verdinho_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          sentiment: string | null
          session_id: string
          topic: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          sentiment?: string | null
          session_id?: string
          topic?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          sentiment?: string | null
          session_id?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verdinho_knowledge: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          last_asked_at: string
          question: string
          times_asked: number
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          last_asked_at?: string
          question: string
          times_asked?: number
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          last_asked_at?: string
          question?: string
          times_asked?: number
        }
        Relationships: []
      }
      video_rooms: {
        Row: {
          consultation_id: string
          created_at: string
          doctor_id: string
          ended_at: string | null
          id: string
          patient_id: string
          room_name: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          consultation_id: string
          created_at?: string
          doctor_id: string
          ended_at?: string | null
          id?: string
          patient_id: string
          room_name: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          consultation_id?: string
          created_at?: string
          doctor_id?: string
          ended_at?: string | null
          id?: string
          patient_id?: string
          room_name?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_rooms_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_rooms_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: true
            referencedRelation: "financial_reports"
            referencedColumns: ["appointment_id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          event_id: string
          event_type: string | null
          external_reference: string | null
          gateway: string
          id: string
          payload: Json | null
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type?: string | null
          external_reference?: string | null
          gateway: string
          id?: string
          payload?: Json | null
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string | null
          external_reference?: string | null
          gateway?: string
          id?: string
          payload?: Json | null
          processed_at?: string
        }
        Relationships: []
      }
      webhook_idempotency: {
        Row: {
          channel: string | null
          created_at: string
          id: string
          message_id: string
          provider: string
          sender: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          message_id: string
          provider: string
          sender?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          message_id?: string
          provider?: string
          sender?: string | null
        }
        Relationships: []
      }
      whatsapp_brisa_log: {
        Row: {
          created_at: string
          direction: string
          id: string
          is_negative: boolean | null
          message: string
          phone: string
          raw: Json | null
          sentiment_score: number | null
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          is_negative?: boolean | null
          message: string
          phone: string
          raw?: Json | null
          sentiment_score?: number | null
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          is_negative?: boolean | null
          message?: string
          phone?: string
          raw?: Json | null
          sentiment_score?: number | null
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          clinical_summary: string | null
          clinical_summary_at: string | null
          created_at: string
          id: string
          last_intent: string | null
          messages: Json
          patient_id: string | null
          phone_number: string
          sentiment: string | null
          triage_id: string | null
          updated_at: string
        }
        Insert: {
          clinical_summary?: string | null
          clinical_summary_at?: string | null
          created_at?: string
          id?: string
          last_intent?: string | null
          messages?: Json
          patient_id?: string | null
          phone_number: string
          sentiment?: string | null
          triage_id?: string | null
          updated_at?: string
        }
        Update: {
          clinical_summary?: string | null
          clinical_summary_at?: string | null
          created_at?: string
          id?: string
          last_intent?: string | null
          messages?: Json
          patient_id?: string | null
          phone_number?: string
          sentiment?: string | null
          triage_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          direction: string
          id: string
          message_text: string | null
          message_type: string
          remote_jid: string
          sender_name: string | null
          status: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          direction?: string
          id?: string
          message_text?: string | null
          message_type?: string
          remote_jid: string
          sender_name?: string | null
          status?: string
          timestamp?: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          message_text?: string | null
          message_type?: string
          remote_jid?: string
          sender_name?: string | null
          status?: string
          timestamp?: string
        }
        Relationships: []
      }
      whatsapp_routing_log: {
        Row: {
          created_at: string
          detected_intent: string | null
          from_number: string
          id: string
          message_preview: string | null
          metadata: Json | null
          patient_id: string | null
          routed_agent: string
          to_number: string
        }
        Insert: {
          created_at?: string
          detected_intent?: string | null
          from_number: string
          id?: string
          message_preview?: string | null
          metadata?: Json | null
          patient_id?: string | null
          routed_agent: string
          to_number: string
        }
        Update: {
          created_at?: string
          detected_intent?: string | null
          from_number?: string
          id?: string
          message_preview?: string | null
          metadata?: Json | null
          patient_id?: string | null
          routed_agent?: string
          to_number?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          fee: number
          id: string
          net_amount: number
          pix_key: string
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee?: number
          id?: string
          net_amount?: number
          pix_key: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee?: number
          id?: string
          net_amount?: number
          pix_key?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      ai_personas_public: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          channel: string | null
          display_name: string | null
          id: string | null
          persona_key: string | null
          requires_payment: boolean | null
          triggers_intents: string[] | null
          voice_tone: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          channel?: string | null
          display_name?: string | null
          id?: string | null
          persona_key?: string | null
          requires_payment?: boolean | null
          triggers_intents?: string[] | null
          voice_tone?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          channel?: string | null
          display_name?: string | null
          id?: string | null
          persona_key?: string | null
          requires_payment?: boolean | null
          triggers_intents?: string[] | null
          voice_tone?: string | null
        }
        Relationships: []
      }
      clinic_profiles_public: {
        Row: {
          active: boolean | null
          description: string | null
          doctor_name: string | null
          domain: string | null
          id: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string | null
          specialty: string | null
          tagline: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          doctor_name?: string | null
          domain?: string | null
          id?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          specialty?: string | null
          tagline?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          doctor_name?: string | null
          domain?: string | null
          id?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          specialty?: string | null
          tagline?: string | null
        }
        Relationships: []
      }
      consultation_credit_audit_professional: {
        Row: {
          amount: number | null
          audit_phone_masked: string | null
          consultation_id: string | null
          created_at: string | null
          id: string | null
          patient_id: string | null
          professional_id: string | null
          rating_id: string | null
          reason: string | null
          stars: number | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          audit_phone_masked?: never
          consultation_id?: string | null
          created_at?: string | null
          id?: string | null
          patient_id?: string | null
          professional_id?: string | null
          rating_id?: string | null
          reason?: string | null
          stars?: number | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          audit_phone_masked?: never
          consultation_id?: string | null
          created_at?: string | null
          id?: string | null
          patient_id?: string | null
          professional_id?: string | null
          rating_id?: string | null
          reason?: string | null
          stars?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_credit_audit_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "consultation_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          doctor_id: string | null
          doctor_payout: number | null
          patient_id: string | null
          payment_status: string | null
          platform_revenue: number | null
          scheduled_at: string | null
          status: string | null
          total_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes_public: {
        Row: {
          code: string | null
          user_id: string | null
        }
        Insert: {
          code?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      saude_verde_partners_public: {
        Row: {
          accepts_online: boolean | null
          address: string | null
          available_exams: Json | null
          available_specialties: Json | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string | null
          discount_pct: number | null
          discount_pct_max: number | null
          id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string | null
          opening_hours: Json | null
          price_from_brl: number | null
          rating: number | null
          slug: string | null
          state: string | null
          subcategory: string | null
          total_reviews: number | null
          website: string | null
          zipcode: string | null
        }
        Insert: {
          accepts_online?: boolean | null
          address?: string | null
          available_exams?: Json | null
          available_specialties?: Json | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          discount_pct?: number | null
          discount_pct_max?: number | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          opening_hours?: Json | null
          price_from_brl?: number | null
          rating?: number | null
          slug?: string | null
          state?: string | null
          subcategory?: string | null
          total_reviews?: number | null
          website?: string | null
          zipcode?: string | null
        }
        Update: {
          accepts_online?: boolean | null
          address?: string | null
          available_exams?: Json | null
          available_specialties?: Json | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          discount_pct?: number | null
          discount_pct_max?: number | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          opening_hours?: Json | null
          price_from_brl?: number | null
          rating?: number | null
          slug?: string | null
          state?: string | null
          subcategory?: string | null
          total_reviews?: number | null
          website?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
      vendors_public: {
        Row: {
          id: string | null
          rating: number | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string | null
        }
        Insert: {
          id?: string | null
          rating?: number | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string | null
        }
        Update: {
          id?: string | null
          rating?: number | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_doctor_inline_avatar: { Args: { _id: string }; Returns: string }
      admin_doctor_profiles: {
        Args: { _ids: string[] }
        Returns: {
          address_complement: string
          address_number: string
          address_street: string
          avatar_url: string
          cep: string
          city: string
          country: string
          cpf: string
          created_at: string
          date_of_birth: string
          full_name: string
          has_inline_avatar: boolean
          id: string
          neighborhood: string
          phone: string
          pix_key: string
          pix_type: string
          region: string
        }[]
      }
      anonymize_old_ot_orders: { Args: never; Returns: undefined }
      auto_release_brisa_orientacao: { Args: never; Returns: Json }
      calculate_doctor_performance: {
        Args: {
          _consultations: number
          _hours_online: number
          _plan_tier: string
          _rating: number
        }
        Returns: Json
      }
      calculate_fuzzy_severity: { Args: { symptoms: Json }; Returns: Json }
      check_edge_rate_limit: {
        Args: {
          p_bucket: string
          p_key: string
          p_max_hits: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      cleanup_http_logs: { Args: never; Returns: Json }
      complete_brisa_orientacao: {
        Args: { _notes?: string; _payment_row_id: string }
        Returns: Json
      }
      credit_affiliate_wallet: {
        Args: { _amount: number; _user_id: string }
        Returns: undefined
      }
      credit_health_card_wallet: {
        Args: { _amount: number; _mp_payment_id: string; _user_id: string }
        Returns: {
          new_balance: number
          success: boolean
          tx_id: string
        }[]
      }
      debit_health_card_wallet: {
        Args: {
          _amount: number
          _description: string
          _partner_name?: string
          _user_id: string
        }
        Returns: {
          new_balance: number
          reason: string
          success: boolean
          tx_id: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      ensure_affiliate_wallet: { Args: { _user_id: string }; Returns: string }
      ensure_referral_code: { Args: { _user_id: string }; Returns: string }
      get_active_contingency_pix: {
        Args: never
        Returns: {
          beneficiary_name: string
          pix_key: string
          pix_key_type: string
          whatsapp_proof_number: string
        }[]
      }
      get_cron_health: {
        Args: { _window_hours?: number }
        Returns: {
          active: boolean
          expected_window_hours: number
          hours_since_last_run: number
          is_overdue: boolean
          jobname: string
          last_run_at: string
          last_status: string
          schedule: string
        }[]
      }
      get_doctor_display: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          full_name: string
        }[]
      }
      get_doctor_for_country: {
        Args: { _country: string }
        Returns: {
          doctor_id: string
          rating: number
          specialty: string
          user_id: string
        }[]
      }
      get_my_sv_renewal_history: {
        Args: never
        Returns: {
          amount: number
          event_type: string
          payment_id: string
          processed_at: string
          status: string
        }[]
      }
      get_next_available_doctor: {
        Args: never
        Returns: {
          doctor_id: string
          rating: number
          specialty: string
          user_id: string
        }[]
      }
      get_ot_order_by_token: {
        Args: { _session_token: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          payment_status: string
          pdf_url: string
          qr_code: string
          status: string
          updated_at: string
        }[]
      }
      get_passport_by_token: {
        Args: { _token: string }
        Returns: {
          appointment_id: string
          created_at: string
          expires_at: string
          id: string
          is_expired: boolean
          metadata: Json
        }[]
      }
      get_payment_status_summary: {
        Args: never
        Returns: {
          checked_at: string
          error_rate: number
          latency_ms: number
          provider: string
          status: string
        }[]
      }
      get_pending_urgent_triages: {
        Args: never
        Returns: {
          created_at: string
          id: string
          red_flags: string[]
          severity_score: number
          symptoms: Json
          whatsapp: string
        }[]
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_planta_coins: {
        Args: { _coins: number; _user_id: string }
        Returns: undefined
      }
      increment_site_counter: {
        Args: { _counter_id: string }
        Returns: undefined
      }
      is_human_takeover_active: {
        Args: { _contact_id: string }
        Returns: boolean
      }
      log_unified_message: {
        Args: {
          _audio_transcript?: string
          _channel: string
          _contact_id: string
          _content: string
          _direction: string
          _external_id?: string
          _intent?: string
          _message_type?: string
          _raw?: Json
          _urgency?: number
        }
        Returns: string
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      private_get_brisa_cron_secret: { Args: never; Returns: string }
      prune_webhook_idempotency: { Args: never; Returns: undefined }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      register_new_doctor: {
        Args: {
          p_avatar_url: string
          p_bio: string
          p_city: string
          p_country: string
          p_cpf: string
          p_crm: string
          p_crm_state: string
          p_document_type: string
          p_full_name: string
          p_phone: string
          p_pix_key: string
          p_pix_type: string
          p_plan_tier: string
          p_price_video_chat: number
          p_region: string
          p_specialty: string
          p_user_id: string
        }
        Returns: undefined
      }
      search_scientific_articles: {
        Args: { limit_count?: number; query_text: string }
        Returns: {
          abstract: string
          authors: string
          doi: string
          id: string
          keywords: string[]
          rank: number
          title: string
          url: string
          year: number
        }[]
      }
      sync_brisa_vault_secret: { Args: { _value: string }; Returns: string }
      trigger_brisa_social_post: { Args: { _target: string }; Returns: number }
      upsert_unified_contact: {
        Args: {
          _channel: string
          _display_name?: string
          _facebook_psid?: string
          _instagram_id?: string
          _instagram_username?: string
          _phone?: string
          _whatsapp_jid?: string
        }
        Returns: string
      }
      validate_card_token: {
        Args: { _card_number: string; _token: string; _window_seconds?: number }
        Returns: {
          plan_type: string
          reason: string
          status: string
          user_id: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

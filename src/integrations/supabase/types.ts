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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
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
      appointments: {
        Row: {
          amount: number
          cancellation_reason: string | null
          created_at: string
          doctor_id: string
          duration_minutes: number
          id: string
          notes: string | null
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
      doctors: {
        Row: {
          available_hours: Json | null
          bio: string | null
          consultation_price: number
          created_at: string
          crm: string
          crm_state: string
          id: string
          is_online: boolean
          is_verified: boolean
          rating: number | null
          rqe: string | null
          specialty: string
          total_consultations: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_hours?: Json | null
          bio?: string | null
          consultation_price?: number
          created_at?: string
          crm: string
          crm_state?: string
          id?: string
          is_online?: boolean
          is_verified?: boolean
          rating?: number | null
          rqe?: string | null
          specialty?: string
          total_consultations?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_hours?: Json | null
          bio?: string | null
          consultation_price?: number
          created_at?: string
          crm?: string
          crm_state?: string
          id?: string
          is_online?: boolean
          is_verified?: boolean
          rating?: number | null
          rqe?: string | null
          specialty?: string
          total_consultations?: number | null
          updated_at?: string
          user_id?: string
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
      prescriptions: {
        Row: {
          anvisa_code: string | null
          appointment_id: string | null
          created_at: string
          diagnosis_cid: string | null
          digital_signature: string | null
          doctor_id: string
          id: string
          instructions: string | null
          medical_record_id: string | null
          medications: Json
          patient_id: string
          pharmacy_id: string | null
          pharmacy_name: string | null
          signature_date: string | null
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          anvisa_code?: string | null
          appointment_id?: string | null
          created_at?: string
          diagnosis_cid?: string | null
          digital_signature?: string | null
          doctor_id: string
          id?: string
          instructions?: string | null
          medical_record_id?: string | null
          medications?: Json
          patient_id: string
          pharmacy_id?: string | null
          pharmacy_name?: string | null
          signature_date?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          anvisa_code?: string | null
          appointment_id?: string | null
          created_at?: string
          diagnosis_cid?: string | null
          digital_signature?: string | null
          doctor_id?: string
          id?: string
          instructions?: string | null
          medical_record_id?: string | null
          medications?: Json
          patient_id?: string
          pharmacy_id?: string | null
          pharmacy_name?: string | null
          signature_date?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_type: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
          user_type?: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_type?: string
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
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

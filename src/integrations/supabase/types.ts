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
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
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
          {
            foreignKeyName: "brisa_triages_matched_doctor_id_fkey"
            columns: ["matched_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
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
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
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
      doctors: {
        Row: {
          available_hours: Json | null
          bio: string | null
          consultation_price: number
          created_at: string
          crm: string
          crm_state: string
          document_number: string | null
          document_type: string
          id: string
          is_crm_valid: boolean
          is_online: boolean
          is_verified: boolean
          kyc_status: string
          last_crm_check: string | null
          organization_id: string | null
          pix_key: string | null
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
          document_number?: string | null
          document_type?: string
          id?: string
          is_crm_valid?: boolean
          is_online?: boolean
          is_verified?: boolean
          kyc_status?: string
          last_crm_check?: string | null
          organization_id?: string | null
          pix_key?: string | null
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
          document_number?: string | null
          document_type?: string
          id?: string
          is_crm_valid?: boolean
          is_online?: boolean
          is_verified?: boolean
          kyc_status?: string
          last_crm_check?: string | null
          organization_id?: string | null
          pix_key?: string | null
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
      leads_contatos: {
        Row: {
          created_at: string
          id: string
          nome: string
          origem: string
          tags: string[] | null
          telefone: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          origem?: string
          tags?: string[] | null
          telefone: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          origem?: string
          tags?: string[] | null
          telefone?: string
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
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
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
          shipping_cep: string | null
          shipping_cost: number | null
          shipping_method: string | null
          status: string
          subtotal: number
          total: number
          tracking_code: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          items?: Json
          organization_id?: string | null
          payment_id?: string | null
          shipping_cep?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          organization_id?: string | null
          payment_id?: string | null
          shipping_cep?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
          updated_at?: string | null
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
          {
            foreignKeyName: "payout_history_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
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
          avatar_url: string | null
          cannabis_experience: string | null
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          health_goal: string | null
          id: string
          onboarding_completed: boolean
          phone: string | null
          referred_by: string | null
          updated_at: string
          user_type: string
        }
        Insert: {
          avatar_url?: string | null
          cannabis_experience?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          health_goal?: string | null
          id: string
          onboarding_completed?: boolean
          phone?: string | null
          referred_by?: string | null
          updated_at?: string
          user_type?: string
        }
        Update: {
          avatar_url?: string | null
          cannabis_experience?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          health_goal?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          referred_by?: string | null
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
      vendor_products: {
        Row: {
          category: string
          compare_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          image_url_2: string | null
          image_url_3: string | null
          is_active: boolean
          name: string
          price: number
          rating: number | null
          review_count: number
          sold_count: number
          stock: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category?: string
          compare_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          is_active?: boolean
          name: string
          price: number
          rating?: number | null
          review_count?: number
          sold_count?: number
          stock?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category?: string
          compare_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          is_active?: boolean
          name?: string
          price?: number
          rating?: number | null
          review_count?: number
          sold_count?: number
          stock?: number
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
          balance: number
          created_at: string
          id: string
          is_active: boolean
          rating: number | null
          store_banner_url: string | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string
          total_products: number
          total_sales: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          is_active?: boolean
          rating?: number | null
          store_banner_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name: string
          total_products?: number
          total_sales?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          is_active?: boolean
          rating?: number | null
          store_banner_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string
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
      doctors_public: {
        Row: {
          available_hours: Json | null
          bio: string | null
          consultation_price: number | null
          created_at: string | null
          crm: string | null
          crm_state: string | null
          id: string | null
          is_online: boolean | null
          is_verified: boolean | null
          rating: number | null
          specialty: string | null
          total_consultations: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          available_hours?: Json | null
          bio?: string | null
          consultation_price?: number | null
          created_at?: string | null
          crm?: string | null
          crm_state?: string | null
          id?: string | null
          is_online?: boolean | null
          is_verified?: boolean | null
          rating?: number | null
          specialty?: string | null
          total_consultations?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          available_hours?: Json | null
          bio?: string | null
          consultation_price?: number | null
          created_at?: string | null
          crm?: string | null
          crm_state?: string | null
          id?: string | null
          is_online?: boolean | null
          is_verified?: boolean | null
          rating?: number | null
          specialty?: string | null
          total_consultations?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
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
      vendors_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_active: boolean | null
          rating: number | null
          store_banner_url: string | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string | null
          total_products: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          rating?: number | null
          store_banner_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string | null
          total_products?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          rating?: number | null
          store_banner_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string | null
          total_products?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_doctor_performance: {
        Args: {
          _consultations: number
          _hours_online: number
          _plan_tier: string
          _rating: number
        }
        Returns: Json
      }
      credit_affiliate_wallet: {
        Args: { _amount: number; _user_id: string }
        Returns: undefined
      }
      ensure_affiliate_wallet: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_site_counter: {
        Args: { _counter_id: string }
        Returns: undefined
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

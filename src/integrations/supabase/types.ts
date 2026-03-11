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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
          wallet_address?: string
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
          id: string
          payer_email: string | null
          payment_id: string
          raw_data: Json | null
          status: string
        }
        Insert: {
          action?: string | null
          amount?: number | null
          created_at?: string
          id?: string
          payer_email?: string | null
          payment_id: string
          raw_data?: Json | null
          status?: string
        }
        Update: {
          action?: string | null
          amount?: number | null
          created_at?: string
          id?: string
          payer_email?: string | null
          payment_id?: string
          raw_data?: Json | null
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
    }
    Views: {
      [_ in never]: never
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

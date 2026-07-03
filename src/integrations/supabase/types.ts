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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answer_text: string
          id: string
          question_id: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          answer_text: string
          id?: string
          question_id: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          answer_text?: string
          id?: string
          question_id?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      commitments: {
        Row: {
          commitment_text: string
          created_at: string
          id: string
          reminder_sent_3d: boolean
          reminder_sent_7d: boolean
          session_id: string
          source: Database["public"]["Enums"]["commitment_source"]
          user_id: string
        }
        Insert: {
          commitment_text: string
          created_at?: string
          id?: string
          reminder_sent_3d?: boolean
          reminder_sent_7d?: boolean
          session_id: string
          source?: Database["public"]["Enums"]["commitment_source"]
          user_id: string
        }
        Update: {
          commitment_text?: string
          created_at?: string
          id?: string
          reminder_sent_3d?: boolean
          reminder_sent_7d?: boolean
          session_id?: string
          source?: Database["public"]["Enums"]["commitment_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commitments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          category: string
          created_at: string
          email: string | null
          id: string
          message: string
          name: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      couples: {
        Row: {
          anonymity_level: number
          created_at: string
          id: string
          invite_token: string | null
          language: string
        }
        Insert: {
          anonymity_level?: number
          created_at?: string
          id?: string
          invite_token?: string | null
          language?: string
        }
        Update: {
          anonymity_level?: number
          created_at?: string
          id?: string
          invite_token?: string | null
          language?: string
        }
        Relationships: []
      }
      live_messages: {
        Row: {
          created_at: string
          flagged: boolean
          id: string
          live_session_id: string
          message_text: string
          user_token: string
        }
        Insert: {
          created_at?: string
          flagged?: boolean
          id?: string
          live_session_id: string
          message_text: string
          user_token: string
        }
        Update: {
          created_at?: string
          flagged?: boolean
          id?: string
          live_session_id?: string
          message_text?: string
          user_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_messages_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_participants: {
        Row: {
          joined_at: string
          live_session_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          live_session_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          live_session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_participants_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          created_at: string
          id: string
          moderator_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["live_session_status"]
          topic: string
        }
        Insert: {
          created_at?: string
          id?: string
          moderator_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["live_session_status"]
          topic: string
        }
        Update: {
          created_at?: string
          id?: string
          moderator_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["live_session_status"]
          topic?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          couple_id: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          language: string | null
          onboarding_complete: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          couple_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          language?: string | null
          onboarding_complete?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          couple_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string | null
          onboarding_complete?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts_registry: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          prompt_id: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          prompt_id: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          prompt_id?: string
          version?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string | null
          created_at: string
          difficulty: number
          id: string
          order_index: number
          perspective: Database["public"]["Enums"]["question_perspective"]
          question_text: string
          session_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          difficulty?: number
          id?: string
          order_index?: number
          perspective?: Database["public"]["Enums"]["question_perspective"]
          question_text: string
          session_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          difficulty?: number
          id?: string
          order_index?: number
          perspective?: Database["public"]["Enums"]["question_perspective"]
          question_text?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string | null
          couple_id: string
          created_at: string
          id: string
          session_number: number
          status: Database["public"]["Enums"]["session_status"]
        }
        Insert: {
          completed_at?: string | null
          couple_id: string
          created_at?: string
          id?: string
          session_number: number
          status?: Database["public"]["Enums"]["session_status"]
        }
        Update: {
          completed_at?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          session_number?: number
          status?: Database["public"]["Enums"]["session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "sessions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_answers: {
        Row: {
          answer_id: string
          couple_id: string
          created_at: string
          id: string
          is_bookmarked: boolean
        }
        Insert: {
          answer_id: string
          couple_id: string
          created_at?: string
          id?: string
          is_bookmarked?: boolean
        }
        Update: {
          answer_id?: string
          couple_id?: string
          created_at?: string
          id?: string
          is_bookmarked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "shared_answers_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_answers_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
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
      couple_members: {
        Row: {
          couple_id: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          language: string | null
          onboarding_complete: boolean | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
        }
        Insert: {
          couple_id?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          language?: string | null
          onboarding_complete?: boolean | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Update: {
          couple_id?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          language?: string | null
          onboarding_complete?: boolean | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_couple_and_link: {
        Args: { _display_name: string; _language: string }
        Returns: {
          couple_id: string
          invite_token: string
          session_id: string
        }[]
      }
      get_couple_id_for_token: { Args: { _token: string }; Returns: string }
      get_my_couple_id: { Args: never; Returns: string }
      get_my_invite_token: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_live_session_participant: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      join_couple_with_token: {
        Args: { _display_name: string; _token: string }
        Returns: string
      }
      rotate_my_invite_token: { Args: never; Returns: string }
      validate_invite_token: { Args: { _token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "woman_with_endo" | "partner" | "moderator"
      commitment_source: "ai_suggestion" | "free_text"
      live_session_status: "scheduled" | "active" | "closed"
      question_perspective: "partner" | "woman_with_endo" | "both"
      session_status: "pending" | "active" | "completed"
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
      app_role: ["woman_with_endo", "partner", "moderator"],
      commitment_source: ["ai_suggestion", "free_text"],
      live_session_status: ["scheduled", "active", "closed"],
      question_perspective: ["partner", "woman_with_endo", "both"],
      session_status: ["pending", "active", "completed"],
    },
  },
} as const

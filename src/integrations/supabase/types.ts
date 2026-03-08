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
      network_devices: {
        Row: {
          created_at: string
          device_type: string
          hostname: string | null
          id: string
          ip_address: string
          last_seen: string
          mac_address: string
          name: string
          open_ports: number[]
          os: string | null
          risk_level: string
          status: string
        }
        Insert: {
          created_at?: string
          device_type: string
          hostname?: string | null
          id?: string
          ip_address: string
          last_seen?: string
          mac_address: string
          name: string
          open_ports?: number[]
          os?: string | null
          risk_level?: string
          status?: string
        }
        Update: {
          created_at?: string
          device_type?: string
          hostname?: string | null
          id?: string
          ip_address?: string
          last_seen?: string
          mac_address?: string
          name?: string
          open_ports?: number[]
          os?: string | null
          risk_level?: string
          status?: string
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          created_at: string
          devices_found: number
          duration_ms: number
          id: string
          scan_type: string
          status: string
          subnet: string
        }
        Insert: {
          created_at?: string
          devices_found?: number
          duration_ms?: number
          id?: string
          scan_type?: string
          status?: string
          subnet: string
        }
        Update: {
          created_at?: string
          devices_found?: number
          duration_ms?: number
          id?: string
          scan_type?: string
          status?: string
          subnet?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          severity: string
          source_ip: string
          status: string
          target: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          severity: string
          source_ip: string
          status?: string
          target: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          severity?: string
          source_ip?: string
          status?: string
          target?: string
          type?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string
          id: string
          log_level: string
          message: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_level: string
          message: string
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          log_level?: string
          message?: string
          source?: string
        }
        Relationships: []
      }
      threat_analysis: {
        Row: {
          confidence: number
          created_at: string
          description: string | null
          id: string
          iocs: string[]
          name: string
          origin: string
          status: string
          threat_type: string
          ttps: string[]
        }
        Insert: {
          confidence: number
          created_at?: string
          description?: string | null
          id?: string
          iocs?: string[]
          name: string
          origin: string
          status?: string
          threat_type: string
          ttps?: string[]
        }
        Update: {
          confidence?: number
          created_at?: string
          description?: string | null
          id?: string
          iocs?: string[]
          name?: string
          origin?: string
          status?: string
          threat_type?: string
          ttps?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

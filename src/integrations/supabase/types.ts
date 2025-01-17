export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          wallet_address: string
          first_connected_at: string
          last_connected_at: string
          created_at: string
          total_deposits: number
          total_borrows: number
          active_positions: number
        }
        Insert: {
          wallet_address: string
          first_connected_at: string
          last_connected_at: string
          total_deposits?: number
          total_borrows?: number
          active_positions?: number
        }
        Update: {
          wallet_address?: string
          first_connected_at?: string
          last_connected_at?: string
          total_deposits?: number
          total_borrows?: number
          active_positions?: number
        }
      }
      vaults: {
        Row: {
          id: number
          user_id: number
          strategy_type: 'covered_call' | 'protective_put' | 'collar'
          collateral_amount: number
          collateral_token: string
          strike_price: number
          expiry_timestamp: string
          premium_earned: number
          ltv_ratio: number
          health_factor: number
          liquidation_threshold: number
          status: 'active' | 'liquidated' | 'closed'
          created_at: string
          updated_at: string
          tx_hash: string
        }
        Insert: {
          user_id: number
          strategy_type: 'covered_call' | 'protective_put' | 'collar'
          collateral_amount: number
          collateral_token: string
          strike_price: number
          expiry_timestamp: string
          premium_earned?: number
          ltv_ratio: number
          health_factor: number
          liquidation_threshold: number
          status: 'active' | 'liquidated' | 'closed'
          tx_hash: string
        }
        Update: {
          strategy_type?: 'covered_call' | 'protective_put' | 'collar'
          collateral_amount?: number
          strike_price?: number
          expiry_timestamp?: string
          premium_earned?: number
          ltv_ratio?: number
          health_factor?: number
          liquidation_threshold?: number
          status?: 'active' | 'liquidated' | 'closed'
          tx_hash?: string
        }
      }
      options: {
        Row: {
          id: number
          vault_id: number
          option_type: 'call' | 'put'
          strike_price: number
          expiry_timestamp: string
          premium: number
          status: 'active' | 'exercised' | 'expired'
          created_at: string
          tx_hash: string
        }
        Insert: {
          vault_id: number
          option_type: 'call' | 'put'
          strike_price: number
          expiry_timestamp: string
          premium: number
          status: 'active' | 'exercised' | 'expired'
          tx_hash: string
        }
        Update: {
          strike_price?: number
          expiry_timestamp?: string
          premium?: number
          status?: 'active' | 'exercised' | 'expired'
          tx_hash?: string
        }
      }
      loans: {
        Row: {
          id: number
          vault_id: number
          amount: number
          interest_rate: number
          start_timestamp: string
          end_timestamp: string
          status: 'active' | 'repaid' | 'liquidated'
          created_at: string
          tx_hash: string
        }
        Insert: {
          vault_id: number
          amount: number
          interest_rate: number
          start_timestamp: string
          end_timestamp: string
          status: 'active' | 'repaid' | 'liquidated'
          tx_hash: string
        }
        Update: {
          amount?: number
          interest_rate?: number
          end_timestamp?: string
          status?: 'active' | 'repaid' | 'liquidated'
          tx_hash?: string
        }
      }
      liquidation_events: {
        Row: {
          id: number
          vault_id: number
          loan_id: number
          liquidation_price: number
          liquidation_amount: number
          liquidator_address: string
          created_at: string
          tx_hash: string
        }
        Insert: {
          vault_id: number
          loan_id: number
          liquidation_price: number
          liquidation_amount: number
          liquidator_address: string
          tx_hash: string
        }
        Update: {
          liquidation_price?: number
          liquidation_amount?: number
          liquidator_address?: string
          tx_hash?: string
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

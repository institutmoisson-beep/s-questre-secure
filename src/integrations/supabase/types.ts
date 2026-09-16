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
      disputes: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          order_id: string
          raised_by: string
          reason: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          order_id: string
          raised_by: string
          reason: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          order_id?: string
          raised_by?: string
          reason?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_points: {
        Row: {
          business_name: string
          business_registry_url: string | null
          city: string
          commission_percentage: number
          created_at: string
          id: string
          id_document_url: string | null
          latitude: number | null
          longitude: number | null
          neighborhood: string
          owner_user_id: string
          phone: string
          status: Database["public"]["Enums"]["escrow_point_status"]
          type: Database["public"]["Enums"]["escrow_point_type"]
        }
        Insert: {
          business_name: string
          business_registry_url?: string | null
          city: string
          commission_percentage?: number
          created_at?: string
          id?: string
          id_document_url?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood: string
          owner_user_id: string
          phone: string
          status?: Database["public"]["Enums"]["escrow_point_status"]
          type?: Database["public"]["Enums"]["escrow_point_type"]
        }
        Update: {
          business_name?: string
          business_registry_url?: string | null
          city?: string
          commission_percentage?: number
          created_at?: string
          id?: string
          id_document_url?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string
          owner_user_id?: string
          phone?: string
          status?: Database["public"]["Enums"]["escrow_point_status"]
          type?: Database["public"]["Enums"]["escrow_point_type"]
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          buyer_otp: string | null
          cancellation_deadline: string | null
          courier_id: string | null
          created_at: string
          delivery_confirmed_at: string | null
          delivery_fee_xof: number
          escrow_commission_xof: number | null
          escrow_point_id: string
          funds_locked_at: string | null
          id: string
          order_code: string
          picked_up_at: string | null
          platform_commission_xof: number | null
          product_description: string | null
          product_image_urls: string[]
          product_price_xof: number
          product_title: string
          refund_amount_xof: number | null
          seller_confirmed_at: string | null
          seller_id: string
          seller_otp: string | null
          seller_payout_xof: number | null
          source_link: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          buyer_id: string
          buyer_otp?: string | null
          cancellation_deadline?: string | null
          courier_id?: string | null
          created_at?: string
          delivery_confirmed_at?: string | null
          delivery_fee_xof?: number
          escrow_commission_xof?: number | null
          escrow_point_id: string
          funds_locked_at?: string | null
          id?: string
          order_code: string
          picked_up_at?: string | null
          platform_commission_xof?: number | null
          product_description?: string | null
          product_image_urls?: string[]
          product_price_xof: number
          product_title: string
          refund_amount_xof?: number | null
          seller_confirmed_at?: string | null
          seller_id: string
          seller_otp?: string | null
          seller_payout_xof?: number | null
          source_link?: string | null
          status?: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          buyer_id?: string
          buyer_otp?: string | null
          cancellation_deadline?: string | null
          courier_id?: string | null
          created_at?: string
          delivery_confirmed_at?: string | null
          delivery_fee_xof?: number
          escrow_commission_xof?: number | null
          escrow_point_id?: string
          funds_locked_at?: string | null
          id?: string
          order_code?: string
          picked_up_at?: string | null
          platform_commission_xof?: number | null
          product_description?: string | null
          product_image_urls?: string[]
          product_price_xof?: number
          product_title?: string
          refund_amount_xof?: number | null
          seller_confirmed_at?: string | null
          seller_id?: string
          seller_otp?: string | null
          seller_payout_xof?: number | null
          source_link?: string | null
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "orders_escrow_point_id_fkey"
            columns: ["escrow_point_id"]
            isOneToOne: false
            referencedRelation: "escrow_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          default_escrow_commission_percentage: number
          id: boolean
          platform_commission_percentage: number
          updated_at: string
        }
        Insert: {
          default_escrow_commission_percentage?: number
          id?: boolean
          platform_commission_percentage?: number
          updated_at?: string
        }
        Update: {
          default_escrow_commission_percentage?: number
          id?: boolean
          platform_commission_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      sellers: {
        Row: {
          city: string
          claimed_by_user_id: string | null
          completed_orders: number
          created_at: string
          full_name: string
          id: string
          phone: string
          reputation_score: number
          seller_code: string
        }
        Insert: {
          city: string
          claimed_by_user_id?: string | null
          completed_orders?: number
          created_at?: string
          full_name: string
          id?: string
          phone: string
          reputation_score?: number
          seller_code: string
        }
        Update: {
          city?: string
          claimed_by_user_id?: string | null
          completed_orders?: number
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          reputation_score?: number
          seller_code?: string
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
      wallet_transactions: {
        Row: {
          amount_xof: number
          created_at: string
          description: string
          id: string
          order_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_user_id: string
        }
        Insert: {
          amount_xof: number
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_user_id: string
        }
        Update: {
          amount_xof?: number
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance_xof: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_xof?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_xof?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount_xof: number
          created_at: string
          destination_phone: string | null
          id: string
          method: Database["public"]["Enums"]["withdrawal_method"]
          pickup_code: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Insert: {
          amount_xof: number
          created_at?: string
          destination_phone?: string | null
          id?: string
          method: Database["public"]["Enums"]["withdrawal_method"]
          pickup_code?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Update: {
          amount_xof?: number
          created_at?: string
          destination_phone?: string | null
          id?: string
          method?: Database["public"]["Enums"]["withdrawal_method"]
          pickup_code?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_orders: {
        Args: never
        Returns: {
          buyer_id: string
          buyer_otp: string | null
          cancellation_deadline: string | null
          courier_id: string | null
          created_at: string
          delivery_confirmed_at: string | null
          delivery_fee_xof: number
          escrow_commission_xof: number | null
          escrow_point_id: string
          funds_locked_at: string | null
          id: string
          order_code: string
          picked_up_at: string | null
          platform_commission_xof: number | null
          product_description: string | null
          product_image_urls: string[]
          product_price_xof: number
          product_title: string
          refund_amount_xof: number | null
          seller_confirmed_at: string | null
          seller_id: string
          seller_otp: string | null
          seller_payout_xof: number | null
          source_link: string | null
          status: Database["public"]["Enums"]["order_status"]
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_resolve_dispute: {
        Args: { _admin_note: string; _dispute_id: string }
        Returns: {
          admin_note: string | null
          created_at: string
          id: string
          order_id: string
          raised_by: string
          reason: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        SetofOptions: {
          from: "*"
          to: "disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_escrow_point_status: {
        Args: {
          _point_id: string
          _status: Database["public"]["Enums"]["escrow_point_status"]
        }
        Returns: {
          business_name: string
          business_registry_url: string | null
          city: string
          commission_percentage: number
          created_at: string
          id: string
          id_document_url: string | null
          latitude: number | null
          longitude: number | null
          neighborhood: string
          owner_user_id: string
          phone: string
          status: Database["public"]["Enums"]["escrow_point_status"]
          type: Database["public"]["Enums"]["escrow_point_type"]
        }
        SetofOptions: {
          from: "*"
          to: "escrow_points"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_withdrawal_status: {
        Args: {
          _id: string
          _status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Returns: {
          amount_xof: number
          created_at: string
          destination_phone: string | null
          id: string
          method: Database["public"]["Enums"]["withdrawal_method"]
          pickup_code: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawal_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_update_settings: {
        Args: { _escrow: number; _platform: number }
        Returns: {
          default_escrow_commission_percentage: number
          id: boolean
          platform_commission_percentage: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "platform_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      agent_confirm_deposit: {
        Args: { _order_code: string }
        Returns: {
          buyer_id: string
          buyer_otp: string | null
          cancellation_deadline: string | null
          courier_id: string | null
          created_at: string
          delivery_confirmed_at: string | null
          delivery_fee_xof: number
          escrow_commission_xof: number | null
          escrow_point_id: string
          funds_locked_at: string | null
          id: string
          order_code: string
          picked_up_at: string | null
          platform_commission_xof: number | null
          product_description: string | null
          product_image_urls: string[]
          product_price_xof: number
          product_title: string
          refund_amount_xof: number | null
          seller_confirmed_at: string | null
          seller_id: string
          seller_otp: string | null
          seller_payout_xof: number | null
          source_link: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      become_courier: { Args: never; Returns: undefined }
      can_view_order: { Args: { _order_id: string }; Returns: boolean }
      cancel_order: {
        Args: { _order_id: string; _reason: string }
        Returns: {
          buyer_id: string
          buyer_otp: string | null
          cancellation_deadline: string | null
          courier_id: string | null
          created_at: string
          delivery_confirmed_at: string | null
          delivery_fee_xof: number
          escrow_commission_xof: number | null
          escrow_point_id: string
          funds_locked_at: string | null
          id: string
          order_code: string
          picked_up_at: string | null
          platform_commission_xof: number | null
          product_description: string | null
          product_image_urls: string[]
          product_price_xof: number
          product_title: string
          refund_amount_xof: number | null
          seller_confirmed_at: string | null
          seller_id: string
          seller_otp: string | null
          seller_payout_xof: number | null
          source_link: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_seller_account: {
        Args: { _phone: string; _seller_code: string }
        Returns: {
          city: string
          claimed_by_user_id: string | null
          completed_orders: number
          created_at: string
          full_name: string
          id: string
          phone: string
          reputation_score: number
          seller_code: string
        }
        SetofOptions: {
          from: "*"
          to: "sellers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      courier_confirm_delivery: {
        Args: { _order_code: string; _otp: string }
        Returns: {
          buyer_id: string
          buyer_otp: string | null
          cancellation_deadline: string | null
          courier_id: string | null
          created_at: string
          delivery_confirmed_at: string | null
          delivery_fee_xof: number
          escrow_commission_xof: number | null
          escrow_point_id: string
          funds_locked_at: string | null
          id: string
          order_code: string
          picked_up_at: string | null
          platform_commission_xof: number | null
          product_description: string | null
          product_image_urls: string[]
          product_price_xof: number
          product_title: string
          refund_amount_xof: number | null
          seller_confirmed_at: string | null
          seller_id: string
          seller_otp: string | null
          seller_payout_xof: number | null
          source_link: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      courier_jobs: {
        Args: never
        Returns: {
          buyer_id: string
          buyer_otp: string | null
          cancellation_deadline: string | null
          courier_id: string | null
          created_at: string
          delivery_confirmed_at: string | null
          delivery_fee_xof: number
          escrow_commission_xof: number | null
          escrow_point_id: string
          funds_locked_at: string | null
          id: string
          order_code: string
          picked_up_at: string | null
          platform_commission_xof: number | null
          product_description: string | null
          product_image_urls: string[]
          product_price_xof: number
          product_title: string
          refund_amount_xof: number | null
          seller_confirmed_at: string | null
          seller_id: string
          seller_otp: string | null
          seller_payout_xof: number | null
          source_link: string | null
          status: Database["public"]["Enums"]["order_status"]
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      courier_pickup: {
        Args: { _order_code: string; _otp: string }
        Returns: {
          buyer_id: string
          buyer_otp: string | null
          cancellation_deadline: string | null
          courier_id: string | null
          created_at: string
          delivery_confirmed_at: string | null
          delivery_fee_xof: number
          escrow_commission_xof: number | null
          escrow_point_id: string
          funds_locked_at: string | null
          id: string
          order_code: string
          picked_up_at: string | null
          platform_commission_xof: number | null
          product_description: string | null
          product_image_urls: string[]
          product_price_xof: number
          product_title: string
          refund_amount_xof: number | null
          seller_confirmed_at: string | null
          seller_id: string
          seller_otp: string | null
          seller_payout_xof: number | null
          source_link: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_escrow_order: {
        Args: {
          _delivery_fee_xof: number
          _escrow_point_id: string
          _product_description: string
          _product_image_urls: string[]
          _product_price_xof: number
          _product_title: string
          _seller_city: string
          _seller_name: string
          _seller_phone: string
          _source_link: string
        }
        Returns: {
          buyer_id: string
          buyer_otp: string | null
          cancellation_deadline: string | null
          courier_id: string | null
          created_at: string
          delivery_confirmed_at: string | null
          delivery_fee_xof: number
          escrow_commission_xof: number | null
          escrow_point_id: string
          funds_locked_at: string | null
          id: string
          order_code: string
          picked_up_at: string | null
          platform_commission_xof: number | null
          product_description: string | null
          product_image_urls: string[]
          product_price_xof: number
          product_title: string
          refund_amount_xof: number | null
          seller_confirmed_at: string | null
          seller_id: string
          seller_otp: string | null
          seller_payout_xof: number | null
          source_link: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      credit_wallet: {
        Args: {
          _amount: number
          _desc: string
          _order_id: string
          _type: Database["public"]["Enums"]["wallet_tx_type"]
          _user_id: string
        }
        Returns: undefined
      }
      ensure_profile: {
        Args: { _city: string; _full_name: string; _phone: string }
        Returns: {
          city: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      gen_code: { Args: { _len: number; _prefix: string }; Returns: string }
      gen_otp: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_status: {
        Args: {
          _note: string
          _order_id: string
          _status: Database["public"]["Enums"]["order_status"]
        }
        Returns: undefined
      }
      raise_dispute: {
        Args: { _order_id: string; _reason: string }
        Returns: {
          admin_note: string | null
          created_at: string
          id: string
          order_id: string
          raised_by: string
          reason: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        SetofOptions: {
          from: "*"
          to: "disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_escrow_point: {
        Args: {
          _business_name: string
          _business_registry_url: string
          _city: string
          _id_document_url: string
          _neighborhood: string
          _phone: string
          _type: Database["public"]["Enums"]["escrow_point_type"]
        }
        Returns: {
          business_name: string
          business_registry_url: string | null
          city: string
          commission_percentage: number
          created_at: string
          id: string
          id_document_url: string | null
          latitude: number | null
          longitude: number | null
          neighborhood: string
          owner_user_id: string
          phone: string
          status: Database["public"]["Enums"]["escrow_point_status"]
          type: Database["public"]["Enums"]["escrow_point_type"]
        }
        SetofOptions: {
          from: "*"
          to: "escrow_points"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_withdrawal: {
        Args: {
          _amount_xof: number
          _destination_phone: string
          _method: Database["public"]["Enums"]["withdrawal_method"]
        }
        Returns: {
          amount_xof: number
          created_at: string
          destination_phone: string | null
          id: string
          method: Database["public"]["Enums"]["withdrawal_method"]
          pickup_code: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawal_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      seller_confirm_handover: {
        Args: { _order_id: string }
        Returns: {
          buyer_id: string
          buyer_otp: string | null
          cancellation_deadline: string | null
          courier_id: string | null
          created_at: string
          delivery_confirmed_at: string | null
          delivery_fee_xof: number
          escrow_commission_xof: number | null
          escrow_point_id: string
          funds_locked_at: string | null
          id: string
          order_code: string
          picked_up_at: string | null
          platform_commission_xof: number | null
          product_description: string | null
          product_image_urls: string[]
          product_price_xof: number
          product_title: string
          refund_amount_xof: number | null
          seller_confirmed_at: string | null
          seller_id: string
          seller_otp: string | null
          seller_payout_xof: number | null
          source_link: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "courier" | "agent"
      dispute_status: "open" | "resolved"
      escrow_point_status: "pending" | "approved" | "suspended"
      escrow_point_type: "mobile_money" | "push_ci" | "both"
      order_status:
        | "pending_deposit"
        | "funds_locked"
        | "seller_confirmed"
        | "in_transit"
        | "delivered"
        | "cancelled_pending_refund"
        | "refunded"
        | "disputed"
      wallet_tx_type:
        | "credit"
        | "debit"
        | "withdrawal"
        | "refund"
        | "commission"
      withdrawal_method: "mobile_money" | "push_ci"
      withdrawal_status: "pending" | "completed" | "rejected"
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
      app_role: ["admin", "courier", "agent"],
      dispute_status: ["open", "resolved"],
      escrow_point_status: ["pending", "approved", "suspended"],
      escrow_point_type: ["mobile_money", "push_ci", "both"],
      order_status: [
        "pending_deposit",
        "funds_locked",
        "seller_confirmed",
        "in_transit",
        "delivered",
        "cancelled_pending_refund",
        "refunded",
        "disputed",
      ],
      wallet_tx_type: ["credit", "debit", "withdrawal", "refund", "commission"],
      withdrawal_method: ["mobile_money", "push_ci"],
      withdrawal_status: ["pending", "completed", "rejected"],
    },
  },
} as const

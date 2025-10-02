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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          item_count: number | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          item_count?: number | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          item_count?: number | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      dispute_evidence: {
        Row: {
          created_at: string
          description: string | null
          dispute_id: string
          evidence_type: string
          file_url: string
          id: string
          uploaded_by_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dispute_id: string
          evidence_type: string
          file_url: string
          id?: string
          uploaded_by_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dispute_id?: string
          evidence_type?: string
          file_url?: string
          id?: string
          uploaded_by_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          against_id: string
          approved_amount: number | null
          created_at: string
          description: string | null
          dispute_type: string
          id: string
          listing_id: string
          raised_by_id: string
          reason: string
          requested_amount: number | null
          resolution_type: string | null
          resolved_at: string | null
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          against_id: string
          approved_amount?: number | null
          created_at?: string
          description?: string | null
          dispute_type: string
          id?: string
          listing_id: string
          raised_by_id: string
          reason: string
          requested_amount?: number | null
          resolution_type?: string | null
          resolved_at?: string | null
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          against_id?: string
          approved_amount?: number | null
          created_at?: string
          description?: string | null
          dispute_type?: string
          id?: string
          listing_id?: string
          raised_by_id?: string
          reason?: string
          requested_amount?: number | null
          resolution_type?: string | null
          resolved_at?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      favourites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          available: boolean | null
          carbon_saved: number | null
          category_id: string | null
          collection_location: string | null
          collection_notes: string | null
          condition: string | null
          created_at: string
          delivery_available: boolean | null
          delivery_cost: number | null
          delivery_notes: string | null
          delivery_radius: number | null
          description: string | null
          dimensions: Json | null
          featured: boolean | null
          full_address: string | null
          id: string
          images: string[] | null
          latitude: number | null
          location: string
          location_bounds: Json | null
          longitude: number | null
          pickup_available: boolean | null
          price: number
          public_location: string | null
          quantity: number | null
          reason_for_selling: string | null
          search_vector: unknown | null
          seller_id: string
          status: string | null
          title: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          available?: boolean | null
          carbon_saved?: number | null
          category_id?: string | null
          collection_location?: string | null
          collection_notes?: string | null
          condition?: string | null
          created_at?: string
          delivery_available?: boolean | null
          delivery_cost?: number | null
          delivery_notes?: string | null
          delivery_radius?: number | null
          description?: string | null
          dimensions?: Json | null
          featured?: boolean | null
          full_address?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          location: string
          location_bounds?: Json | null
          longitude?: number | null
          pickup_available?: boolean | null
          price: number
          public_location?: string | null
          quantity?: number | null
          reason_for_selling?: string | null
          search_vector?: unknown | null
          seller_id: string
          status?: string | null
          title: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          available?: boolean | null
          carbon_saved?: number | null
          category_id?: string | null
          collection_location?: string | null
          collection_notes?: string | null
          condition?: string | null
          created_at?: string
          delivery_available?: boolean | null
          delivery_cost?: number | null
          delivery_notes?: string | null
          delivery_radius?: number | null
          description?: string | null
          dimensions?: Json | null
          featured?: boolean | null
          full_address?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          location?: string
          location_bounds?: Json | null
          longitude?: number | null
          pickup_available?: boolean | null
          price?: number
          public_location?: string | null
          quantity?: number | null
          reason_for_selling?: string | null
          search_vector?: unknown | null
          seller_id?: string
          status?: string | null
          title?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          listing_id: string
          message_type: Database["public"]["Enums"]["message_type"]
          offer_id: string | null
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          listing_id: string
          message_type?: Database["public"]["Enums"]["message_type"]
          offer_id?: string | null
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          listing_id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          offer_id?: string | null
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          expires_at: string | null
          id: string
          listing_id: string
          message: string | null
          parent_offer_id: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          listing_id: string
          message?: string | null
          parent_offer_id?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          listing_id?: string
          message?: string | null
          parent_offer_id?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_parent_offer_id_fkey"
            columns: ["parent_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          id: string
          identity_verified: boolean | null
          identity_verified_at: string | null
          location: string | null
          phone: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          updated_at: string
          user_id: string
          username: string | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          location?: string | null
          phone?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          location?: string | null
          phone?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
          reviewer_id: string
          reviewer_type: string | null
          seller_id: string
          title: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          reviewer_id: string
          reviewer_type?: string | null
          seller_id: string
          title?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          reviewer_id?: string
          reviewer_type?: string | null
          seller_id?: string
          title?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          notification_enabled: boolean
          search_criteria: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          notification_enabled?: boolean
          search_criteria: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          notification_enabled?: boolean
          search_criteria?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          transaction_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          transaction_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_audit_log_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          buyer_id: string
          buyer_protection_fee: number | null
          completed_at: string | null
          created_at: string
          delivery_confirmed_at: string | null
          dispatch_confirmed_at: string | null
          dispute_id: string | null
          dispute_reason: string | null
          disputed_at: string | null
          id: string
          listing_id: string
          offer_id: string | null
          paid_at: string | null
          refunded_at: string | null
          return_confirmed_at: string | null
          return_notes: string | null
          return_requested_at: string | null
          seller_id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          buyer_protection_fee?: number | null
          completed_at?: string | null
          created_at?: string
          delivery_confirmed_at?: string | null
          dispatch_confirmed_at?: string | null
          dispute_id?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          id?: string
          listing_id: string
          offer_id?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          return_confirmed_at?: string | null
          return_notes?: string | null
          return_requested_at?: string | null
          seller_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          buyer_protection_fee?: number | null
          completed_at?: string | null
          created_at?: string
          delivery_confirmed_at?: string | null
          dispatch_confirmed_at?: string | null
          dispute_id?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          id?: string
          listing_id?: string
          offer_id?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          return_confirmed_at?: string | null
          return_notes?: string | null
          return_requested_at?: string | null
          seller_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      generate_username_suggestions: {
        Args: { base_username: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      message_type: "message" | "offer" | "system"
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
      message_type: ["message", "offer", "system"],
    },
  },
} as const

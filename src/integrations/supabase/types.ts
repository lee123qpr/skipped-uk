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
      account_deletion_requests: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          requested_at: string | null
          scheduled_deletion_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string | null
          scheduled_deletion_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string | null
          scheduled_deletion_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          target_user_id: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_user_id: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "public_safe_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "public_safe_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          name: string
          post_count: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name: string
          post_count?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          post_count?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback_type: Database["public"]["Enums"]["blog_feedback_type"]
          id: string
          post_id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_type: Database["public"]["Enums"]["blog_feedback_type"]
          id?: string
          post_id: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_type?: Database["public"]["Enums"]["blog_feedback_type"]
          id?: string
          post_id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_feedback_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_views: {
        Row: {
          id: string
          ip_address: string | null
          post_id: string
          session_id: string
          user_agent: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          post_id: string
          session_id: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          post_id?: string
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_keywords: string | null
          published_at: string | null
          reading_time_minutes: number | null
          search_vector: unknown
          slug: string
          status: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          search_vector?: unknown
          slug: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          search_vector?: unknown
          slug?: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
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
            foreignKeyName: "disputes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
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
      environmental_certificates: {
        Row: {
          buyer_certificate_url: string | null
          buyer_id: string
          calculation_method: string
          carbon_factor_source: string
          carbon_saved_kg: number
          certificate_reference: string
          created_at: string
          id: string
          issued_at: string
          landfill_diverted_kg: number
          listing_id: string
          material_type: string
          material_weight_kg: number
          methodology_snapshot: Json
          seller_certificate_url: string | null
          seller_id: string
          transaction_id: string
        }
        Insert: {
          buyer_certificate_url?: string | null
          buyer_id: string
          calculation_method: string
          carbon_factor_source: string
          carbon_saved_kg: number
          certificate_reference: string
          created_at?: string
          id?: string
          issued_at?: string
          landfill_diverted_kg: number
          listing_id: string
          material_type: string
          material_weight_kg: number
          methodology_snapshot?: Json
          seller_certificate_url?: string | null
          seller_id: string
          transaction_id: string
        }
        Update: {
          buyer_certificate_url?: string | null
          buyer_id?: string
          calculation_method?: string
          carbon_factor_source?: string
          carbon_saved_kg?: number
          certificate_reference?: string
          created_at?: string
          id?: string
          issued_at?: string
          landfill_diverted_kg?: number
          listing_id?: string
          material_type?: string
          material_weight_kg?: number
          methodology_snapshot?: Json
          seller_certificate_url?: string | null
          seller_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "environmental_certificates_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_certificates_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_certificates_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_certificates_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_certificates_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_certificates_transaction"
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
          {
            foreignKeyName: "favourites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          available: boolean | null
          calculation_confidence: string | null
          carbon_saved: number | null
          category_id: string | null
          certificate_methodology: Json | null
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
          environmental_assessment_enabled: boolean | null
          featured: boolean | null
          full_address: string | null
          id: string
          images: string[] | null
          last_viewed_at: string | null
          latitude: number | null
          location: string
          location_bounds: Json | null
          longitude: number | null
          manufacturer: string | null
          pickup_available: boolean | null
          price: number
          public_location: string | null
          quantity: number | null
          reason_for_selling: string | null
          search_vector: unknown
          seller_id: string
          status: string | null
          title: string
          updated_at: string
          view_count: number | null
          weight: number | null
        }
        Insert: {
          available?: boolean | null
          calculation_confidence?: string | null
          carbon_saved?: number | null
          category_id?: string | null
          certificate_methodology?: Json | null
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
          environmental_assessment_enabled?: boolean | null
          featured?: boolean | null
          full_address?: string | null
          id?: string
          images?: string[] | null
          last_viewed_at?: string | null
          latitude?: number | null
          location: string
          location_bounds?: Json | null
          longitude?: number | null
          manufacturer?: string | null
          pickup_available?: boolean | null
          price: number
          public_location?: string | null
          quantity?: number | null
          reason_for_selling?: string | null
          search_vector?: unknown
          seller_id: string
          status?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
          weight?: number | null
        }
        Update: {
          available?: boolean | null
          calculation_confidence?: string | null
          carbon_saved?: number | null
          category_id?: string | null
          certificate_methodology?: Json | null
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
          environmental_assessment_enabled?: boolean | null
          featured?: boolean | null
          full_address?: string | null
          id?: string
          images?: string[] | null
          last_viewed_at?: string | null
          latitude?: number | null
          location?: string
          location_bounds?: Json | null
          longitude?: number | null
          manufacturer?: string | null
          pickup_available?: boolean | null
          price?: number
          public_location?: string | null
          quantity?: number | null
          reason_for_selling?: string | null
          search_vector?: unknown
          seller_id?: string
          status?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
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
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_safe_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          listing_id: string | null
          message_type: Database["public"]["Enums"]["message_type"]
          offer_id: string | null
          read: boolean
          receiver_id: string
          sender_id: string
          transaction_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          listing_id?: string | null
          message_type?: Database["public"]["Enums"]["message_type"]
          offer_id?: string | null
          read?: boolean
          receiver_id: string
          sender_id: string
          transaction_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          message_type?: Database["public"]["Enums"]["message_type"]
          offer_id?: string | null
          read?: boolean
          receiver_id?: string
          sender_id?: string
          transaction_id?: string | null
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
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
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
      platform_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          bio: string | null
          business_logo_url: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          email_new_message: boolean | null
          email_new_offer: boolean | null
          email_notifications_enabled: boolean | null
          email_review_reminder: boolean | null
          email_transaction_update: boolean | null
          holiday_end_date: string | null
          holiday_message: string | null
          holiday_start_date: string | null
          id: string
          identity_verified: boolean | null
          identity_verified_at: string | null
          last_active_at: string | null
          location: string | null
          on_holiday: boolean | null
          phone: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
          username: string | null
          verified: boolean | null
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email_new_message?: boolean | null
          email_new_offer?: boolean | null
          email_notifications_enabled?: boolean | null
          email_review_reminder?: boolean | null
          email_transaction_update?: boolean | null
          holiday_end_date?: string | null
          holiday_message?: string | null
          holiday_start_date?: string | null
          id?: string
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          last_active_at?: string | null
          location?: string | null
          on_holiday?: boolean | null
          phone?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email_new_message?: boolean | null
          email_new_offer?: boolean | null
          email_notifications_enabled?: boolean | null
          email_review_reminder?: boolean | null
          email_transaction_update?: boolean | null
          holiday_end_date?: string | null
          holiday_message?: string | null
          holiday_start_date?: string | null
          id?: string
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          last_active_at?: string | null
          location?: string | null
          on_holiday?: boolean | null
          phone?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "public_safe_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
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
          seller_reply: string | null
          seller_reply_created_at: string | null
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
          seller_reply?: string | null
          seller_reply_created_at?: string | null
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
          seller_reply?: string | null
          seller_reply_created_at?: string | null
          title?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviews_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviews_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviews_transaction"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_safe_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_safe_profiles"
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
      site_banners: {
        Row: {
          banner_type: string
          click_count: number
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          link_text: string | null
          link_url: string | null
          message: string
          start_date: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          banner_type?: string
          click_count?: number
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          message: string
          start_date?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          banner_type?: string
          click_count?: number
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          message?: string
          start_date?: string | null
          updated_at?: string
          view_count?: number
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
          delivery_cost: number | null
          delivery_method: string | null
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
          delivery_cost?: number | null
          delivery_method?: string | null
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
          delivery_cost?: number | null
          delivery_method?: string | null
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
            foreignKeyName: "fk_transactions_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
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
      public_listings: {
        Row: {
          available: boolean | null
          calculation_confidence: string | null
          carbon_saved: number | null
          category_id: string | null
          certificate_methodology: Json | null
          condition: string | null
          created_at: string | null
          delivery_available: boolean | null
          delivery_cost: number | null
          delivery_radius: number | null
          description: string | null
          dimensions: Json | null
          environmental_assessment_enabled: boolean | null
          featured: boolean | null
          id: string | null
          images: string[] | null
          last_viewed_at: string | null
          location: string | null
          manufacturer: string | null
          pickup_available: boolean | null
          price: number | null
          public_location: string | null
          quantity: number | null
          reason_for_selling: string | null
          search_vector: unknown
          seller_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
          weight: number | null
        }
        Insert: {
          available?: boolean | null
          calculation_confidence?: string | null
          carbon_saved?: number | null
          category_id?: string | null
          certificate_methodology?: Json | null
          condition?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          delivery_cost?: number | null
          delivery_radius?: number | null
          description?: string | null
          dimensions?: Json | null
          environmental_assessment_enabled?: boolean | null
          featured?: boolean | null
          id?: string | null
          images?: string[] | null
          last_viewed_at?: string | null
          location?: string | null
          manufacturer?: string | null
          pickup_available?: boolean | null
          price?: number | null
          public_location?: string | null
          quantity?: number | null
          reason_for_selling?: string | null
          search_vector?: unknown
          seller_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
          weight?: number | null
        }
        Update: {
          available?: boolean | null
          calculation_confidence?: string | null
          carbon_saved?: number | null
          category_id?: string | null
          certificate_methodology?: Json | null
          condition?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          delivery_cost?: number | null
          delivery_radius?: number | null
          description?: string | null
          dimensions?: Json | null
          environmental_assessment_enabled?: boolean | null
          featured?: boolean | null
          id?: string | null
          images?: string[] | null
          last_viewed_at?: string | null
          location?: string | null
          manufacturer?: string | null
          pickup_available?: boolean | null
          price?: number | null
          public_location?: string | null
          quantity?: number | null
          reason_for_selling?: string | null
          search_vector?: unknown
          seller_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
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
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_safe_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      public_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          listing_id: string | null
          rating: number | null
          reviewer_avatar: string | null
          reviewer_id: string | null
          reviewer_name: string | null
          reviewer_type: string | null
          reviewer_username: string | null
          reviewer_verified: boolean | null
          seller_avatar: string | null
          seller_id: string | null
          seller_name: string | null
          seller_reply: string | null
          seller_reply_created_at: string | null
          seller_username: string | null
          seller_verified: boolean | null
          title: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviews_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviews_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviews_transaction"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_safe_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_safe_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      public_safe_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_logo_url: string | null
          company_name: string | null
          created_at: string | null
          display_name: string | null
          holiday_end_date: string | null
          holiday_message: string | null
          holiday_start_date: string | null
          id: string | null
          identity_verified: boolean | null
          location: string | null
          on_holiday: boolean | null
          stripe_onboarding_complete: boolean | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_logo_url?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          holiday_end_date?: string | null
          holiday_message?: string | null
          holiday_start_date?: string | null
          id?: string | null
          identity_verified?: boolean | null
          location?: string | null
          on_holiday?: boolean | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_logo_url?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          holiday_end_date?: string | null
          holiday_message?: string | null
          holiday_start_date?: string | null
          id?: string | null
          identity_verified?: boolean | null
          location?: string | null
          on_holiday?: boolean | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_reading_time: { Args: { content: string }; Returns: number }
      generate_blog_slug: { Args: { title: string }; Returns: string }
      generate_username_suggestions: {
        Args: { base_username: string }
        Returns: string[]
      }
      get_favourite_counts_for_seller: {
        Args: { _seller_id: string }
        Returns: {
          favourite_count: number
          listing_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_listing_view_count: {
        Args: { listing_id: string }
        Returns: undefined
      }
      is_user_on_holiday: { Args: { user_id: string }; Returns: boolean }
      send_review_reminders: { Args: never; Returns: undefined }
      validate_refund_amount: {
        Args: { refund_amount: number; transaction_amount: number }
        Returns: boolean
      }
      validate_transaction_amount: {
        Args: { amount: number }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      blog_feedback_type: "helpful" | "not_helpful"
      blog_post_status: "draft" | "published" | "archived"
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
      blog_feedback_type: ["helpful", "not_helpful"],
      blog_post_status: ["draft", "published", "archived"],
      message_type: ["message", "offer", "system"],
    },
  },
} as const

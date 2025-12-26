export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          family_id: string | null
          interests: string[]
          created_at: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          family_id?: string | null
          interests?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          family_id?: string | null
          interests?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          }
        ]
      }
      activities: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          activity_type: string | null
          starts_at: string | null
          ends_at: string | null
          location_name: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          activity_type?: string | null
          starts_at?: string | null
          ends_at?: string | null
          location_name?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          activity_type?: string | null
          starts_at?: string | null
          ends_at?: string | null
          location_name?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      interest_cards: {
        Row: {
          id: string
          user_id: string
          category: string
          is_custom: boolean
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          is_custom?: boolean
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          is_custom?: boolean
          description?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      picks: {
        Row: {
          id: string
          user_id: string
          category: string
          value: string
          interest_tag: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          value: string
          interest_tag?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          value?: string
          interest_tag?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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

export type Family = Database['public']['Tables']['families']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type InterestCard = Database['public']['Tables']['interest_cards']['Row']
export type Pick = Database['public']['Tables']['picks']['Row']

export type ActivityWithUser = Activity & {
  users: Pick<User, 'name' | 'avatar_url'>
}

export type InterestCardWithUser = InterestCard & {
  users: Pick<User, 'name' | 'avatar_url'>
}

export type PickWithUser = Pick & {
  users: Pick<User, 'name' | 'avatar_url'>
}

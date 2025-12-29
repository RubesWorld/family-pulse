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
          location: string | null
          occupation: string | null
          birthday: string | null
          bio: string | null
          phone_number: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          family_id?: string | null
          interests?: string[]
          location?: string | null
          occupation?: string | null
          birthday?: string | null
          bio?: string | null
          phone_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          family_id?: string | null
          interests?: string[]
          location?: string | null
          occupation?: string | null
          birthday?: string | null
          bio?: string | null
          phone_number?: string | null
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
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          is_custom?: boolean
          description: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          is_custom?: boolean
          description?: string
          tags?: string[]
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
          is_current: boolean
          archived_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          value: string
          interest_tag?: string | null
          is_current?: boolean
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          value?: string
          interest_tag?: string | null
          is_current?: boolean
          archived_at?: string | null
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
      weekly_questions: {
        Row: {
          id: string
          family_id: string
          question_text: string
          week_start_date: string
          week_number: number
          assigned_user_id: string
          is_preset: boolean
          is_current: boolean
          archived_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          question_text: string
          week_start_date: string
          week_number: number
          assigned_user_id: string
          is_preset?: boolean
          is_current?: boolean
          archived_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          question_text?: string
          week_start_date?: string
          week_number?: number
          assigned_user_id?: string
          is_preset?: boolean
          is_current?: boolean
          archived_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_questions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_questions_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      question_answers: {
        Row: {
          id: string
          question_id: string
          user_id: string
          answer_text: string
          is_current: boolean
          archived_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_id: string
          user_id: string
          answer_text: string
          is_current?: boolean
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          user_id?: string
          answer_text?: string
          is_current?: boolean
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "weekly_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      preset_questions: {
        Row: {
          id: string
          question_text: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          question_text: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          question_text?: string
          category?: string | null
          created_at?: string
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

export type Family = Database['public']['Tables']['families']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type InterestCard = Database['public']['Tables']['interest_cards']['Row']
export type UserPick = Database['public']['Tables']['picks']['Row']
export type WeeklyQuestion = Database['public']['Tables']['weekly_questions']['Row']
export type QuestionAnswer = Database['public']['Tables']['question_answers']['Row']
export type PresetQuestion = Database['public']['Tables']['preset_questions']['Row']

export type ActivityWithUser = Activity & {
  users: Pick<User, 'name' | 'avatar_url' | 'phone_number'>
}

export type InterestCardWithUser = InterestCard & {
  users: Pick<User, 'name' | 'avatar_url'>
}

export type PickWithUser = UserPick & {
  users: Pick<User, 'name' | 'avatar_url'>
}

export type QuestionWithAnswers = WeeklyQuestion & {
  question_answers: (QuestionAnswer & { users: Pick<User, 'id' | 'name' | 'avatar_url'> })[]
  users: Pick<User, 'id' | 'name' | 'avatar_url'>
}

export type AnswerWithUser = QuestionAnswer & {
  users: Pick<User, 'id' | 'name' | 'avatar_url'>
}

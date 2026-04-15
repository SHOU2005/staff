import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Database = {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string;
          name: string;
          phone: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["staff"]["Row"],
          "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
      };
      candidates: {
        Row: {
          id: string;
          name: string;
          phone: string;
          role: string;
          location: string;
          status: string;
          joining_date: string | null;
          follow_up_date: string | null;
          notes: string | null;
          job_id: string | null;
          doc_received: boolean;
          added_by: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["candidates"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["candidates"]["Insert"]>;
      };
      pgs: {
        Row: {
          id: string;
          name: string;
          owner_name: string;
          owner_phone: string;
          address_link: string;
          added_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["pgs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["pgs"]["Insert"]>;
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          company: string | null;
          location: string | null;
          salary: string | null;
          pg_id: string | null;
          status: string;
          added_by: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["jobs"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
      };
      daily_work: {
        Row: {
          id: string;
          staff_id: string;
          date: string;
          calls_done: number;
          posts_done: number;
          leads_added: number;
        };
        Insert: Omit<Database["public"]["Tables"]["daily_work"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["daily_work"]["Insert"]>;
      };
    };
  };
};

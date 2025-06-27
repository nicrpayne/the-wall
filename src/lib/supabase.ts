import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Wall {
  id: string;
  title: string;
  description: string;
  created_at: string;
  shareable_link: string;
  wall_code: string;
  is_private: boolean;
}

export interface Submission {
  id: string;
  wall_id: string;
  image_url: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  wall_title?: string;
}

// API functions
export const wallsApi = {
  async getAll(): Promise<Wall[]> {
    const { data, error } = await supabase
      .from("walls")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(wall: Omit<Wall, "id" | "created_at">): Promise<Wall> {
    const { data, error } = await supabase
      .from("walls")
      .insert(wall)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("walls").delete().eq("id", id);

    if (error) throw error;
  },
};

export const submissionsApi = {
  async getAll(): Promise<Submission[]> {
    const { data, error } = await supabase
      .from("submissions")
      .select(
        `
        *,
        walls!inner(title)
      `,
      )
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    return (
      data?.map((item) => ({
        ...item,
        wall_title: item.walls.title,
      })) || []
    );
  },

  async create(
    submission: Omit<Submission, "id" | "submitted_at">,
  ): Promise<Submission> {
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        ...submission,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(
    id: string,
    status: "approved" | "rejected",
  ): Promise<void> {
    const { error } = await supabase
      .from("submissions")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
  },

  async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `journal-entries/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);

    return data.publicUrl;
  },
};

// Real-time subscriptions
export const subscribeToSubmissions = (
  callback: (submissions: Submission[]) => void,
) => {
  return supabase
    .channel("submissions")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "submissions" },
      () => {
        // Refetch submissions when changes occur
        submissionsApi.getAll().then(callback);
      },
    )
    .subscribe();
};

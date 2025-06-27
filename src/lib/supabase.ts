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
  async createSampleWall(): Promise<Wall> {
    const sampleWall = {
      title: "Sample Community Wall",
      description:
        "This is a sample wall for testing. Share your journal entries here!",
      wall_code: "SAMPLE",
      shareable_link: `${window.location.origin}/wall/SAMPLE`,
      is_private: false,
    };

    console.log(
      "🔧 [wallsApi.createSampleWall] Creating sample wall:",
      sampleWall,
    );
    return await this.create(sampleWall);
  },
  async getAll(): Promise<Wall[]> {
    const { data, error } = await supabase
      .from("walls")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching walls:", error);
      throw error;
    }
    return data || [];
  },

  async getByIdOrCode(idOrCode: string): Promise<Wall | null> {
    console.log(
      "🔍 [wallsApi.getByIdOrCode] Searching for wall with ID/code:",
      idOrCode,
    );

    // First, let's see what walls exist in the database
    const { data: allWalls, error: allWallsError } = await supabase
      .from("walls")
      .select("*");

    console.log("🔍 [wallsApi.getByIdOrCode] All walls in database:", allWalls);
    console.log(
      "🔍 [wallsApi.getByIdOrCode] Database query error (if any):",
      allWallsError,
    );

    // Fix the OR query syntax - use proper string formatting
    const { data, error } = await supabase
      .from("walls")
      .select("*")
      .or(`id.eq."${idOrCode}",wall_code.eq."${idOrCode}"`)
      .single();

    console.log("🔍 [wallsApi.getByIdOrCode] Query result:", { data, error });

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        console.log(
          "🔍 [wallsApi.getByIdOrCode] No wall found with ID/code:",
          idOrCode,
        );
        return null;
      }
      console.error(
        "🔴 [wallsApi.getByIdOrCode] Error fetching wall by ID or code:",
        error,
      );
      throw error;
    }

    console.log("✅ [wallsApi.getByIdOrCode] Found wall:", data);
    return data;
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

  async update(
    id: string,
    updates: Partial<Omit<Wall, "id" | "created_at">>,
  ): Promise<Wall> {
    const { data, error } = await supabase
      .from("walls")
      .update(updates)
      .eq("id", id)
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
    try {
      // Validate file
      if (!file) {
        throw new Error("No file provided");
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        throw new Error(
          "File size too large. Please choose a file smaller than 10MB.",
        );
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
        );
      }

      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `journal-entries/${fileName}`;

      console.log("Uploading file:", {
        fileName,
        filePath,
        fileSize: file.size,
        fileType: file.type,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("Upload successful:", uploadData);

      const { data } = supabase.storage.from("images").getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error("Failed to get public URL for uploaded image");
      }

      console.log("Public URL generated:", data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error("Error in uploadImage:", error);
      throw error;
    }
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

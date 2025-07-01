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
  header_image_url?: string;
}

export interface Submission {
  id: string;
  wall_id: string;
  image_url: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  wall_title?: string;
}

export interface Entry {
  id: string;
  wall_id: string;
  image_url: string;
  created_at: string;
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
    try {
      // Use a single query with OR condition to search both ID and wall_code
      const { data, error } = await supabase
        .from("walls")
        .select("*")
        .or(`id.eq.${idOrCode},wall_code.ilike.${idOrCode.toUpperCase()}`);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Return the first match (should only be one)
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      // If the OR query fails, try individual queries as fallback
      try {
        // Try exact ID match first
        const { data: idData, error: idError } = await supabase
          .from("walls")
          .select("*")
          .eq("id", idOrCode)
          .maybeSingle();

        if (idData && !idError) {
          return idData;
        }

        // Try case-insensitive wall_code match
        const { data: codeData, error: codeError } = await supabase
          .from("walls")
          .select("*")
          .eq("wall_code", idOrCode.toUpperCase())
          .maybeSingle();

        if (codeError) {
          throw new Error(`Wall code search failed: ${codeError.message}`);
        }

        return codeData;
      } catch (fallbackError) {
        throw new Error(`All search methods failed: ${fallbackError.message}`);
      }
    }
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
    console.log("🔵 [submissionsApi.create] Creating submission:", submission);

    const submissionData = {
      ...submission,
      submitted_at: new Date().toISOString(),
    };

    console.log(
      "🔵 [submissionsApi.create] Submission data with timestamp:",
      submissionData,
    );

    const { data, error } = await supabase
      .from("submissions")
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error(
        "🔴 [submissionsApi.create] Error creating submission:",
        error,
      );
      throw error;
    }

    console.log(
      "🔵 [submissionsApi.create] Submission created successfully:",
      data,
    );
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

  // NOTE: We never delete submissions - they are kept for record keeping
  // Only entries (approved content) can be deleted from walls

  async uploadImage(file: File): Promise<string> {
    try {
      console.log("🔵 [submissionsApi.uploadImage] Starting upload for file:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

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
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        console.error("🔴 [submissionsApi.uploadImage] Invalid file type:", {
          fileType: file.type,
          allowedTypes,
        });
        throw new Error(
          "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.",
        );
      }

      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `journal-entries/${fileName}`;

      console.log(
        "🔵 [submissionsApi.uploadImage] File validation passed, uploading:",
        {
          fileName,
          filePath,
          fileSize: file.size,
          fileType: file.type,
        },
      );

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(
          "🔴 [submissionsApi.uploadImage] Upload error:",
          uploadError,
        );
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log(
        "🔵 [submissionsApi.uploadImage] Upload successful:",
        uploadData,
      );

      const { data } = supabase.storage.from("images").getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error("Failed to get public URL for uploaded image");
      }

      console.log(
        "🔵 [submissionsApi.uploadImage] Public URL generated:",
        data.publicUrl,
      );
      return data.publicUrl;
    } catch (error) {
      console.error(
        "🔴 [submissionsApi.uploadImage] Error in uploadImage:",
        error,
      );
      throw error;
    }
  },

  async uploadHeaderImage(file: File): Promise<string> {
    try {
      console.log(
        "🔵 [submissionsApi.uploadHeaderImage] Starting upload for header image:",
        {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      );

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
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        console.error(
          "🔴 [submissionsApi.uploadHeaderImage] Invalid file type:",
          {
            fileType: file.type,
            allowedTypes,
          },
        );
        throw new Error(
          "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.",
        );
      }

      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `header-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `wall-headers/${fileName}`;

      console.log(
        "🔵 [submissionsApi.uploadHeaderImage] File validation passed, uploading:",
        {
          fileName,
          filePath,
          fileSize: file.size,
          fileType: file.type,
        },
      );

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(
          "🔴 [submissionsApi.uploadHeaderImage] Upload error:",
          uploadError,
        );
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log(
        "🔵 [submissionsApi.uploadHeaderImage] Upload successful:",
        uploadData,
      );

      const { data } = supabase.storage.from("images").getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error("Failed to get public URL for uploaded header image");
      }

      console.log(
        "🔵 [submissionsApi.uploadHeaderImage] Public URL generated:",
        data.publicUrl,
      );
      return data.publicUrl;
    } catch (error) {
      console.error(
        "🔴 [submissionsApi.uploadHeaderImage] Error in uploadHeaderImage:",
        error,
      );
      throw error;
    }
  },
};

export const entriesApi = {
  async getByWallId(wallId: string): Promise<Entry[]> {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("wall_id", wallId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching entries:", error);
      throw error;
    }
    return data || [];
  },

  async create(entry: Omit<Entry, "id" | "created_at">): Promise<Entry> {
    const { data, error } = await supabase
      .from("entries")
      .insert({
        ...entry,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createMultiple(
    entries: Omit<Entry, "id" | "created_at">[],
  ): Promise<Entry[]> {
    const entriesWithTimestamp = entries.map((entry) => ({
      ...entry,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("entries")
      .insert(entriesWithTimestamp)
      .select();

    if (error) throw error;
    return data || [];
  },

  async delete(id: string): Promise<void> {
    console.log(
      "🔵 [entriesApi.delete] Deleting entry from entries table:",
      id,
    );

    const { error } = await supabase.from("entries").delete().eq("id", id);

    if (error) {
      console.error("🔴 [entriesApi.delete] Delete failed:", error);
      throw error;
    }

    console.log(
      "🟢 [entriesApi.delete] Entry deleted successfully from entries table:",
      id,
    );
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

export const subscribeToEntries = (
  wallId: string,
  callback: (entries: Entry[]) => void,
) => {
  return supabase
    .channel(`entries-${wallId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "entries" },
      () => {
        // Refetch entries when changes occur
        entriesApi.getByWallId(wallId).then(callback);
      },
    )
    .subscribe();
};

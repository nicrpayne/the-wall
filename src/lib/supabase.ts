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
        lastModified: file.lastModified,
      });

      // Vercel-specific optimizations
      // Check if we need to compress large images for better performance
      if (file.size > 5 * 1024 * 1024) {
        // 5MB threshold
        console.log(
          "🔵 [submissionsApi.uploadImage] Large file detected, consider compression:",
          {
            size: file.size,
            sizeInMB: (file.size / (1024 * 1024)).toFixed(2),
          },
        );
      }

      // Log Supabase client configuration (without exposing sensitive data)
      console.log("🔵 [submissionsApi.uploadImage] Supabase client config:", {
        supabaseUrl: supabaseUrl
          ? `${supabaseUrl.substring(0, 20)}...`
          : "NOT_SET",
        anonKeyPresent: !!supabaseAnonKey,
        anonKeyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
        clientInitialized: !!supabase,
      });

      // Test Supabase connection first
      console.log(
        "🔵 [submissionsApi.uploadImage] Testing Supabase connection...",
      );

      let buckets;
      let bucketsError;

      try {
        console.log(
          "🔵 [submissionsApi.uploadImage] Calling supabase.storage.listBuckets()...",
        );
        const bucketResponse = await supabase.storage.listBuckets();
        buckets = bucketResponse.data;
        bucketsError = bucketResponse.error;

        console.log("🔵 [submissionsApi.uploadImage] Raw bucket response:", {
          data: buckets,
          error: bucketsError,
          dataType: typeof buckets,
          isArray: Array.isArray(buckets),
          length: buckets ? buckets.length : "N/A",
        });

        if (bucketsError) {
          console.error(
            "🔴 [submissionsApi.uploadImage] Bucket list error details:",
            {
              message: bucketsError.message,
              statusCode: bucketsError.statusCode,
              error: bucketsError.error,
              details: bucketsError.details,
              hint: bucketsError.hint,
              code: bucketsError.code,
            },
          );
          throw new Error(`Storage connection failed: ${bucketsError.message}`);
        }

        if (!buckets) {
          console.error(
            "🔴 [submissionsApi.uploadImage] Buckets data is null/undefined",
          );
          throw new Error("Storage connection failed: No bucket data returned");
        }

        if (!Array.isArray(buckets)) {
          console.error(
            "🔴 [submissionsApi.uploadImage] Buckets data is not an array:",
            typeof buckets,
          );
          throw new Error(
            "Storage connection failed: Invalid bucket data format",
          );
        }

        console.log(
          "🔵 [submissionsApi.uploadImage] Available buckets:",
          buckets.map((b) => ({ name: b.name, id: b.id, public: b.public })),
        );

        const imagesBucket = buckets.find((b) => b.name === "images");
        if (!imagesBucket) {
          console.error(
            "🔴 [submissionsApi.uploadImage] Images bucket not found in list:",
            {
              availableBuckets: buckets.map((b) => b.name),
              totalBuckets: buckets.length,
              searchingFor: "images",
            },
          );
          throw new Error(
            `Images storage bucket not found. Available buckets: ${buckets.map((b) => b.name).join(", ")}. Please check your Supabase storage configuration.`,
          );
        }

        console.log("🔵 [submissionsApi.uploadImage] Found images bucket:", {
          name: imagesBucket.name,
          id: imagesBucket.id,
          public: imagesBucket.public,
          createdAt: imagesBucket.created_at,
          updatedAt: imagesBucket.updated_at,
        });
      } catch (connectionError) {
        console.error(
          "🔴 [submissionsApi.uploadImage] Connection test failed:",
          {
            error: connectionError,
            message: connectionError?.message,
            name: connectionError?.name,
            stack: connectionError?.stack,
            cause: connectionError?.cause,
          },
        );
        throw connectionError;
      }

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
        console.error("🔴 [submissionsApi.uploadImage] Upload error details:", {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          details: uploadError.details,
        });

        let errorMessage = "Upload failed";
        if (uploadError.statusCode === 413) {
          errorMessage = "File size too large. Please choose a smaller file";
        } else if (uploadError.statusCode === 415) {
          errorMessage =
            "File type not supported. Please choose a JPEG, PNG, WebP, or GIF image";
        } else if (uploadError.statusCode === 401) {
          errorMessage =
            "Authentication failed. Please refresh the page and try again";
        } else if (uploadError.statusCode === 403) {
          errorMessage =
            "Permission denied. Storage access not configured properly";
        } else if (uploadError.message?.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again";
        } else if (uploadError.message) {
          errorMessage = `Upload failed: ${uploadError.message}`;
        }

        throw new Error(errorMessage);
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

// Authentication functions
export const authApi = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Real-time subscriptions
export const subscribeToSubmissions = (
  callback: (submissions: Submission[]) => void,
) => {
  console.log(
    "🔔 [subscribeToSubmissions] Setting up real-time subscription for submissions",
  );
  return supabase
    .channel("submissions")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "submissions" },
      (payload) => {
        console.log(
          "🔔 [subscribeToSubmissions] Real-time event received:",
          payload.eventType,
          payload.new || payload.old,
        );
        // Refetch submissions when changes occur
        submissionsApi
          .getAll()
          .then((submissions) => {
            console.log(
              "🔔 [subscribeToSubmissions] Refetched submissions:",
              submissions.length,
            );
            callback(submissions);
          })
          .catch((error) => {
            console.error(
              "🔴 [subscribeToSubmissions] Error refetching submissions:",
              error,
            );
          });
      },
    )
    .subscribe((status) => {
      console.log("🔔 [subscribeToSubmissions] Subscription status:", status);
    });
};

export const subscribeToEntries = (
  wallId: string,
  callback: (entries: Entry[]) => void,
) => {
  console.log(
    `🔔 [subscribeToEntries] Setting up real-time subscription for entries on wall: ${wallId}`,
  );
  return supabase
    .channel(`entries-${wallId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "entries" },
      (payload) => {
        console.log(
          `🔔 [subscribeToEntries] Real-time event received for wall ${wallId}:`,
          payload.eventType,
          payload.new || payload.old,
        );
        // Refetch entries when changes occur
        entriesApi
          .getByWallId(wallId)
          .then((entries) => {
            console.log(
              `🔔 [subscribeToEntries] Refetched entries for wall ${wallId}:`,
              entries.length,
            );
            callback(entries);
          })
          .catch((error) => {
            console.error(
              `🔴 [subscribeToEntries] Error refetching entries for wall ${wallId}:`,
              error,
            );
          });
      },
    )
    .subscribe((status) => {
      console.log(
        `🔔 [subscribeToEntries] Subscription status for wall ${wallId}:`,
        status,
      );
    });
};

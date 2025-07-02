import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "../lib/supabase";

const StorageDiagnostic = () => {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const result: any = {
      timestamp: new Date().toISOString(),
      environment: {},
      storage: {},
      auth: {},
    };

    try {
      // Check environment variables
      result.environment = {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? "SET" : "NOT_SET",
        supabaseUrlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET" : "NOT_SET",
        anonKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      };

      // Check authentication
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        result.auth = {
          hasSession: !!session,
          sessionError: sessionError?.message || null,
          user: session?.user
            ? {
                id: session.user.id,
                email: session.user.email,
              }
            : null,
        };
      } catch (authError: any) {
        result.auth = {
          error: authError.message,
          hasSession: false,
        };
      }

      // Check storage buckets
      try {
        const { data: buckets, error: bucketsError } =
          await supabase.storage.listBuckets();
        result.storage = {
          success: !bucketsError,
          error: bucketsError?.message || null,
          bucketsCount: buckets?.length || 0,
          buckets:
            buckets?.map((b) => ({
              name: b.name,
              id: b.id,
              public: b.public,
              created_at: b.created_at,
            })) || [],
          hasImagesBucket: buckets?.some((b) => b.name === "images") || false,
        };

        // If images bucket exists, test access
        if (result.storage.hasImagesBucket) {
          try {
            const { data: files, error: listError } = await supabase.storage
              .from("images")
              .list("", { limit: 1 });

            result.storage.imagesBucketAccess = {
              canList: !listError,
              listError: listError?.message || null,
              fileCount: files?.length || 0,
            };
          } catch (listTestError: any) {
            result.storage.imagesBucketAccess = {
              canList: false,
              listError: listTestError.message,
            };
          }
        }
      } catch (storageError: any) {
        result.storage = {
          success: false,
          error: storageError.message,
          bucketsCount: 0,
          buckets: [],
        };
      }

      setDiagnosticResult(result);
    } catch (error: any) {
      setDiagnosticResult({
        error: "Diagnostic failed",
        details: error.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white">
      <CardHeader>
        <CardTitle>Supabase Storage Diagnostic</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostic} disabled={isRunning}>
          {isRunning ? "Running Diagnostic..." : "Run Storage Diagnostic"}
        </Button>

        {diagnosticResult && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Diagnostic Results:</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-96">
              {JSON.stringify(diagnosticResult, null, 2)}
            </pre>

            {/* Quick summary */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Environment:</span>
                <span
                  className={
                    diagnosticResult.environment?.supabaseUrl === "SET"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {diagnosticResult.environment?.supabaseUrl === "SET"
                    ? "✓ Configured"
                    : "✗ Missing"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Storage Access:</span>
                <span
                  className={
                    diagnosticResult.storage?.success
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {diagnosticResult.storage?.success ? "✓ Working" : "✗ Failed"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Images Bucket:</span>
                <span
                  className={
                    diagnosticResult.storage?.hasImagesBucket
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {diagnosticResult.storage?.hasImagesBucket
                    ? "✓ Found"
                    : "✗ Missing"}
                </span>
              </div>

              {diagnosticResult.storage?.bucketsCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Available Buckets:</span>
                  <span className="text-blue-600">
                    {diagnosticResult.storage.buckets
                      .map((b: any) => b.name)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StorageDiagnostic;

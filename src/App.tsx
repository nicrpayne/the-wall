import {
  Suspense,
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  lazy,
} from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";

// Lazy load heavy components
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const WallPage = lazy(() => import("./components/WallPage"));
const ComingSoon = lazy(() => import("./components/ComingSoon"));
import { Toaster } from "@/components/ui/toaster";
import { authApi } from "./lib/supabase";
import routes from "tempo-routes";

interface Submission {
  id: string;
  wallId: string;
  wallTitle: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

interface SubmissionContextType {
  submissions: Submission[];
  addSubmission: (submission: Omit<Submission, "id" | "submittedAt">) => void;
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(
  undefined,
);

export const useSubmissions = () => {
  const context = useContext(SubmissionContext);
  if (!context) {
    throw new Error("useSubmissions must be used within a SubmissionProvider");
  }
  return context;
};

const SubmissionProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with default submissions and localStorage data
  const getInitialSubmissions = (): Submission[] => {
    const defaultSubmissions: Submission[] = [
      {
        id: "101",
        wallId: "1",
        wallTitle: "Gratitude Journal",
        imageUrl:
          "https://images.unsplash.com/photo-1527236438218-d82077ae1f85?w=400&q=80",
        status: "pending",
        submittedAt: "2023-06-18",
      },
      {
        id: "102",
        wallId: "1",
        wallTitle: "Gratitude Journal",
        imageUrl:
          "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400&q=80",
        status: "pending",
        submittedAt: "2023-06-19",
      },
      {
        id: "103",
        wallId: "3",
        wallTitle: "Creative Writing",
        imageUrl:
          "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80",
        status: "pending",
        submittedAt: "2023-08-12",
      },
    ];

    try {
      const stored = localStorage.getItem("journal-submissions");
      if (stored) {
        const parsedSubmissions = JSON.parse(stored);
        // Merge with default submissions, avoiding duplicates
        const existingIds = new Set(
          parsedSubmissions.map((s: Submission) => s.id),
        );
        const uniqueDefaults = defaultSubmissions.filter(
          (s) => !existingIds.has(s.id),
        );
        return [...parsedSubmissions, ...uniqueDefaults];
      }
    } catch (error) {
      console.error("Error loading submissions from localStorage:", error);
    }

    return defaultSubmissions;
  };

  const [submissions, setSubmissions] = useState<Submission[]>(
    getInitialSubmissions,
  );

  // Save to localStorage whenever submissions change
  useEffect(() => {
    console.log(
      "🟡 [SubmissionProvider] useEffect triggered - submissions changed:",
      submissions.length,
      "submissions",
    );
    console.log("🟡 [SubmissionProvider] Full submissions array:", submissions);

    try {
      const serialized = JSON.stringify(submissions);
      localStorage.setItem("journal-submissions", serialized);
      console.log("🟡 [SubmissionProvider] Saved to localStorage successfully");

      // Dispatch custom event to notify other windows
      window.dispatchEvent(
        new CustomEvent("submissions-updated", {
          detail: { submissions },
        }),
      );
      console.log(
        "🟡 [SubmissionProvider] Dispatched submissions-updated event",
      );
    } catch (error) {
      console.error(
        "🔴 [SubmissionProvider] Error saving submissions to localStorage:",
        error,
      );
    }
  }, [submissions]);

  // Listen for storage changes from other windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log(
        "🟣 [SubmissionProvider] Storage event received:",
        e.key,
        e.newValue?.length || 0,
        "chars",
      );
      if (e.key === "journal-submissions" && e.newValue) {
        try {
          const newSubmissions = JSON.parse(e.newValue);
          console.log(
            "🟣 [SubmissionProvider] Parsed submissions from storage:",
            newSubmissions.length,
          );
          setSubmissions(newSubmissions);
        } catch (error) {
          console.error(
            "🔴 [SubmissionProvider] Error parsing submissions from storage event:",
            error,
          );
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      console.log(
        "🟣 [SubmissionProvider] Custom event received:",
        e.detail?.submissions?.length || 0,
        "submissions",
      );
      if (e.detail?.submissions) {
        setSubmissions(e.detail.submissions);
      }
    };

    console.log("🟣 [SubmissionProvider] Setting up event listeners");
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "submissions-updated",
      handleCustomEvent as EventListener,
    );

    return () => {
      console.log("🟣 [SubmissionProvider] Cleaning up event listeners");
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "submissions-updated",
        handleCustomEvent as EventListener,
      );
    };
  }, []);

  const addSubmission = (
    newSubmission: Omit<Submission, "id" | "submittedAt">,
  ) => {
    console.log(
      "🔵 [SubmissionProvider] addSubmission called with:",
      newSubmission,
    );
    const submission: Submission = {
      ...newSubmission,
      id: `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date().toISOString().split("T")[0],
    };
    console.log(
      "🔵 [SubmissionProvider] Created submission object:",
      submission,
    );

    setSubmissions((prev) => {
      console.log(
        "🔵 [SubmissionProvider] Previous submissions count:",
        prev.length,
      );
      const newSubmissions = [submission, ...prev];
      console.log(
        "🔵 [SubmissionProvider] New submissions count:",
        newSubmissions.length,
      );
      console.log(
        "🔵 [SubmissionProvider] New submissions array:",
        newSubmissions,
      );
      return newSubmissions;
    });
  };

  return (
    <SubmissionContext.Provider value={{ submissions, addSubmission }}>
      {children}
    </SubmissionContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authApi.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = authApi.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <SubmissionProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/wall/:wallId" element={<WallPage />} />
            <Route
              path="/about"
              element={<ComingSoon pageTitle="About Us" />}
            />
            <Route
              path="/terms"
              element={<ComingSoon pageTitle="Terms of Service" />}
            />
            <Route
              path="/privacy"
              element={<ComingSoon pageTitle="Privacy Policy" />}
            />
            <Route
              path="/contact"
              element={<ComingSoon pageTitle="Contact Us" />}
            />
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
          <Toaster />
        </>
      </Suspense>
    </SubmissionProvider>
  );
}

export default App;

import {
  Suspense,
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import AdminDashboard from "./components/AdminDashboard";
import WallPage from "./components/WallPage";
import { Toaster } from "@/components/ui/toaster";
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
    try {
      localStorage.setItem("journal-submissions", JSON.stringify(submissions));
      // Dispatch custom event to notify other windows
      window.dispatchEvent(
        new CustomEvent("submissions-updated", {
          detail: { submissions },
        }),
      );
    } catch (error) {
      console.error("Error saving submissions to localStorage:", error);
    }
  }, [submissions]);

  // Listen for storage changes from other windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "journal-submissions" && e.newValue) {
        try {
          const newSubmissions = JSON.parse(e.newValue);
          setSubmissions(newSubmissions);
        } catch (error) {
          console.error("Error parsing submissions from storage event:", error);
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail?.submissions) {
        setSubmissions(e.detail.submissions);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "submissions-updated",
      handleCustomEvent as EventListener,
    );

    return () => {
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
    const submission: Submission = {
      ...newSubmission,
      id: `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date().toISOString().split("T")[0],
    };
    setSubmissions((prev) => [submission, ...prev]);
  };

  return (
    <SubmissionContext.Provider value={{ submissions, addSubmission }}>
      {children}
    </SubmissionContext.Provider>
  );
};

function App() {
  return (
    <SubmissionProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/wall/:wallId" element={<WallPage />} />
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
          <Toaster />
        </>
      </Suspense>
    </SubmissionProvider>
  );
}

export default App;

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { wallsApi, authApi } from "../lib/supabase";

const Home = () => {
  // Default state for login form
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [showSignUp, setShowSignUp] = React.useState(false);

  // State for wall access
  const [wallInput, setWallInput] = React.useState("");

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    try {
      await authApi.signIn(email, password);
      // Redirect to admin dashboard on successful login
      window.location.href = "/admin";
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please try again.";

      if (error.message) {
        if (error.message.includes("Invalid login credentials")) {
          errorMessage =
            "Invalid email or password. Please check your credentials.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage =
            "Please check your email and click the confirmation link before logging in.";
        } else if (error.message.includes("Too many requests")) {
          errorMessage =
            "Too many login attempts. Please wait a moment and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    try {
      await authApi.signUp(email, password);
      alert(
        "Account created! Please check your email for a confirmation link before logging in.",
      );
      setShowSignUp(false);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Sign up error:", error);
      let errorMessage = "Account creation failed. Please try again.";

      if (error.message) {
        if (error.message.includes("User already registered")) {
          errorMessage =
            "An account with this email already exists. Please try logging in instead.";
        } else if (error.message.includes("Password should be at least")) {
          errorMessage = "Password should be at least 6 characters long.";
        } else {
          errorMessage = error.message;
        }
      }

      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wall access
  const handleWallAccess = async () => {
    if (!wallInput.trim()) return;

    const cleanInput = wallInput.trim();

    try {
      // Check if it's a URL or a code
      if (cleanInput.includes("http") || cleanInput.includes("/wall/")) {
        // It's a URL - extract the wall ID/code
        const urlParts = cleanInput.split("/wall/");
        if (urlParts.length > 1) {
          const wallIdOrCode = urlParts[1].split("?")[0]; // Remove any query parameters
          window.location.href = `/wall/${wallIdOrCode}`;
        }
      } else {
        // It's a code - look up the wall to verify it exists
        const searchCode = cleanInput.toUpperCase();

        // Show loading state
        const originalButtonText =
          document.querySelector("button")?.textContent;
        const button = document.querySelector("button");
        if (button) button.textContent = "Searching...";

        const wall = await wallsApi.getByIdOrCode(searchCode);

        // Reset button text
        if (button && originalButtonText)
          button.textContent = originalButtonText;

        if (wall) {
          // Use the wall's ID for the URL to ensure consistency
          window.location.href = `/wall/${wall.id}`;
        } else {
          // More specific error message
          alert(
            `Wall not found for code "${searchCode}". Please check the code and try again.\n\nMake sure you're entering the exact 6-character code provided by the wall creator.`,
          );
        }
      }
    } catch (error) {
      // Reset button text if there was an error
      const button = document.querySelector("button");
      if (button) button.textContent = "Go to Wall";

      // More detailed error message for users
      let errorMessage = "Error accessing wall. ";

      if (error instanceof Error) {
        if (error.message.includes("Database query failed")) {
          errorMessage +=
            "There was a problem connecting to the database. Please check your internet connection and try again.";
        } else if (error.message.includes("Wall code search failed")) {
          errorMessage +=
            "There was a problem searching for the wall code. Please try again.";
        } else if (error.message.includes("All search methods failed")) {
          errorMessage +=
            "Multiple search attempts failed. Please check your internet connection or try again later.";
        } else {
          errorMessage += `Technical details: ${error.message}`;
        }
      } else {
        errorMessage += "An unexpected error occurred. Please try again.";
      }

      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold">Journal Wall</h1>
          <nav>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/about" className="text-sm">
                About
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-2 items-start">
          {/* Left column - App description */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                Anonymous Journal Sharing
              </h2>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Share your handwritten journal entries anonymously through
                community walls.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm sm:text-base">
                    Anonymous Sharing
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    No accounts required. Share your thoughts freely.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M9 8h7" />
                    <path d="M8 12h6" />
                    <path d="M11 16h4" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm sm:text-base">
                    Community Walls
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Curated collections of journal entries.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm sm:text-base">
                    Mobile-Optimized
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Easily capture and upload journal pages from any device.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 sm:p-6 rounded-lg">
              <h3 className="font-medium mb-2 text-sm sm:text-base">
                Have a wall link?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Enter the unique wall code or paste the full URL below to access
                a community wall.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Enter wall code or URL"
                  className="flex-1 text-sm"
                  value={wallInput}
                  onChange={(e) => setWallInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleWallAccess()}
                />
                <Button
                  onClick={handleWallAccess}
                  disabled={!wallInput.trim()}
                  className="w-full sm:w-auto text-sm"
                >
                  Go to Wall
                </Button>
              </div>
            </div>
          </div>

          {/* Right column - Admin login */}
          <div className="w-full">
            <Card className="border shadow-md">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Admin Access
                </CardTitle>
                <CardDescription className="text-sm">
                  Log in to create and manage community walls, and review
                  submissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="info">Info</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    {loginError && (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-md text-sm mb-4">
                        {loginError}
                      </div>
                    )}

                    {!showSignUp ? (
                      <form onSubmit={handleLogin} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? "Logging in..." : "Login"}
                        </Button>
                        <div className="text-center">
                          <Button
                            type="button"
                            variant="link"
                            className="text-sm"
                            onClick={() => setShowSignUp(true)}
                          >
                            Need to create an admin account? Sign up
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading
                            ? "Creating Account..."
                            : "Create Admin Account"}
                        </Button>
                        <div className="text-center">
                          <Button
                            type="button"
                            variant="link"
                            className="text-sm"
                            onClick={() => {
                              setShowSignUp(false);
                              setLoginError(null);
                            }}
                          >
                            Already have an account? Login
                          </Button>
                        </div>
                      </form>
                    )}
                  </TabsContent>
                  <TabsContent value="info" className="space-y-4 pt-4">
                    <div>
                      <h4 className="font-medium">Admin Dashboard Features</h4>
                      <ul className="list-disc pl-5 mt-2 text-sm space-y-1 text-muted-foreground">
                        <li>Create and manage multiple community walls</li>
                        <li>Review and approve user submissions</li>
                        <li>Generate unique shareable links</li>
                        <li>View wall analytics and insights</li>
                      </ul>
                    </div>
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      {showSignUp
                        ? "Create your admin account to manage community walls and review submissions."
                        : "Use your admin credentials to access the dashboard."}
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between text-sm text-muted-foreground">
                <span>Secure admin access</span>
                <Link to="/forgot-password" className="hover:underline">
                  Forgot password?
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2023 Journal Wall. All rights reserved.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <Link
                to="/terms"
                className="text-xs sm:text-sm text-muted-foreground hover:underline"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-xs sm:text-sm text-muted-foreground hover:underline"
              >
                Privacy
              </Link>
              <Link
                to="/contact"
                className="text-xs sm:text-sm text-muted-foreground hover:underline"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

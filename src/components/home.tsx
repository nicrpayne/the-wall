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

const Home = () => {
  // Default state for login form
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Handle login form submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, this would navigate to the admin dashboard upon successful login
      window.location.href = "/admin";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Journal Wall</h1>
          <nav>
            <Button variant="ghost" asChild>
              <Link to="/about">About</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2 items-center">
          {/* Left column - App description */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Anonymous Journal Sharing
              </h2>
              <p className="text-muted-foreground mt-2">
                Share your handwritten journal entries anonymously through
                community walls.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
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
                <div>
                  <h3 className="font-medium">Anonymous Sharing</h3>
                  <p className="text-sm text-muted-foreground">
                    No accounts required. Share your thoughts freely.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
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
                <div>
                  <h3 className="font-medium">Community Walls</h3>
                  <p className="text-sm text-muted-foreground">
                    Curated collections of journal entries.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
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
                <div>
                  <h3 className="font-medium">Mobile-Optimized</h3>
                  <p className="text-sm text-muted-foreground">
                    Easily capture and upload journal pages from any device.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-6 rounded-lg">
              <h3 className="font-medium mb-2">Have a wall link?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter the unique wall code or paste the full URL below to access
                a community wall.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter wall code or URL"
                  className="flex-1"
                />
                <Button>Go to Wall</Button>
              </div>
            </div>
          </div>

          {/* Right column - Admin login */}
          <div>
            <Card className="border shadow-md">
              <CardHeader>
                <CardTitle>Admin Access</CardTitle>
                <CardDescription>
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
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "Logging in..." : "Login"}
                      </Button>
                    </form>
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
                      Need admin access? Contact your organization administrator
                      for credentials.
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2023 Journal Wall. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                to="/terms"
                className="text-sm text-muted-foreground hover:underline"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-sm text-muted-foreground hover:underline"
              >
                Privacy
              </Link>
              <Link
                to="/contact"
                className="text-sm text-muted-foreground hover:underline"
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

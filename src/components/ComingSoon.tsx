import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ArrowLeft, Clock, Mail } from "lucide-react";

interface ComingSoonProps {
  pageTitle?: string;
  customMessage?: string;
  showContactInfo?: boolean;
}

const ComingSoon = ({
  pageTitle = "Coming Soon",
  customMessage,
  showContactInfo = true,
}: ComingSoonProps) => {
  const getDefaultMessage = () => {
    const pageName = pageTitle.toLowerCase();
    if (pageName.includes("about")) {
      return "Learn more about our mission to create safe spaces for anonymous journal sharing.";
    } else if (pageName.includes("terms")) {
      return "Our terms of service are being finalized to ensure the best experience for our community.";
    } else if (pageName.includes("privacy")) {
      return "We're crafting a comprehensive privacy policy that prioritizes your anonymity and data protection.";
    } else if (pageName.includes("contact")) {
      return "We're setting up multiple ways for you to reach out to our team.";
    }
    return "We're working hard to bring you something amazing.";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="text-xl sm:text-2xl font-bold hover:opacity-80 transition-opacity"
          >
            Journal Wall
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="text-sm flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="border shadow-lg">
            <CardHeader className="pb-6">
              <div className="mx-auto mb-6 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">
                {pageTitle}
              </CardTitle>
              <CardDescription className="text-base sm:text-lg mt-2">
                {customMessage || getDefaultMessage()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-sm text-muted-foreground">
                <p>
                  We're putting the finishing touches on this page to ensure it
                  meets our high standards for user experience and privacy.
                </p>
              </div>

              {showContactInfo && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                    <Mail className="h-4 w-4" />
                    <span>Questions or feedback?</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We'd love to hear from you as we continue building this
                    platform.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link to="/">Return to Home</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/" className="flex items-center gap-2">
                    Explore Community Walls
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-xs text-muted-foreground">
            <p>
              This page will be available soon. Thank you for your patience as
              we build something special.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2025 Rebel Leaders. All rights reserved.
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

export default ComingSoon;

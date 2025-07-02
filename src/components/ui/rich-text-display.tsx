import React from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

const RichTextDisplay = ({ content, className }: RichTextDisplayProps) => {
  // Sanitize the HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-muted-foreground",
        "prose-headings:text-foreground prose-headings:font-bold",
        "prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-6 prose-h1:text-foreground",
        "prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3 prose-h2:mt-5 prose-h2:text-foreground",
        "prose-h3:text-lg prose-h3:font-bold prose-h3:mb-2 prose-h3:mt-4 prose-h3:text-foreground",
        "prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-3",
        "prose-strong:text-foreground prose-strong:font-bold",
        "prose-em:text-muted-foreground prose-em:italic",
        "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-4",
        "prose-ul:list-disc prose-ul:pl-6 prose-ul:text-muted-foreground",
        "prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-muted-foreground",
        "prose-li:text-muted-foreground prose-li:mb-1",
        // Custom classes for elements with class attributes from the editor
        "[&_.heading]:font-bold [&_.heading]:text-foreground",
        "[&_h1.heading]:text-2xl [&_h1.heading]:mb-4 [&_h1.heading]:mt-6",
        "[&_h2.heading]:text-xl [&_h2.heading]:mb-3 [&_h2.heading]:mt-5",
        "[&_h3.heading]:text-lg [&_h3.heading]:mb-2 [&_h3.heading]:mt-4",
        "[&_.blockquote]:border-l-4 [&_.blockquote]:border-primary [&_.blockquote]:pl-4 [&_.blockquote]:italic [&_.blockquote]:text-muted-foreground [&_.blockquote]:my-4",
        "[&_.list-disc]:list-disc [&_.list-inside]:list-inside [&_.list-disc.list-inside]:pl-0",
        "[&_.list-decimal]:list-decimal [&_.list-decimal.list-inside]:pl-0",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default RichTextDisplay;

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Button } from "./button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor = ({
  content,
  onChange,
  placeholder = "Start typing...",
  className,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: "paragraph",
          },
        },
        hardBreak: {
          HTMLAttributes: {
            class: "hard-break",
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: "heading",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "blockquote",
          },
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: "list-disc list-inside",
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: "list-decimal list-inside",
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      // Convert the HTML to preserve line breaks more consistently
      const html = editor.getHTML();
      // Replace empty paragraphs with line breaks for better consistency
      const processedHtml = html
        .replace(/<p><\/p>/g, "<br>")
        .replace(/<p>\s*<\/p>/g, "<br>")
        .replace(/<p class="paragraph"><\/p>/g, "<br>")
        .replace(/<p class="paragraph">\s*<\/p>/g, "<br>");
      onChange(processedHtml);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none p-3 overflow-y-auto",
          "prose-headings:font-bold prose-headings:text-foreground",
          "prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-6 prose-h1:leading-tight",
          "prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3 prose-h2:mt-5 prose-h2:leading-tight",
          "prose-h3:text-lg prose-h3:font-bold prose-h3:mb-2 prose-h3:mt-4 prose-h3:leading-tight",
          "prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-3 prose-p:last:mb-0",
          "prose-strong:font-bold prose-strong:text-foreground",
          "prose-em:italic prose-em:text-foreground",
          "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-4",
          "prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6",
          "prose-li:text-foreground prose-li:mb-1",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-foreground",
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-foreground",
          "[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-foreground",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4",
          "[&_br]:block [&_br]:my-2",
          className,
        ),
      },
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-md flex flex-col", className)}>
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-1 flex-shrink-0">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 1 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 3 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleBulletList().run();
          }}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleOrderedList().run();
          }}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;

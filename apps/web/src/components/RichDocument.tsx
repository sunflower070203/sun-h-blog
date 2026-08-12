import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { createEditorExtensions } from "../admin/editor/editor-extensions";

export function RichDocument({ content }: { content: Record<string, unknown> }) {
  const editor = useEditor({
    extensions: createEditorExtensions({ openLinksOnClick: true }),
    content,
    editable: false,
    immediatelyRender: false
  });

  return <article className="prose"><EditorContent editor={editor} /></article>;
}

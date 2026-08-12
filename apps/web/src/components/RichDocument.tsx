import React, { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { createEditorExtensions } from "../admin/editor/editor-extensions";

export function RichDocument({ content }: { content: Record<string, unknown> }) {
  const editor = useEditor({
    extensions: createEditorExtensions({ openLinksOnClick: true }),
    content,
    editable: false,
    immediatelyRender: false
  });

  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  return <article className="prose"><EditorContent editor={editor} /></article>;
}

import React from "react";
import { getSchema, type JSONContent } from "@tiptap/core";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { createEditorExtensions } from "../../../web/src/admin/editor/editor-extensions";

const extensions = createEditorExtensions({ openLinksOnClick: true });
const schema = getSchema(extensions);

function supportedNodes(value: unknown): JSONContent[] {
  if (!value || typeof value !== "object") return [];
  const node = value as JSONContent;
  const content = Array.isArray(node.content) ? node.content.flatMap(supportedNodes) : undefined;
  if (typeof node.type !== "string" || !Object.hasOwn(schema.nodes, node.type)) return content ?? [];
  if (node.type === "text" && !node.text) return [];
  if (node.type === "gallery" && !Array.isArray(node.attrs?.images)) return [];
  const marks = Array.isArray(node.marks)
    ? node.marks.filter((mark) => mark && Object.hasOwn(schema.marks, mark.type))
    : undefined;
  return [{ ...node, content, marks }];
}

function textContent(value: JSONContent): string {
  if (typeof value.text === "string") return value.text;
  return value.content?.map(textContent).join(value.type === "doc" ? "\n" : "") ?? "";
}

export function StaticRichDocument({ content }: { content: Record<string, unknown> }) {
  const [doc] = supportedNodes(content);
  let body;
  if (doc?.type === "doc") {
    try {
      body = renderToReactElement({ extensions, content: doc });
    } catch {
      body = <p>{textContent(doc)}</p>;
      console.warn("Rendered unsupported rich text as plain text.");
    }
  }
  return <article className="prose"><div className="tiptap ProseMirror">{body}</div></article>;
}

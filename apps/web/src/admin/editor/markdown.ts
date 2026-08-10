type Mark = { type: "bold" | "italic" | "link"; attrs?: { href: string } };
type Node = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
  marks?: Mark[];
  text?: string;
};

export type MarkdownDocument = { type: "doc"; content: Node[] };
export type MarkdownExport = { markdown: string; warnings: string[] };

function textNode(text: string, marks?: Mark[]): Node {
  return marks?.length ? { type: "text", text, marks } : { type: "text", text };
}

function parseInline(value: string): Node[] {
  const nodes: Node[] = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let offset = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > offset) nodes.push(textNode(value.slice(offset, index)));
    if (match[2]) nodes.push(textNode(match[2], [{ type: "bold" }]));
    else if (match[3]) nodes.push(textNode(match[3], [{ type: "italic" }]));
    else nodes.push(textNode(match[4] ?? "", [{ type: "link", attrs: { href: match[5] ?? "" } }]));
    offset = index + match[0].length;
  }
  if (offset < value.length) nodes.push(textNode(value.slice(offset)));
  return nodes;
}

function paragraph(value: string): Node {
  return { type: "paragraph", content: parseInline(value) };
}

export function markdownToDocument(markdown: string): MarkdownDocument {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const content: Node[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index] ?? "";
    if (!line.trim()) { index += 1; continue; }

    const fence = line.match(/^```([^\s`]*)\s*$/);
    if (fence) {
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index] ?? "")) body.push(lines[index++] ?? "");
      if (index >= lines.length) throw new Error("代码块缺少结束标记 ```");
      index += 1;
      content.push({ type: "codeBlock", attrs: { language: fence[1] || null }, content: [textNode(body.join("\n"))] });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      content.push({ type: "heading", attrs: { level: heading[1]!.length }, content: parseInline(heading[2]!) });
      index += 1;
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      content.push({ type: "image", attrs: { src: image[2], alt: image[1], title: null } });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index] ?? "")) quote.push((lines[index++] ?? "").replace(/^>\s?/, ""));
      content.push({ type: "blockquote", content: [paragraph(quote.join(" "))] });
      continue;
    }

    const listMatch = line.match(/^(?:([-+*])|(\d+)\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = Boolean(listMatch[2]);
      const items: Node[] = [];
      const listPattern = ordered ? /^\d+\.\s+(.+)$/ : /^[-+*]\s+(.+)$/;
      while (index < lines.length) {
        const item = (lines[index] ?? "").match(listPattern);
        if (!item) break;
        items.push({ type: "listItem", content: [paragraph(item[1] ?? "")] });
        index += 1;
      }
      content.push({ type: ordered ? "orderedList" : "bulletList", attrs: ordered ? { start: Number(listMatch[2]) } : undefined, content: items });
      continue;
    }

    const body = [line.trim()];
    index += 1;
    while (index < lines.length && (lines[index] ?? "").trim() && !/^(#{1,6})\s|^```|^>\s?|^[-+*]\s+|^\d+\.\s+|^!\[[^\]]*\]\([^)]+\)$/.test(lines[index] ?? "")) {
      body.push((lines[index++] ?? "").trim());
    }
    content.push(paragraph(body.join(" ")));
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

function renderInline(nodes: Node[] = []): string {
  return nodes.map((node) => {
    let value = node.text ?? "";
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") value = `**${value}**`;
      if (mark.type === "italic") value = `*${value}*`;
      if (mark.type === "link") value = `[${value}](${mark.attrs?.href ?? ""})`;
    }
    return value;
  }).join("");
}

function renderNode(node: Node, warnings: string[]): string {
  if (node.type === "paragraph") return renderInline(node.content);
  if (node.type === "heading") return `${"#".repeat(Number(node.attrs?.level ?? 2))} ${renderInline(node.content)}`;
  if (node.type === "blockquote") return (node.content ?? []).map((child) => `> ${renderNode(child, warnings)}`).join("\n");
  if (node.type === "codeBlock") return `\`\`\`${String(node.attrs?.language ?? "")}\n${renderInline(node.content)}\n\`\`\``;
  if (node.type === "image") return `![${String(node.attrs?.alt ?? "")}](${String(node.attrs?.src ?? "")})`;
  if (node.type === "bulletList" || node.type === "orderedList") {
    return (node.content ?? []).map((item, index) => {
      const prefix = node.type === "orderedList" ? `${Number(node.attrs?.start ?? 1) + index}.` : "-";
      return `${prefix} ${renderNode(item.content?.[0] ?? { type: "paragraph" }, warnings)}`;
    }).join("\n");
  }
  if (node.type === "gallery") {
    if (!warnings.includes("图集需要在富文本模式编辑")) warnings.push("图集需要在富文本模式编辑");
    return "";
  }
  warnings.push(`Markdown 暂不支持 ${node.type} 结构`);
  return "";
}

export function documentToMarkdown(document: Record<string, unknown>): MarkdownExport {
  const warnings: string[] = [];
  const nodes = Array.isArray(document.content) ? document.content as Node[] : [];
  return {
    markdown: nodes.map((node) => renderNode(node, warnings)).filter(Boolean).join("\n\n"),
    warnings
  };
}

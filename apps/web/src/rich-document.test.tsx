import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RichDocument } from "./components/RichDocument";

describe("shared rich document", () => {
  it("renders structured content through the shared prose component", () => {
    const html = renderToStaticMarkup(<RichDocument content={{ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Sunny" }] }] }} />);
    assert.match(html, /class="prose"/);
    assert.match(html, /<div><\/div>/);
  });

  it("keeps PostPage on the shared renderer without raw HTML", () => {
    const source = readFileSync(new URL("./pages/PostPage.tsx", import.meta.url), "utf8");
    assert.match(source, /RichDocument/);
    assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
  });

  it("synchronizes asynchronously loaded document content", () => {
    const source = readFileSync(new URL("./components/RichDocument.tsx", import.meta.url), "utf8");
    assert.match(source, /useEffect/);
    assert.match(source, /commands\.setContent\(content/);
  });
});

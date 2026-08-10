import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { documentToMarkdown, markdownToDocument } from "./markdown.ts";

describe("markdown conversion", () => {
  it("parses the supported research-note blocks", () => {
    const document = markdownToDocument(`# 标题

> 关键结论

- 数据清洗
- 模型训练

\`\`\`python
print("sunny")
\`\`\`

![实验图](/media/2026-08-10/test.png)`);
    assert.deepEqual(document.content?.map((node) => node.type), [
      "heading", "blockquote", "bulletList", "codeBlock", "image"
    ]);
  });

  it("round-trips inline emphasis and links", () => {
    const source = "这是 **重要结果**，参考 [论文](https://example.com)，以及 *补充说明*。";
    const exported = documentToMarkdown(markdownToDocument(source));
    assert.equal(exported.markdown, source);
    assert.deepEqual(exported.warnings, []);
  });

  it("warns instead of silently dropping galleries", () => {
    const exported = documentToMarkdown({ type: "doc", content: [{ type: "gallery", attrs: { images: [] } }] });
    assert.deepEqual(exported.warnings, ["图集需要在富文本模式编辑"]);
  });
});

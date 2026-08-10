import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { api } from "../../api";
import { uploadFiles, type UploadResult } from "./uploads";

type Item = UploadResult & { alt: string };

export function MultiImagePanel({ editor, onMessage }: { editor: Editor | null; onMessage(message: string): void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  async function add(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    const results = await uploadFiles(files, api.upload);
    setItems((current) => [...current, ...results.map((result) => ({ ...result, alt: result.file.name.replace(/\.[^.]+$/, "") }))]);
    setBusy(false);
    const failed = results.filter((item) => item.status === "error").length;
    onMessage(failed ? `${results.length - failed} 张上传成功，${failed} 张失败` : `${results.length} 张图片上传完成`);
  }

  async function retry(index: number) {
    const item = items[index];
    if (!item) return;
    const [result] = await uploadFiles([item.file], api.upload);
    if (result) setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...result, alt: entry.alt } : entry));
  }

  function move(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  const successful = items.filter((item) => item.status === "success" && item.url);
  function insertImages() {
    if (!editor || !successful.length) return;
    editor.chain().focus().insertContent(successful.map((item) => ({ type: "image", attrs: { src: item.url, alt: item.alt } }))).run();
    setItems([]);
  }
  function insertGallery() {
    if (!editor || !successful.length) return;
    editor.chain().focus().insertContent({
      type: "gallery",
      attrs: { images: successful.map((item) => ({ src: item.url!, alt: item.alt })) }
    }).run();
    setItems([]);
  }

  return <section className="multi-image-panel" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
    event.preventDefault();
    void add(Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/")));
  }}>
    <div className="multi-image-head">
      <strong>正文图片</strong>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? "上传中…" : "选择多张图片"}</button>
      <input ref={inputRef} hidden type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void add(Array.from(event.target.files ?? []))} />
    </div>
    <p>可拖放多张图片到这里；成功与失败会分别保留。</p>
    {items.map((item, index) => <div className={`upload-row ${item.status}`} key={`${item.file.name}-${index}`}>
      <span>{item.file.name}</span>
      <input aria-label={`${item.file.name} 替代文本`} value={item.alt} onChange={(event) => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, alt: event.target.value } : entry))} />
      <button type="button" onClick={() => move(index, -1)} disabled={index === 0}>↑</button>
      <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1}>↓</button>
      {item.status === "error" ? <button type="button" onClick={() => void retry(index)}>重试</button> : <span>已上传</span>}
    </div>)}
    {successful.length > 0 && <div className="multi-image-actions">
      <button type="button" onClick={insertImages}>逐张插入</button>
      <button type="button" onClick={insertGallery}>生成图集</button>
    </div>}
  </section>;
}

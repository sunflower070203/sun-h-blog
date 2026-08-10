import { mergeAttributes, Node } from "@tiptap/core";

export type GalleryImage = { src: string; alt: string };

export const Gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  addAttributes() {
    return { images: { default: [] as GalleryImage[] } };
  },
  parseHTML() {
    return [{
      tag: "figure[data-gallery]",
      getAttrs: (element) => {
        if (!(element instanceof HTMLElement)) return false;
        try { return { images: JSON.parse(element.dataset.images ?? "[]") }; }
        catch { return { images: [] }; }
      }
    }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const images = (node.attrs.images ?? []) as GalleryImage[];
    return ["figure", mergeAttributes(HTMLAttributes, {
      class: "image-gallery",
      "data-gallery": "",
      "data-images": JSON.stringify(images)
    }), ...images.map((image) => ["img", { src: image.src, alt: image.alt }])];
  }
});

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { Gallery } from "./Gallery";

export function createEditorExtensions({ openLinksOnClick }: { openLinksOnClick: boolean }) {
  return [StarterKit, Image, Gallery, Link.configure({ openOnClick: openLinksOnClick })];
}

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { Gallery } from "./Gallery";

export function createEditorExtensions({ openLinksOnClick }: { openLinksOnClick: boolean }) {
  return [StarterKit, Image, Gallery, Link.configure({ openOnClick: openLinksOnClick })];
}

export function createIntroEditorExtensions({ openLinksOnClick }: { openLinksOnClick: boolean }) {
  return [StarterKit.configure({ blockquote: false, codeBlock: false, heading: false, horizontalRule: false, italic: false, orderedList: false, strike: false }), Link.configure({ openOnClick: openLinksOnClick })];
}

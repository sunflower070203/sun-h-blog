import type { ProfileLink, PublicProfile } from "@sunny/shared";

export type EditableProfileLink = ProfileLink & { uiId: string };
type IdFactory = () => string;
export const MAX_PROFILE_LINKS = 12;
let nextProfileLinkId = 0;

export function createProfileLinkId(cryptoApi: { randomUUID?: () => string } | undefined): string {
  return cryptoApi?.randomUUID?.() ?? `profile-link-${Date.now()}-${++nextProfileLinkId}`;
}

export function canAddProfileLink(links: ArrayLike<unknown>): boolean {
  return links.length < MAX_PROFILE_LINKS;
}

export function createEmptyProfileLink(createId: IdFactory = () => createProfileLinkId(globalThis.crypto)): EditableProfileLink {
  return { uiId: createId(), title: "", url: "https://", description: "" };
}

export function createProfileLinks(links: ProfileLink[], createId: IdFactory = () => createProfileLinkId(globalThis.crypto)): EditableProfileLink[] {
  return links.map((link) => ({ uiId: createId(), ...link }));
}

export function updateProfileLink<K extends keyof ProfileLink>(links: EditableProfileLink[], uiId: string, field: K, value: ProfileLink[K]): EditableProfileLink[] {
  return links.map((link) => link.uiId === uiId ? { ...link, [field]: value } : link);
}

export function removeProfileLink(links: EditableProfileLink[], uiId: string): EditableProfileLink[] {
  return links.filter((link) => link.uiId !== uiId);
}

export function serializeProfileLinks(links: EditableProfileLink[]): ProfileLink[] {
  return links.map(({ title, url, description }) => ({ title, url, description }));
}

export function canSaveProfile(profile: PublicProfile | null, loading: boolean, uploading: boolean, saving: boolean): boolean {
  return profile !== null && !loading && !uploading && !saving;
}

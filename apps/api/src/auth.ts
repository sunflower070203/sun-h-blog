import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

export function sessionCookieOptions(secure: boolean) {
  return {
    path: "/",
    sameSite: "strict" as const,
    secure,
    maxAge: 60 * 60 * 24 * 7
  };
}

export async function createSessionToken(adminId: string, secret: string) {
  return new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(secret));
}

export async function verifySessionToken(token: string, secret: string) {
  try {
    const result = await jwtVerify(token, encoder.encode(secret));
    const adminId = result.payload.adminId;
    return typeof adminId === "string" ? { adminId } : null;
  } catch {
    return null;
  }
}

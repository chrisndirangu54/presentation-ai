import { createHmac, timingSafeEqual } from "node:crypto";
import { decryptJson, encryptJson } from "@/lib/security/encryption";

export type OAuthProvider = "google" | "microsoft";

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface StatePayload {
  provider: OAuthProvider;
  userId: string;
  workspaceId?: string;
  exp: number;
}

function stateSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required for OAuth state signing");
  return secret;
}

export function signOAuthState(payload: StatePayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", stateSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyOAuthState(value: string): StatePayload {
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) throw new Error("Invalid OAuth state");
  const expected = createHmac("sha256", stateSecret()).update(encoded).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Invalid OAuth state signature");
  }
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as StatePayload;
  if (payload.exp < Date.now()) throw new Error("OAuth state expired");
  return payload;
}

export function providerConfig(provider: OAuthProvider) {
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) throw new Error("NEXTAUTH_URL is not configured");

  if (provider === "google") {
    return {
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: [
        "openid",
        "email",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/spreadsheets.readonly",
      ],
      callbackUrl: `${baseUrl}/api/connectors/oauth/google/callback`,
    };
  }

  return {
    clientId: process.env.MICROSOFT_GRAPH_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_GRAPH_CLIENT_SECRET,
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: ["openid", "profile", "offline_access", "User.Read", "Files.Read"],
    callbackUrl: `${baseUrl}/api/connectors/oauth/microsoft/callback`,
  };
}

export function encodeTokens(tokens: OAuthTokens) {
  return encryptJson(tokens);
}

export function decodeTokens(value: string) {
  return decryptJson<OAuthTokens>(value);
}

import { db } from "@/server/db";
import {
  decodeTokens,
  encodeTokens,
  providerConfig,
  type OAuthProvider,
  type OAuthTokens,
} from "./oauth";

export async function getConnectorAccessToken(connectionId: string) {
  const connection = await db.oAuthConnection.findUnique({ where: { id: connectionId } });
  if (!connection) throw new Error("OAuth connection not found");

  const provider = connection.provider as OAuthProvider;
  const tokens = decodeTokens(connection.encryptedTokens);
  if (!connection.expiresAt || connection.expiresAt.getTime() > Date.now() + 30_000) {
    return { accessToken: tokens.access_token, provider };
  }
  if (!tokens.refresh_token) throw new Error("Connector token expired and has no refresh token");

  const config = providerConfig(provider);
  if (!config.clientId || !config.clientSecret) throw new Error("Connector OAuth configuration is incomplete");

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: tokens.refresh_token,
    grant_type: "refresh_token",
  });
  if (provider === "microsoft") body.set("scope", config.scopes.join(" "));

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const refreshed = (await response.json()) as OAuthTokens;
  if (!response.ok || !refreshed.access_token) throw new Error("Connector token refresh failed");

  const merged: OAuthTokens = {
    ...tokens,
    ...refreshed,
    refresh_token: refreshed.refresh_token ?? tokens.refresh_token,
  };
  const expiresAt = refreshed.expires_in
    ? new Date(Date.now() + Math.max(0, refreshed.expires_in - 60) * 1000)
    : connection.expiresAt;

  await db.oAuthConnection.update({
    where: { id: connection.id },
    data: { encryptedTokens: encodeTokens(merged), expiresAt },
  });

  return { accessToken: merged.access_token, provider };
}

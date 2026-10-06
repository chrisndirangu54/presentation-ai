import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  encodeTokens,
  providerConfig,
  verifyOAuthState,
  type OAuthTokens,
} from "@/lib/connectors/oauth";

export async function GET(
  request: Request,
  { params }: { params: { provider: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/auth/signin", request.url));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateValue = url.searchParams.get("state");
  if (!code || !stateValue) {
    return NextResponse.json({ error: "Missing OAuth callback parameters" }, { status: 400 });
  }

  const state = verifyOAuthState(stateValue);
  if (state.userId !== session.user.id || state.provider !== params.provider) {
    return NextResponse.json({ error: "OAuth state mismatch" }, { status: 403 });
  }

  const config = providerConfig(state.provider);
  if (!config.clientId || !config.clientSecret) {
    return NextResponse.json({ error: "OAuth provider is not configured" }, { status: 503 });
  }

  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.callbackUrl,
    grant_type: "authorization_code",
  });

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokens = (await tokenResponse.json()) as OAuthTokens & { error?: string; error_description?: string };
  if (!tokenResponse.ok || !tokens.access_token) {
    return NextResponse.json(
      { error: tokens.error_description ?? tokens.error ?? "OAuth token exchange failed" },
      { status: 502 },
    );
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + Math.max(0, tokens.expires_in - 60) * 1000)
    : null;

  const existing = await db.oAuthConnection.findFirst({
    where: {
      userId: session.user.id,
      workspaceId: state.workspaceId ?? null,
      provider: state.provider,
    },
    select: { id: true },
  });

  const data = {
    scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
    encryptedTokens: encodeTokens(tokens),
    expiresAt,
  };

  if (existing) {
    await db.oAuthConnection.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await db.oAuthConnection.create({
      data: {
        userId: session.user.id,
        workspaceId: state.workspaceId,
        provider: state.provider,
        ...data,
      },
    });
  }

  const destination = new URL("/intelligence", request.url);
  destination.searchParams.set("connector", state.provider);
  destination.searchParams.set("connected", "1");
  return NextResponse.redirect(destination);
}

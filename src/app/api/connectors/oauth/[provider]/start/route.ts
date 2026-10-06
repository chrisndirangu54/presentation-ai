import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  providerConfig,
  signOAuthState,
  type OAuthProvider,
} from "@/lib/connectors/oauth";

export async function GET(
  request: Request,
  { params }: { params: { provider: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (params.provider !== "google" && params.provider !== "microsoft") {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }
  const provider = params.provider as OAuthProvider;
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? undefined;

  if (workspaceId) {
    const workspace = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
      },
      select: { id: true },
    });
    if (!workspace && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const config = providerConfig(provider);
  if (!config.clientId || !config.clientSecret) {
    return NextResponse.json({ error: `${provider} OAuth is not configured` }, { status: 503 });
  }

  const state = signOAuthState({
    provider,
    userId: session.user.id,
    workspaceId,
    exp: Date.now() + 10 * 60 * 1000,
  });

  const authorize = new URL(config.authorizeUrl);
  authorize.searchParams.set("client_id", config.clientId);
  authorize.searchParams.set("redirect_uri", config.callbackUrl);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", config.scopes.join(" "));
  authorize.searchParams.set("state", state);
  if (provider === "google") {
    authorize.searchParams.set("access_type", "offline");
    authorize.searchParams.set("prompt", "consent");
  }

  return NextResponse.redirect(authorize);
}

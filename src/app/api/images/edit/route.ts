import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import type { ImageEditOperation } from "@/lib/images/segmentation-editing";

interface ImageEditRequest {
  imageUrl: string;
  operation: ImageEditOperation;
  maskUrl?: string;
  prompt?: string;
  color?: string;
  parameters?: Record<string, unknown>;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as ImageEditRequest;
  if (!input.imageUrl || !input.operation) {
    return NextResponse.json(
      { error: "imageUrl and operation are required" },
      { status: 400 },
    );
  }

  const endpoint = process.env.IMAGE_EDIT_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({
      configured: false,
      request: input,
      nextAction: "Configure IMAGE_EDIT_ENDPOINT",
    });
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (process.env.IMAGE_EDIT_API_KEY) {
    headers.authorization = `Bearer ${process.env.IMAGE_EDIT_API_KEY}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    return NextResponse.json(
      { error: "Image edit provider failed", providerResponse: payload },
      { status: 502 },
    );
  }

  return NextResponse.json({ configured: true, result: payload });
}

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  segmentationProviders,
  type SegmentationRequest,
} from "@/lib/images/segmentation-editing";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as SegmentationRequest;
  if (!input.imageUrl?.trim()) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  const providerId = input.provider ?? "grounded-sam2";
  const provider = segmentationProviders.find((item) => item.id === providerId);
  if (!provider) {
    return NextResponse.json({ error: "Unsupported segmentation provider" }, { status: 400 });
  }

  if (
    provider.promptable &&
    !input.prompt?.trim() &&
    !input.points?.length &&
    !input.box
  ) {
    return NextResponse.json(
      { error: "Provide a text prompt, points or a box selection" },
      { status: 400 },
    );
  }

  if (providerId === "manual-mask") {
    return NextResponse.json({
      provider,
      configured: true,
      mode: "manual",
      request: input,
    });
  }

  const endpoint = process.env.IMAGE_SEGMENTATION_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({
      provider,
      configured: false,
      request: input,
      nextAction: "Configure IMAGE_SEGMENTATION_ENDPOINT or use manual-mask",
    });
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (process.env.IMAGE_SEGMENTATION_API_KEY) {
    headers.authorization = `Bearer ${process.env.IMAGE_SEGMENTATION_API_KEY}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    return NextResponse.json(
      { error: "Segmentation provider failed", providerResponse: payload },
      { status: 502 },
    );
  }

  return NextResponse.json({
    provider,
    configured: true,
    mode: "remote",
    result: payload,
  });
}

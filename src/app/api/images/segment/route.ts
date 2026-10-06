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

  if (provider.promptable && !input.prompt?.trim() && !input.points?.length && !input.box) {
    return NextResponse.json(
      { error: "Provide a text prompt, points or a box selection" },
      { status: 400 },
    );
  }

  const configured =
    providerId === "manual-mask" ||
    Boolean(process.env.IMAGE_SEGMENTATION_ENDPOINT);

  return NextResponse.json({
    provider,
    configured,
    request: input,
    nextAction: configured
      ? "execute-segmentation"
      : "configure IMAGE_SEGMENTATION_ENDPOINT or use manual-mask",
  });
}

"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn, withRef } from "@udecode/cn";
import { setNode, useEditorRef, withHOC } from "@udecode/plate-common/react";
import { Image, ImagePlugin, useMediaState } from "@udecode/plate-media/react";
import { ResizableProvider } from "@udecode/plate-resizable";
import { MediaPopover } from "@/components/text-editor/plate-ui/media-popover";
import { PlateElement } from "@/components/text-editor/plate-ui/plate-element";
import {
  Resizable,
  ResizeHandle,
  mediaResizeHandleVariants,
} from "@/components/text-editor/plate-ui/resizable";
import { type TImageElement } from "@udecode/plate-media";
import { Spinner } from "@/components/ui/spinner";
import { usePresentationState } from "@/states/presentation-state";
import { PresentationImageEditor } from "./presentation-image-editor";
import { useDebouncedSave } from "@/hooks/presentation/useDebouncedSave";
import { useDraggable } from "../dnd/hooks/useDraggable";
import { generateImageAction } from "@/app/_actions/image/generate";
import type { ImageEditOperation } from "@/lib/images/segmentation-editing";

export interface PresentationImageElementProps {
  className?: string;
  children?: React.ReactNode;
  nodeProps?: Record<string, unknown>;
  element: TImageElement & {
    query?: string;
    editHistory?: Array<Record<string, unknown>>;
  };
}

export const PresentationImageElement = withHOC(
  ResizableProvider,
  withRef<typeof PlateElement, PresentationImageElementProps>(
    ({ children, className, nodeProps, ...props }, ref) => {
      const { align = "center", focused, readOnly, selected } = useMediaState();
      const { isDragging, handleRef } = useDraggable({ element: props.element });
      const imageRef = useRef<HTMLDivElement | null>(null);
      const editor = useEditorRef();
      const { saveImmediately } = useDebouncedSave();
      const [isSheetOpen, setIsSheetOpen] = useState(false);
      const [isGenerating, setIsGenerating] = useState(false);
      const [error, setError] = useState<string | undefined>(undefined);
      const [imageUrl, setImageUrl] = useState<string | undefined>(props.element.url);
      const { imageModel } = usePresentationState();
      const hasHandledGenerationRef = useRef(false);

      const persistImage = (url: string, updates?: Record<string, unknown>) => {
        setImageUrl(url);
        setNode(editor, props.element, {
          url,
          ...updates,
        });
        setTimeout(() => {
          void saveImmediately();
        }, 300);
      };

      const generateImage = async (prompt: string) => {
        const container = document.querySelector(".presentation-slides");
        const isEditorReadOnly = !container?.contains(imageRef?.current);
        if (isEditorReadOnly) return;

        setIsGenerating(true);
        setError(undefined);
        try {
          hasHandledGenerationRef.current = true;
          const result = await generateImageAction(prompt, imageModel);
          if (result?.success && result.image?.url) {
            persistImage(result.image.url, { query: prompt });
          }
        } catch (generationError) {
          console.error("Error generating image:", generationError);
          setError("Failed to generate image. Please try again.");
        } finally {
          setIsGenerating(false);
        }
      };

      const applySegmentEdit = async (
        operation: ImageEditOperation,
        selectionPrompt: string,
        editPrompt?: string,
      ) => {
        if (!imageUrl) throw new Error("No source image is available.");

        const segmentResponse = await fetch("/api/images/segment", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            provider: "grounded-sam2",
            prompt:
              operation === "background-remove" || operation === "background-replace"
                ? "background"
                : selectionPrompt,
          }),
        });
        const segmentation = (await segmentResponse.json()) as {
          configured?: boolean;
          result?: Record<string, unknown>;
          nextAction?: string;
          error?: string;
        };

        if (!segmentResponse.ok) {
          throw new Error(segmentation.error ?? "Segmentation failed.");
        }
        if (!segmentation.configured) {
          throw new Error(
            segmentation.nextAction ??
              "Configure a segmentation provider before using automatic object selection.",
          );
        }

        const maskUrl =
          typeof segmentation.result?.maskUrl === "string"
            ? segmentation.result.maskUrl
            : typeof segmentation.result?.mask_url === "string"
              ? segmentation.result.mask_url
              : undefined;

        const editResponse = await fetch("/api/images/edit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            operation,
            maskUrl,
            prompt: editPrompt,
          }),
        });
        const edited = (await editResponse.json()) as {
          configured?: boolean;
          result?: Record<string, unknown>;
          nextAction?: string;
          error?: string;
        };

        if (!editResponse.ok) {
          throw new Error(edited.error ?? "Image edit failed.");
        }
        if (!edited.configured) {
          throw new Error(
            edited.nextAction ?? "Configure an image-edit provider.",
          );
        }

        const outputUrl =
          typeof edited.result?.url === "string"
            ? edited.result.url
            : typeof edited.result?.outputUrl === "string"
              ? edited.result.outputUrl
              : typeof edited.result?.output_url === "string"
                ? edited.result.output_url
                : undefined;

        if (!outputUrl) {
          throw new Error("The image-edit provider did not return an output URL.");
        }

        const editHistory = [
          ...(props.element.editHistory ?? []),
          {
            operation,
            selectionPrompt,
            editPrompt,
            previousUrl: imageUrl,
            outputUrl,
            createdAt: new Date().toISOString(),
          },
        ];

        persistImage(outputUrl, { editHistory });
      };

      useEffect(() => {
        if (
          hasHandledGenerationRef.current ||
          !props.element.query ||
          props.element.url ||
          imageUrl
        ) {
          return;
        }
        if (props.element.query) {
          void generateImage(props.element.query);
        }
      }, [props.element.query, props.element.url, imageUrl]);

      return (
        <>
          <MediaPopover plugin={ImagePlugin}>
            <PlateElement ref={ref} className={cn(className)} {...props}>
              <div ref={imageRef}>
                <Resizable align={align} options={{ align, readOnly }}>
                  <ResizeHandle className={mediaResizeHandleVariants({ direction: "left" })} options={{ direction: "left" }} />
                  {isGenerating ? (
                    <div className="relative w-full">
                      <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-muted">
                        <div className="flex flex-col items-center gap-2">
                          <Spinner className="h-6 w-6" />
                          <span className="text-sm text-muted-foreground">Generating image...</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="presentation-image-container"
                      onDoubleClick={() => {
                        if (!readOnly) setIsSheetOpen(true);
                      }}
                    >
                      <Image
                        ref={handleRef}
                        className={cn(
                          "presentation-image cursor-pointer",
                          focused && selected && "ring-2 ring-ring ring-offset-2",
                          isDragging && "opacity-50",
                        )}
                        alt={props.element.query ?? ""}
                        src={imageUrl}
                        onError={(event) => {
                          console.error("Presentation image failed to load:", event, imageUrl);
                        }}
                        {...nodeProps}
                      />
                    </div>
                  )}
                  <ResizeHandle className={mediaResizeHandleVariants({ direction: "right" })} options={{ direction: "right" }} />
                  {children}
                </Resizable>
              </div>
            </PlateElement>
          </MediaPopover>

          <PresentationImageEditor
            open={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            imageUrl={imageUrl}
            prompt={props.element.query}
            isGenerating={isGenerating}
            error={error}
            onRegenerateWithSamePrompt={() => {
              if (props.element.query) void generateImage(props.element.query);
            }}
            onGenerateWithNewPrompt={(newPrompt) => {
              void generateImage(newPrompt);
            }}
            onSegmentEdit={applySegmentEdit}
          />
        </>
      );
    },
  ),
);

PresentationImageElement.displayName = "PresentationImageElement";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  RefreshCw,
  Download,
  Trash2,
  Wand2,
  ImageIcon,
  AlertCircle,
  Scissors,
  Paintbrush,
  Eraser,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { usePresentationState } from "@/states/presentation-state";
import { IMAGE_MODELS } from "../../theme/ThemeSettings";
import { type ImageModelList } from "@/app/_actions/image/generate";
import type { ImageEditOperation } from "@/lib/images/segmentation-editing";

export interface PresentationImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl?: string;
  prompt?: string;
  isGenerating?: boolean;
  error?: string;
  onRegenerateWithSamePrompt: () => void;
  onGenerateWithNewPrompt: (prompt: string) => void;
  onSegmentEdit?: (
    operation: ImageEditOperation,
    selectionPrompt: string,
    editPrompt?: string,
  ) => Promise<void>;
}

const EDIT_TOOLS: Array<{
  id: ImageEditOperation;
  label: string;
  icon: typeof Scissors;
  needsPrompt?: boolean;
}> = [
  { id: "remove", label: "Remove object", icon: Eraser },
  { id: "replace", label: "Replace object", icon: Sparkles, needsPrompt: true },
  { id: "recolor", label: "Recolor object", icon: Paintbrush, needsPrompt: true },
  { id: "background-remove", label: "Remove background", icon: Scissors },
  { id: "background-replace", label: "Replace background", icon: ImageIcon, needsPrompt: true },
];

export const PresentationImageEditor = ({
  open,
  onOpenChange,
  imageUrl,
  prompt,
  isGenerating = false,
  error,
  onRegenerateWithSamePrompt,
  onGenerateWithNewPrompt,
  onSegmentEdit,
}: PresentationImageEditorProps) => {
  const { imageModel, setImageModel } = usePresentationState();
  const [newPrompt, setNewPrompt] = useState(prompt ?? "");
  const [selectionPrompt, setSelectionPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [activeTool, setActiveTool] = useState<ImageEditOperation>("remove");
  const [isEditing, setIsEditing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGenerateClick = () => {
    if (!newPrompt.trim()) {
      setLocalError("Please enter a prompt first");
      return;
    }
    setLocalError(null);
    onGenerateWithNewPrompt(newPrompt);
  };

  const handleSegmentEdit = async () => {
    if (!onSegmentEdit || !imageUrl) return;
    if (
      activeTool !== "background-remove" &&
      activeTool !== "background-replace" &&
      !selectionPrompt.trim()
    ) {
      setLocalError("Describe the object to select, for example: red car, person, logo.");
      return;
    }

    const tool = EDIT_TOOLS.find((item) => item.id === activeTool);
    if (tool?.needsPrompt && !editPrompt.trim()) {
      setLocalError("Describe the replacement, color, or new background.");
      return;
    }

    setLocalError(null);
    setIsEditing(true);
    try {
      await onSegmentEdit(activeTool, selectionPrompt, editPrompt);
    } catch (editError) {
      setLocalError(
        editError instanceof Error ? editError.message : "Image edit failed",
      );
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-xl overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Image Editor</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {localError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          )}

          <div className="relative overflow-hidden rounded-md border border-border bg-muted">
            {isGenerating || isEditing ? (
              <div className="flex h-60 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Spinner className="h-6 w-6" />
                  <span className="text-sm text-muted-foreground">
                    {isEditing ? "Applying segmented edit..." : "Generating image..."}
                  </span>
                </div>
              </div>
            ) : imageUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={prompt ?? "Presentation image"}
                  className="h-auto max-h-[300px] w-full object-contain"
                />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/80">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/80">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-60 items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-10 w-10 opacity-50" />
                  <span>No image generated yet</span>
                </div>
              </div>
            )}
          </div>

          {imageUrl && (
            <div className="space-y-4 rounded-xl border p-4">
              <div>
                <h3 className="font-medium">Edit objects in place</h3>
                <p className="text-sm text-muted-foreground">
                  Select an object with segmentation, then remove, replace, recolor, or change its background without regenerating the whole image.
                </p>
              </div>

              <Select value={activeTool} onValueChange={(value) => setActiveTool(value as ImageEditOperation)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an edit" />
                </SelectTrigger>
                <SelectContent>
                  {EDIT_TOOLS.map((tool) => (
                    <SelectItem key={tool.id} value={tool.id}>{tool.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeTool !== "background-remove" && activeTool !== "background-replace" && (
                <Textarea
                  value={selectionPrompt}
                  onChange={(event) => setSelectionPrompt(event.target.value)}
                  placeholder="Object to select, e.g. person in the foreground, red car, product label..."
                  className="min-h-20"
                />
              )}

              {EDIT_TOOLS.find((item) => item.id === activeTool)?.needsPrompt && (
                <Textarea
                  value={editPrompt}
                  onChange={(event) => setEditPrompt(event.target.value)}
                  placeholder={
                    activeTool === "recolor"
                      ? "Describe the new color/style..."
                      : activeTool === "background-replace"
                        ? "Describe the new background..."
                        : "Describe the replacement object..."
                  }
                  className="min-h-20"
                />
              )}

              <Button className="w-full gap-2" onClick={() => void handleSegmentEdit()} disabled={isEditing || isGenerating}>
                <Scissors className="h-4 w-4" />
                Apply segmented edit
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Generate / regenerate image</label>
            <Textarea
              placeholder="Describe the image you want to generate..."
              className="min-h-[100px]"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              disabled={isGenerating || isEditing}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image Model</label>
            <Select
              value={imageModel}
              onValueChange={(value) => setImageModel(value as ImageModelList)}
              disabled={isGenerating || isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select image model" />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="default"
              className="flex-1"
              onClick={handleGenerateClick}
              disabled={isGenerating || isEditing}
            >
              {isGenerating ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" /> Generate New
                </>
              )}
            </Button>

            {imageUrl && (
              <Button
                variant="outline"
                onClick={onRegenerateWithSamePrompt}
                disabled={isGenerating || isEditing}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

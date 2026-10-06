"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ArtifactBlock {
  id: string;
  type: "heading" | "text" | "image" | "chart" | "table" | "callout";
  text?: string;
  data?: unknown;
}

export function ArtifactCanvas({ artifactId }: { artifactId: string }) {
  const [blocks, setBlocks] = useState<ArtifactBlock[]>([]);
  const [status, setStatus] = useState("Loading");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    void fetch(`/api/artifacts/${artifactId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load artifact");
        const payload = await response.json() as { artifact: { content: unknown } };
        const content = (payload.artifact.content ?? {}) as { blocks?: ArtifactBlock[] };
        setBlocks(Array.isArray(content.blocks) ? content.blocks : []);
        setStatus("Saved");
      })
      .catch(() => setStatus("Offline"));
  }, [artifactId]);

  const ids = useMemo(() => blocks.map((block) => block.id), [blocks]);

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const from = blocks.findIndex((block) => block.id === event.active.id);
    const to = blocks.findIndex((block) => block.id === event.over?.id);
    setBlocks(arrayMove(blocks, from, to));
    setStatus("Unsaved");
  };

  const save = async () => {
    setStatus("Saving");
    const response = await fetch(`/api/artifacts/${artifactId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: { blocks } }),
    });
    setStatus(response.ok ? "Saved" : "Error");
  };

  const addBlock = () => {
    setBlocks((current) => [
      ...current,
      { id: crypto.randomUUID(), type: "text", text: "New editable block" },
    ]);
    setStatus("Unsaved");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{status}</span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addBlock}><Plus className="mr-2 h-4 w-4" />Add block</Button>
          <Button onClick={() => void save()}><Save className="mr-2 h-4 w-4" />Save</Button>
        </div>
      </div>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                onChange={(next) => {
                  setBlocks((current) => current.map((item) => item.id === next.id ? next : item));
                  setStatus("Unsaved");
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableBlock({ block, onChange }: { block: ArtifactBlock; onChange: (block: ArtifactBlock) => void }) {
  const sortable = useSortable({ id: block.id });
  return (
    <div
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className="flex gap-3 rounded-xl border bg-card p-4 shadow-sm"
    >
      <button className="mt-2 cursor-grab text-muted-foreground" {...sortable.attributes} {...sortable.listeners}>
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{block.type}</div>
        <textarea
          value={block.text ?? ""}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          className="min-h-24 w-full resize-y rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}

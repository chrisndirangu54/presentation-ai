"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
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
import {
  BarChart3,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Save,
  Table2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ArtifactBlock {
  id: string;
  type: "heading" | "text" | "image" | "chart" | "table" | "callout";
  text?: string;
  data?: unknown;
  imageUrl?: string;
}

const blockTypes: ArtifactBlock["type"][] = [
  "heading",
  "text",
  "image",
  "chart",
  "table",
  "callout",
];

export function ArtifactCanvas({ artifactId }: { artifactId: string }) {
  const [blocks, setBlocks] = useState<ArtifactBlock[]>([]);
  const [status, setStatus] = useState("Loading");
  const [collaboration, setCollaboration] = useState<
    "disabled" | "connecting" | "connected" | "offline"
  >("disabled");
  const roomRef = useRef<Y.Map<string> | null>(null);
  const remoteJsonRef = useRef<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    void fetch(`/api/artifacts/${artifactId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load artifact");
        const payload = (await response.json()) as {
          artifact: { content: unknown };
        };
        const content = (payload.artifact.content ?? {}) as {
          blocks?: ArtifactBlock[];
        };
        setBlocks(Array.isArray(content.blocks) ? content.blocks : []);
        setStatus("Saved");
      })
      .catch(() => setStatus("Offline"));
  }, [artifactId]);

  useEffect(() => {
    const doc = new Y.Doc();
    const room = doc.getMap<string>("artifact");
    let disposed = false;
    const clientId = crypto.randomUUID();

    const connect = async () => {
      setCollaboration("connecting");
      const response = await fetch(
        `/api/collaboration/token?artifactId=${encodeURIComponent(artifactId)}`,
      );
      if (!response.ok) {
        setCollaboration(response.status === 403 ? "disabled" : "offline");
        return;
      }

      const payload = (await response.json()) as {
        token: string;
        wsUrl: string | null;
      };
      if (!payload.wsUrl || disposed) {
        setCollaboration("disabled");
        return;
      }

      const url = new URL(payload.wsUrl);
      url.searchParams.set("token", payload.token);
      url.searchParams.set("clientId", clientId);
      const socket = new WebSocket(url);
      socket.binaryType = "arraybuffer";
      roomRef.current = room;

      socket.onopen = () => setCollaboration("connected");
      socket.onerror = () => !disposed && setCollaboration("offline");
      socket.onclose = () => !disposed && setCollaboration("offline");
      socket.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          Y.applyUpdate(doc, new Uint8Array(event.data), "remote");
        }
      };

      doc.on("update", (update, origin) => {
        if (origin !== "remote" && socket.readyState === WebSocket.OPEN) {
          socket.send(update);
        }
      });

      room.observe(() => {
        const value = room.get("blocks");
        if (!value) return;
        remoteJsonRef.current = value;
        try {
          setBlocks(JSON.parse(value) as ArtifactBlock[]);
          setStatus("Synced");
        } catch {
          // Ignore malformed remote payloads.
        }
      });
    };

    void connect();
    return () => {
      disposed = true;
      doc.destroy();
      roomRef.current = null;
    };
  }, [artifactId]);

  useEffect(() => {
    if (!roomRef.current || collaboration !== "connected") return;
    const json = JSON.stringify(blocks);
    if (remoteJsonRef.current === json) {
      remoteJsonRef.current = null;
      return;
    }
    roomRef.current.set("blocks", json);
  }, [blocks, collaboration]);

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
    setStatus(response.ok ? "Saved" : response.status === 403 ? "Read only" : "Error");
  };

  const addBlock = (type: ArtifactBlock["type"]) => {
    setBlocks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type,
        text:
          type === "heading"
            ? "New heading"
            : type === "image"
              ? "Image description"
              : type === "chart"
                ? "Chart"
                : type === "table"
                  ? "Table"
                  : "New editable block",
        data:
          type === "chart"
            ? { type: "bar", rows: [] }
            : type === "table"
              ? { columns: ["Column 1"], rows: [[""]] }
              : undefined,
      },
    ]);
    setStatus("Unsaved");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>{status}</span>
          <span>· Collaboration: {collaboration}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {blockTypes.map((type) => (
            <Button key={type} variant="outline" size="sm" onClick={() => addBlock(type)}>
              <Plus className="mr-1 h-4 w-4" />
              {type}
            </Button>
          ))}
          <Button onClick={() => void save()}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
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
                  setBlocks((current) =>
                    current.map((item) => (item.id === next.id ? next : item)),
                  );
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

function SortableBlock({
  block,
  onChange,
}: {
  block: ArtifactBlock;
  onChange: (block: ArtifactBlock) => void;
}) {
  const sortable = useSortable({ id: block.id });
  const icon =
    block.type === "image"
      ? ImageIcon
      : block.type === "chart"
        ? BarChart3
        : block.type === "table"
          ? Table2
          : Type;
  const Icon = icon;

  const updateJson = (value: string) => {
    try {
      onChange({ ...block, data: JSON.parse(value) as unknown });
    } catch {
      // Keep the previous structured data until valid JSON is entered.
    }
  };

  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className="flex gap-3 rounded-xl border bg-card p-4 shadow-sm"
    >
      <button
        className="mt-2 cursor-grab text-muted-foreground"
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Icon className="h-4 w-4" />
          {block.type}
        </div>

        {block.type === "image" && (
          <>
            <input
              value={block.imageUrl ?? ""}
              onChange={(event) =>
                onChange({ ...block, imageUrl: event.target.value })
              }
              placeholder="Image URL"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {block.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.imageUrl}
                alt={block.text ?? ""}
                className="max-h-80 w-full rounded-lg border object-contain"
              />
            )}
          </>
        )}

        <textarea
          value={block.text ?? ""}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          className="min-h-20 w-full resize-y rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Editable content"
        />

        {(block.type === "chart" || block.type === "table") && (
          <textarea
            defaultValue={JSON.stringify(block.data ?? {}, null, 2)}
            onBlur={(event) => updateJson(event.target.value)}
            className="min-h-36 w-full resize-y rounded-md border bg-background p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
            aria-label={`${block.type} structured data`}
          />
        )}
      </div>
    </div>
  );
}

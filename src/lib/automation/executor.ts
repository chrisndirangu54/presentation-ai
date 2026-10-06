import { UTFile } from "uploadthing/server";
import { utapi } from "@/app/api/uploadthing/core";
import { db } from "@/server/db";
import { recommendChart } from "@/lib/visuals/chart-spec";
import { validateDiagram } from "@/lib/visuals/diagram-spec";
import { reviewDesign } from "@/lib/design/critic";
import { normalizeRenderable } from "@/lib/export/normalize";
import {
  renderBinary,
  type BinaryExportTarget,
} from "@/lib/export/renderers";

type NodeShape = {
  id: string;
  type: string;
  label?: string;
  config?: Record<string, unknown>;
};
type EdgeShape = { source: string; target: string };

async function exportDocument(config: Record<string, unknown>) {
  const documentId = String(config.documentId ?? "");
  const target = String(config.target ?? "pdf") as BinaryExportTarget;
  if (!documentId) throw new Error("Export nodes require config.documentId");
  if (!["pptx", "docx", "xlsx", "pdf"].includes(target)) {
    throw new Error("Export target must be pptx, docx, xlsx or pdf");
  }

  const base = await db.baseDocument.findUnique({
    where: { id: documentId },
    include: { presentation: true, artifact: true },
  });
  if (!base) throw new Error(`Export document ${documentId} was not found`);

  const payload = base.presentation?.content ?? base.artifact?.content ?? {};
  const rendered = await renderBinary(
    target,
    normalizeRenderable(base.title, payload),
  );
  const file = new UTFile(
    [rendered.bytes],
    `${base.title.replace(/[^a-z0-9-_]+/gi, "_") || "artifact"}.${rendered.extension}`,
    { type: rendered.contentType },
  );
  const uploaded = await utapi.uploadFiles([file]);
  const url = uploaded[0]?.data?.ufsUrl;
  if (!url) throw new Error("Export upload failed");
  return { target, url, bytes: rendered.bytes.byteLength };
}

export async function executeWorkflow(
  workflowId: string,
  triggerData: unknown,
) {
  const workflow = await db.automationWorkflow.findUnique({
    where: { id: workflowId },
  });
  if (!workflow) throw new Error("Workflow not found");

  const nodes = workflow.nodes as unknown as NodeShape[];
  const edges = workflow.edges as unknown as EdgeShape[];
  const run = await db.workflowRun.create({
    data: {
      workflowId,
      status: "RUNNING",
      startedAt: new Date(),
      triggerData: triggerData as object,
    },
  });

  try {
    const completed = new Set<string>();
    const state: Record<string, unknown> = { trigger: triggerData };
    let guard = 0;

    while (completed.size < nodes.length && guard++ < nodes.length * 3) {
      let progressed = false;

      for (const node of nodes) {
        if (completed.has(node.id)) continue;
        const parents = edges
          .filter((edge) => edge.target === node.id)
          .map((edge) => edge.source);
        if (parents.some((parent) => !completed.has(parent))) continue;

        const input = parents.length
          ? state[parents[parents.length - 1]!]
          : triggerData;
        const config = node.config ?? {};
        let output: unknown = input;

        switch (node.type) {
          case "trigger":
            output = triggerData;
            break;
          case "transform":
          case "design":
            output = { input, ...config };
            break;
          case "analyze": {
            const rows = Array.isArray(input) ? input : [];
            output = {
              rowCount: rows.length,
              sample: rows.slice(0, 5),
            };
            break;
          }
          case "chart": {
            const rows = Array.isArray(input)
              ? (input as Array<Record<string, unknown>>)
              : [];
            output = { chartType: recommendChart(rows), rows };
            break;
          }
          case "diagram":
            output = validateDiagram(config as never);
            break;
          case "review":
            output = reviewDesign({
              title: String(config.title ?? ""),
              bodyText: String(config.bodyText ?? ""),
              hasCitation:
                typeof config.hasCitation === "boolean"
                  ? config.hasCitation
                  : undefined,
              hasAltText:
                typeof config.hasAltText === "boolean"
                  ? config.hasAltText
                  : undefined,
              brandCompliant:
                typeof config.brandCompliant === "boolean"
                  ? config.brandCompliant
                  : undefined,
            });
            break;
          case "export":
            output = await exportDocument(config);
            break;
          case "publish": {
            const artifactId = String(config.artifactId ?? "");
            const slug = String(config.slug ?? "");
            if (!artifactId || !slug) {
              throw new Error(
                "Publish nodes require config.artifactId and config.slug",
              );
            }
            output = await db.publishedArtifact.upsert({
              where: { slug },
              create: {
                artifactId,
                slug,
                visibility:
                  (String(config.visibility ?? "PRIVATE") as
                    | "PRIVATE"
                    | "WORKSPACE"
                    | "PASSWORD"
                    | "PUBLIC"),
                settings: config as object,
              },
              update: {
                artifactId,
                visibility:
                  (String(config.visibility ?? "PRIVATE") as
                    | "PRIVATE"
                    | "WORKSPACE"
                    | "PASSWORD"
                    | "PUBLIC"),
                settings: config as object,
              },
            });
            break;
          }
          case "notify": {
            const url = String(config.url ?? "");
            if (!url.startsWith("https://")) {
              throw new Error(
                `Notify node ${node.id} requires an HTTPS URL`,
              );
            }
            const response = await fetch(url, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ workflowId, runId: run.id, input }),
            });
            if (!response.ok) {
              throw new Error(
                `Notify node ${node.id} failed with ${response.status}`,
              );
            }
            output = { status: response.status, ok: true };
            break;
          }
          case "approval":
            output = { pausedForApproval: true, input };
            break;
          case "research":
            output = {
              input,
              query: config.query ?? null,
              requiresConfiguredResearchProvider: true,
            };
            break;
          default:
            throw new Error(`Unsupported workflow node type: ${node.type}`);
        }

        state[node.id] = output;
        completed.add(node.id);
        progressed = true;

        await db.workflowRun.update({
          where: { id: run.id },
          data: { nodeState: state as object },
        });

        if (node.type === "approval") {
          await db.workflowRun.update({
            where: { id: run.id },
            data: { status: "PARTIAL", result: state as object },
          });
          return { runId: run.id, status: "PARTIAL" as const, state };
        }
      }

      if (!progressed) {
        throw new Error(
          "Workflow graph contains a cycle or unresolved dependency",
        );
      }
    }

    await db.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCEEDED",
        result: state as object,
        finishedAt: new Date(),
      },
    });
    await db.automationWorkflow.update({
      where: { id: workflowId },
      data: { lastRunAt: new Date() },
    });

    return { runId: run.id, status: "SUCCEEDED" as const, state };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Workflow execution failed";
    await db.workflowRun.update({
      where: { id: run.id },
      data: { status: "FAILED", error: message, finishedAt: new Date() },
    });
    throw error;
  }
}

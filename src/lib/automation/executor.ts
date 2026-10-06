import { db } from "@/server/db";
import { recommendChart } from "@/lib/visuals/chart-spec";
import { validateDiagram } from "@/lib/visuals/diagram-spec";

type NodeShape = { id: string; type: string; label?: string; config?: Record<string, unknown> };
type EdgeShape = { source: string; target: string };

export async function executeWorkflow(workflowId: string, triggerData: unknown) {
  const workflow = await db.automationWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new Error("Workflow not found");

  const nodes = workflow.nodes as unknown as NodeShape[];
  const edges = workflow.edges as unknown as EdgeShape[];
  const run = await db.workflowRun.create({
    data: { workflowId, status: "RUNNING", startedAt: new Date(), triggerData: triggerData as object },
  });

  try {
    const completed = new Set<string>();
    const state: Record<string, unknown> = { trigger: triggerData };
    let guard = 0;

    while (completed.size < nodes.length && guard++ < nodes.length * 3) {
      let progressed = false;
      for (const node of nodes) {
        if (completed.has(node.id)) continue;
        const parents = edges.filter((edge) => edge.target === node.id).map((edge) => edge.source);
        if (parents.some((parent) => !completed.has(parent))) continue;

        const input = parents.length ? state[parents[parents.length - 1]!] : triggerData;
        const config = node.config ?? {};
        let output: unknown = input;

        if (node.type === "transform") {
          output = { input, ...config };
        } else if (node.type === "analyze") {
          const rows = Array.isArray(input) ? input : [];
          output = { rowCount: rows.length, sample: rows.slice(0, 5) };
        } else if (node.type === "chart") {
          const rows = Array.isArray(input) ? input as Array<Record<string, unknown>> : [];
          output = { chartType: recommendChart(rows), rows };
        } else if (node.type === "diagram") {
          output = validateDiagram(config as never);
        } else if (node.type === "notify") {
          const url = String(config.url ?? "");
          if (!url.startsWith("https://")) throw new Error(`Notify node ${node.id} requires an HTTPS URL`);
          const response = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ workflowId, runId: run.id, input }),
          });
          output = { status: response.status, ok: response.ok };
        } else if (node.type === "approval") {
          output = { pausedForApproval: true, input };
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
      if (!progressed) throw new Error("Workflow graph contains a cycle or unresolved dependency");
    }

    await db.workflowRun.update({
      where: { id: run.id },
      data: { status: "SUCCEEDED", result: state as object, finishedAt: new Date() },
    });
    await db.automationWorkflow.update({ where: { id: workflowId }, data: { lastRunAt: new Date() } });
    return { runId: run.id, status: "SUCCEEDED" as const, state };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow execution failed";
    await db.workflowRun.update({
      where: { id: run.id },
      data: { status: "FAILED", error: message, finishedAt: new Date() },
    });
    throw error;
  }
}

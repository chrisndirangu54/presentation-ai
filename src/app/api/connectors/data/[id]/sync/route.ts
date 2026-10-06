import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getConnectorAccessToken } from "@/lib/connectors/access-token";

function rowsFromValues(values: unknown[][]) {
  if (!values.length) return [];
  const headers = values[0]?.map((value, index) => String(value ?? `column_${index + 1}`)) ?? [];
  return values.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])),
  );
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connection = await db.dataConnection.findUnique({
    where: { id: params.id },
  });
  if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

  const workspace = await db.workspace.findFirst({
    where: {
      id: connection.workspaceId,
      OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
    },
  });
  if (!workspace && !session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const run = await db.dataSyncRun.create({
    data: { connectionId: connection.id, status: "RUNNING", startedAt: new Date() },
  });

  try {
    const config = connection.configuration as Record<string, unknown>;
    let result: unknown;
    let recordsRead = 0;

    if (connection.kind === "GOOGLE_SHEETS") {
      if (!connection.secretRef) throw new Error("Google Sheets connection is missing OAuth credentials");
      const { accessToken, provider } = await getConnectorAccessToken(connection.secretRef);
      if (provider !== "google") throw new Error("Google Sheets requires a Google OAuth connection");
      const spreadsheetId = String(config.spreadsheetId ?? "");
      const range = String(config.range ?? "Sheet1");
      if (!spreadsheetId) throw new Error("spreadsheetId is required");
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
      const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
      const payload = (await response.json()) as { values?: unknown[][]; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Google Sheets sync failed");
      const rows = rowsFromValues(payload.values ?? []);
      recordsRead = rows.length;
      result = { rows, range };
    } else if (connection.kind === "EXCEL") {
      if (!connection.secretRef) throw new Error("Excel connection is missing OAuth credentials");
      const { accessToken, provider } = await getConnectorAccessToken(connection.secretRef);
      if (provider !== "microsoft") throw new Error("Excel requires a Microsoft OAuth connection");
      const itemId = String(config.driveItemId ?? "");
      const worksheet = String(config.worksheet ?? "Sheet1");
      const range = String(config.range ?? "A1:Z1000");
      if (!itemId) throw new Error("driveItemId is required");
      const graphUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(itemId)}/workbook/worksheets/${encodeURIComponent(worksheet)}/range(address='${encodeURIComponent(range)}')`;
      const response = await fetch(graphUrl, { headers: { authorization: `Bearer ${accessToken}` } });
      const payload = (await response.json()) as { values?: unknown[][]; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Microsoft Excel sync failed");
      const rows = rowsFromValues(payload.values ?? []);
      recordsRead = rows.length;
      result = { rows, worksheet, range };
    } else if (connection.kind === "REST_API") {
      const endpoint = String(config.url ?? "");
      if (!endpoint.startsWith("https://")) throw new Error("REST API URL must use HTTPS");
      const response = await fetch(endpoint, {
        headers: typeof config.headers === "object" && config.headers
          ? (config.headers as Record<string, string>)
          : undefined,
      });
      if (!response.ok) throw new Error(`REST API sync failed with ${response.status}`);
      result = await response.json();
      recordsRead = Array.isArray(result) ? result.length : 1;
    } else {
      throw new Error(`Sync is not yet implemented for ${connection.kind}`);
    }

    await db.$transaction([
      db.dataSyncRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCEEDED",
          finishedAt: new Date(),
          recordsRead,
          recordsWritten: recordsRead,
          result: result as object,
        },
      }),
      db.dataConnection.update({
        where: { id: connection.id },
        data: { lastSyncedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ runId: run.id, recordsRead, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    await db.dataSyncRun.update({
      where: { id: run.id },
      data: { status: "FAILED", finishedAt: new Date(), error: message },
    });
    return NextResponse.json({ error: message, runId: run.id }, { status: 502 });
  }
}

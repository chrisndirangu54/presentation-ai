export type AppRole = "SUPER_ADMIN" | "ADMIN" | "USER";
export type WorkspaceRole = "OWNER" | "ADMIN" | "EDITOR" | "COMMENTER" | "VIEWER";

export type WorkspaceAction =
  | "workspace.manage"
  | "members.manage"
  | "providers.manage"
  | "brand.manage"
  | "presentation.create"
  | "presentation.edit"
  | "presentation.comment"
  | "presentation.view"
  | "presentation.export"
  | "audit.view";

const roleActions: Record<WorkspaceRole, WorkspaceAction[]> = {
  OWNER: [
    "workspace.manage",
    "members.manage",
    "providers.manage",
    "brand.manage",
    "presentation.create",
    "presentation.edit",
    "presentation.comment",
    "presentation.view",
    "presentation.export",
    "audit.view",
  ],
  ADMIN: [
    "members.manage",
    "providers.manage",
    "brand.manage",
    "presentation.create",
    "presentation.edit",
    "presentation.comment",
    "presentation.view",
    "presentation.export",
    "audit.view",
  ],
  EDITOR: [
    "presentation.create",
    "presentation.edit",
    "presentation.comment",
    "presentation.view",
    "presentation.export",
  ],
  COMMENTER: ["presentation.comment", "presentation.view"],
  VIEWER: ["presentation.view"],
};

export function can(
  appRole: AppRole,
  workspaceRole: WorkspaceRole | undefined,
  action: WorkspaceAction,
) {
  if (appRole === "SUPER_ADMIN") return true;
  if (!workspaceRole) return false;
  return roleActions[workspaceRole].includes(action);
}

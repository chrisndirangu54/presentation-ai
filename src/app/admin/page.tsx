import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { platformCapabilities } from "@/lib/platform/capabilities";
import { modelRegistry } from "@/lib/ai/provider-registry";
import { exportAdapters } from "@/lib/export/adapters";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  if (!session.user.isAdmin) redirect("/presentation");

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Platform control plane
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Presentation AI Admin
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Configure models, workspaces, exports, security, usage and research
          capabilities from one operational surface.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Registered model routes" value={modelRegistry.length} />
        <Metric label="Export targets" value={exportAdapters.length} />
        <Metric
          label="Capability groups"
          value={Object.keys(platformCapabilities).length}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="AI model routing">
          {modelRegistry.map((model) => (
            <div
              key={`${model.provider}-${model.id}`}
              className="flex items-start justify-between border-b py-3 last:border-0"
            >
              <div>
                <p className="font-medium">{model.id}</p>
                <p className="text-sm text-muted-foreground">
                  {model.provider} · {model.capabilities.join(", ")}
                </p>
              </div>
              <span className="rounded-full border px-2 py-1 text-xs">
                {model.strengths[0]}
              </span>
            </div>
          ))}
        </Panel>

        <Panel title="Exports and interoperability">
          {exportAdapters.map((adapter) => (
            <div
              key={adapter.target}
              className="flex items-center justify-between border-b py-3 last:border-0"
            >
              <div>
                <p className="font-medium">{adapter.label}</p>
                <p className="text-sm text-muted-foreground">
                  {adapter.supportsEditableOutput
                    ? "Editable output"
                    : "Rendered output"}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {adapter.requiresExternalProvider ? "Connector" : "Native"}
              </span>
            </div>
          ))}
        </Panel>
      </section>

      <Panel title="Capability map">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(platformCapabilities).map(([group, features]) => (
            <div key={group}>
              <h2 className="mb-2 font-semibold capitalize">{group}</h2>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

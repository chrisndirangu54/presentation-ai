import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { integrations } from "@/lib/integrations/registry";
import { contentComponents } from "@/lib/components/library";

const modules = [
  ["One source → many outputs", "Turn one evidence set into a deck, report, infographic, spreadsheet, social carousel and more."],
  ["Design Critic", "Review hierarchy, contrast, readability, accessibility, brand compliance and data integrity."],
  ["Audience Simulator", "Evaluate content as an investor, executive, customer, technical reviewer, lecturer, regulator or general audience."],
  ["Automation Builder", "Connect triggers to research, analysis, charts, design, approvals, export, publishing and notifications."],
  ["Live Data", "Bind artifacts to spreadsheets, SQL, REST APIs, CRM systems and BI tools for refreshable visual reporting."],
  ["Publishing Analytics", "Measure views, completion, clicks, downloads, questions, forms and A/B variants."],
  ["Enterprise Governance", "Apply approval, brand, sharing, citation, cost and retention policies."],
  ["Knowledge & Components", "Reuse approved facts, legal text, bios, KPIs and branded blocks across outputs."],
];

export default async function IntelligencePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const dataConnectors = integrations.filter((item) =>
    ["data", "crm", "analytics", "automation"].includes(item.category),
  );

  return (
    <main className="mx-auto max-w-7xl space-y-10 p-6 md:p-10">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Creative intelligence</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            One source. Many outputs. One evidence system.
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Coordinate research, data, design, brand rules, approvals, publishing and analytics across every artifact format.
          </p>
        </div>
        <Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/studio">
          Open Studio
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map(([title, description]) => (
          <article key={title} className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Live data & automation connectors</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dataConnectors.map((item) => (
            <div key={item.id} className="rounded-xl border p-4">
              <div className="font-medium">{item.name}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{item.category}</div>
              <p className="mt-2 text-sm text-muted-foreground">{item.capabilities.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Reusable approved components</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {contentComponents.map((component) => (
            <div key={component.id} className="rounded-xl border p-4">
              <div className="font-medium">{component.label}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{component.category}</div>
              <p className="mt-2 text-sm text-muted-foreground">{component.placeholders.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

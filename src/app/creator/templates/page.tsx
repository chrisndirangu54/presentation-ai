import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

const templateKinds = [
  "Presentation","Document","Spreadsheet","Infographic","Chart pack","Flowchart",
  "Diagram","Mind map","Timeline","Dashboard","Poster","Social carousel","One-pager","Whitepaper",
];

export default async function CreatorTemplatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">Creator studio</p>
        <h1 className="text-3xl font-semibold tracking-tight">Build and sell templates</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Template packages can contain editable layouts, visual specs, data placeholders, brand tokens,
          preview assets, version history and licensing metadata.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="Template types" value={templateKinds.length} />
        <Stat label="Pricing modes" value={2} />
        <Stat label="License tiers" value={5} />
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">New template package</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Template name" placeholder="e.g. Venture Capital Pitch System" />
          <Field label="Category" placeholder="Startup / Education / Analytics..." />
          <Field label="Price" placeholder="0 for free or amount in your currency" />
          <Field label="License" placeholder="Personal / Commercial / Team / Enterprise" />
        </div>
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium">Supported template families</p>
          <div className="flex flex-wrap gap-2">
            {templateKinds.map((kind) => <span key={kind} className="rounded-full border px-3 py-1 text-sm">{kind}</span>)}
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          The schema now supports draft, review, published and archived states, paid/free listings,
          versioned manifests, previews, licensing, purchases, ratings and creator analytics.
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-5"><div className="text-3xl font-semibold">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>;
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return <label className="space-y-2 text-sm"><span className="font-medium">{label}</span><input disabled className="w-full rounded-md border bg-background px-3 py-2 text-muted-foreground" placeholder={placeholder} /></label>;
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

const signals = [
  ["Candidate choice", "Explicitly selecting an alternate layout is positive preference evidence; switching away creates negative evidence for the previous choice."],
  ["Post-layout corrections", "Manual edits after auto-layout reduce reward in proportion to how much of the generated structure the user had to change."],
  ["Viewer completion", "Published artifacts can feed completion rates back into the selected candidate profile."],
  ["Interaction", "Clicks, questions, downloads, shares and form submissions provide outcome signals beyond subjective editor choice."],
  ["Scoped preferences", "Weights can learn independently for a user, workspace, industry, audience and target format."],
  ["Safety constraints", "Learning reranks only candidates that already pass deterministic layout generation and quality constraints."],
];

export default async function LayoutLearningPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <main className="mx-auto max-w-7xl space-y-10 p-6 md:p-10">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Learned layout intelligence</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Layout preferences that improve from real usage
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Candidate selection, correction effort and published performance gradually tune
            layout feature weights while deterministic constraints continue to enforce safety,
            readability and brand rules.
          </p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-md border px-4 py-2 text-sm font-medium" href="/adaptive">
            Adaptive layouts
          </Link>
          <Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/studio">
            Open Studio
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {signals.map(([title, description]) => (
          <article key={title} className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Learned feature dimensions</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {["Relationships", "Whitespace", "Balance", "Typography", "Imagery", "Charts"].map((label) => (
            <div key={label} className="rounded-xl border p-4 text-center text-sm font-medium">
              {label}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Weights remain normalized and confidence increases gradually with sample count.
          Learning events and every profile update are persisted for auditability.
        </p>
      </section>
    </main>
  );
}

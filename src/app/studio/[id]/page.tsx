import { ArtifactCanvas } from "@/components/studio/artifact-canvas";

export default function ArtifactEditorPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">Multi-format editor</p>
        <h1 className="text-3xl font-semibold tracking-tight">Drag, edit and reorder artifact blocks</h1>
        <p className="mt-2 text-muted-foreground">
          The same structured block canvas can back documents, infographics, dashboards, one-pagers and other export formats.
        </p>
      </header>
      <ArtifactCanvas artifactId={params.id} />
    </main>
  );
}

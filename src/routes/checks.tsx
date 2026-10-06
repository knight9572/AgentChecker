import { createFileRoute, Link } from "@tanstack/react-router";
import { BUILT_IN_CHECKS } from "@/lib/checks";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/checks")({
  head: () => ({
    meta: [
      { title: "Check Catalog — AgentChecker" },
      { name: "description", content: "The 22 built-in reliability checks every AI agent is tested against." },
      { property: "og:title", content: "Check Catalog — AgentChecker" },
      { property: "og:description", content: "The 22 built-in reliability checks every AI agent is tested against." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Catalog,
});

const sev: Record<string, string> = {
  critical: "text-fail",
  high: "text-warn",
  medium: "text-foreground",
  low: "text-muted-foreground",
};

function Catalog() {
  const cats = Array.from(new Set(BUILT_IN_CHECKS.map((c) => c.category)));
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-14">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Catalog</p>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
          {BUILT_IN_CHECKS.length} checks. Run on every submission.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Each check inspects your agent's source or config for a specific reliability property and
          points to the exact line it relied on. Add your own rules from the{" "}
          <Link to="/" className="text-primary underline underline-offset-4">harness</Link>.
        </p>
        <div className="mt-12 space-y-10">
          {cats.map((cat) => (
            <section key={cat}>
              <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{cat}</h2>
              <div className="grid gap-px overflow-hidden rounded-md border bg-border md:grid-cols-2">
                {BUILT_IN_CHECKS.filter((c) => c.category === cat).map((c) => (
                  <div key={c.id} className="bg-card p-5">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-muted-foreground">{c.id}</span>
                      <span className={`uppercase ${sev[c.severity]}`}>{c.severity}</span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-medium">{c.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

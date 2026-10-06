import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUILT_IN_CHECKS,
  SAMPLE_AGENT,
  score,
  verdict,
  type CheckResult,
  type Severity,
  type Status,
} from "@/lib/checks";
import { loadCustom, runCustom, saveCustom, type CustomCheck } from "@/lib/custom-checks";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgentChecker — Test your AI agent" },
      {
        name: "description",
        content: "Paste or upload your AI agent's code and run 22 reliability checks plus your own custom rules.",
      },
      { property: "og:title", content: "AgentChecker" },
      { property: "og:description", content: "Does your AI agent actually work reliably? Run 22 checks and find out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Harness,
});

const tone: Record<Status, string> = {
  pass: "text-pass border-pass/40 bg-pass/10",
  warn: "text-warn border-warn/40 bg-warn/10",
  fail: "text-fail border-fail/40 bg-fail/10",
};

function Harness() {
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [custom, setCustom] = useState<CustomCheck[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setCustom(loadCustom()), []);

  const total = BUILT_IN_CHECKS.length + custom.length;

  async function run() {
    if (!source.trim()) return;
    setRunning(true);
    setResults([]);
    setProgress(0);
    const out: CheckResult[] = [];
    const all = [
      ...BUILT_IN_CHECKS.map((c) => () => ({
        id: c.id, name: c.name, category: c.category, severity: c.severity, description: c.description,
        ...c.run(source),
      })),
      ...custom.map((c) => () => runCustom(c, source)),
    ];
    for (let i = 0; i < all.length; i++) {
      out.push(all[i]!());
      setResults([...out]);
      setProgress(i + 1);
      await new Promise((r) => setTimeout(r, 35));
    }
    setRunning(false);
  }

  async function onFile(f: File) {
    setFileName(f.name);
    setSource(await f.text());
    setResults(null);
  }

  const s = results && !running ? score(results) : null;
  const v = results && s !== null ? verdict(results, s) : null;
  const counts = useMemo(() => {
    const c = { pass: 0, warn: 0, fail: 0 };
    results?.forEach((r) => c[r.status]++);
    return c;
  }, [results]);
  const shown = results?.filter((r) => filter === "all" || r.status === filter) ?? [];

  function exportReport() {
    const blob = new Blob(
      [JSON.stringify({ file: fileName, score: s, verdict: v?.label, generatedAt: new Date().toISOString(), results }, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "agentchecker-report.json";
    a.click();
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pb-24">
        <section className="py-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            ● {BUILT_IN_CHECKS.length} built-in checks{custom.length ? ` + ${custom.length} custom` : ""}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Does your agent actually work —{" "}
            <span className="text-muted-foreground">or are you just assuming it does?</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Paste your agent's code or upload a file. Every submission is run through the full reliability
            suite, with line-level evidence for each verdict.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* INPUT */}
          <section className="rounded-md border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-2.5 font-mono text-xs">
              <span className="text-muted-foreground">
                {fileName ?? "agent.source"} · {source.split("\n").length} lines
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSource(SAMPLE_AGENT); setFileName("sample_agent.py"); setResults(null); }}
                  className="rounded-sm px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Load sample
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-sm border px-2 py-1 hover:bg-accent"
                >
                  Upload file
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".py,.ts,.tsx,.js,.jsx,.json,.yaml,.yml,.md,.txt,.toml"
                  onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                />
              </div>
            </div>
            <textarea
              value={source}
              onChange={(e) => { setSource(e.target.value); setResults(null); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
              spellCheck={false}
              placeholder="# Paste agent code, a prompt config, or drop a file here…"
              className="h-[460px] w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="font-mono text-xs text-muted-foreground">{total} checks queued</span>
              <button
                onClick={run}
                disabled={!source.trim() || running}
                className="rounded-sm bg-primary px-5 py-2 font-mono text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
              >
                {running ? "Running…" : "Run reliability suite →"}
              </button>
            </div>
          </section>

          {/* SUMMARY */}
          <section className="flex flex-col gap-6">
            <div className="rounded-md border bg-card p-6">
              {!results ? (
                <div className="font-mono text-sm text-muted-foreground">
                  <p className="text-foreground">Awaiting input.</p>
                  <p className="mt-2">Results, score and verdict appear here once the suite runs.</p>
                </div>
              ) : (
                <>
                  <div className="font-mono text-xs text-muted-foreground">
                    {running ? "Running evaluation" : "Reliability score"}
                  </div>
                  <div className="mt-2 flex items-end gap-4">
                    <span className="font-display text-7xl font-semibold tabular-nums">
                      {s ?? Math.round((progress / total) * 100)}
                    </span>
                    <span className="mb-3 font-mono text-sm text-muted-foreground">
                      {s !== null ? "/ 100" : "%"}
                    </span>
                    {v && (
                      <span className={`mb-3 ml-auto rounded-sm border px-2.5 py-1 font-mono text-xs uppercase ${tone[v.tone]}`}>
                        {v.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${(progress / total) * 100}%` }} />
                  </div>
                  <div className="mt-2 font-mono text-xs text-muted-foreground">
                    {progress} / {total} checks
                    {running && results.length > 0 && ` · current: ${results[results.length - 1]?.name}`}
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-sm border bg-border font-mono">
                    {(["pass", "warn", "fail"] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setFilter(filter === k ? "all" : k)}
                        className={`bg-card p-3 text-left hover:bg-accent ${filter === k ? "bg-accent" : ""}`}
                      >
                        <div className={`text-2xl font-semibold text-${k}`}>{counts[k]}</div>
                        <div className="text-xs uppercase text-muted-foreground">{k === "warn" ? "warnings" : k === "pass" ? "passed" : "failed"}</div>
                      </button>
                    ))}
                  </div>
                  {!running && (
                    <button onClick={exportReport} className="mt-4 w-full rounded-sm border py-2 font-mono text-xs hover:bg-accent">
                      Export JSON report
                    </button>
                  )}
                </>
              )}
            </div>
            <CustomChecks list={custom} onChange={(l) => { setCustom(l); saveCustom(l); }} />
          </section>
        </div>

        {results && results.length > 0 && (
          <section className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">Check results</h2>
              <div className="flex gap-1 font-mono text-xs">
                {(["all", "fail", "warn", "pass"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-sm px-2.5 py-1 uppercase ${filter === f ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y overflow-hidden rounded-md border bg-card">
              {shown.map((r) => <ResultRow key={r.id} r={r} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ResultRow({ r }: { r: CheckResult }) {
  const [open, setOpen] = useState(r.status === "fail");
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-accent/50">
        <span className={`w-14 shrink-0 rounded-sm border py-0.5 text-center font-mono text-[11px] uppercase ${tone[r.status]}`}>
          {r.status}
        </span>
        <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">{r.custom ? "CUSTOM" : r.id}</span>
        <span className="flex-1 font-medium">{r.name}</span>
        <span className="hidden font-mono text-xs text-muted-foreground md:block">{r.category}</span>
        <span className="w-16 text-right font-mono text-xs uppercase text-muted-foreground">{r.severity}</span>
      </button>
      {open && (
        <div className="border-t bg-surface px-5 py-4 pl-[9.5rem] text-sm">
          <p>{r.message}</p>
          <p className="mt-1 text-muted-foreground">{r.description}</p>
          {r.evidence.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-sm border font-mono text-xs">
              {r.evidence.map((e) => (
                <div key={e.line} className="flex gap-3 border-b px-3 py-1.5 last:border-0">
                  <span className="w-8 text-right text-muted-foreground">{e.line}</span>
                  <code className="truncate">{e.text}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CustomChecks({ list, onChange }: { list: CustomCheck[]; onChange: (l: CustomCheck[]) => void }) {
  const [name, setName] = useState("");
  const [pattern, setPattern] = useState("");
  const [mode, setMode] = useState<CustomCheck["mode"]>("must-contain");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [description, setDescription] = useState("");
  const input = "w-full rounded-sm border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  function add() {
    if (!name.trim() || !pattern.trim()) return;
    onChange([...list, { id: `C-${Date.now().toString(36)}`, name: name.trim(), pattern, mode, severity, description }]);
    setName(""); setPattern(""); setDescription("");
  }

  return (
    <div className="rounded-md border bg-card p-6">
      <h2 className="font-display text-lg font-semibold">Add your own check</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Custom checks run after the {BUILT_IN_CHECKS.length} built-in ones and are saved in this browser.
      </p>
      <div className="mt-4 space-y-2.5">
        <input className={input} placeholder="Check name, e.g. Uses our logger" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={`${input} font-mono`} placeholder="Pattern (regex), e.g. structlog|audit_log" value={pattern} onChange={(e) => setPattern(e.target.value)} />
        <input className={input} placeholder="Why it matters (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-2.5">
          <select className={input} value={mode} onChange={(e) => setMode(e.target.value as CustomCheck["mode"])}>
            <option value="must-contain">Must contain</option>
            <option value="must-not-contain">Must not contain</option>
          </select>
          <select className={input} value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <button onClick={add} disabled={!name.trim() || !pattern.trim()} className="w-full rounded-sm border border-primary/50 py-2 font-mono text-sm text-primary hover:bg-primary/10 disabled:opacity-40">
          + Add check
        </button>
      </div>
      {list.length > 0 && (
        <ul className="mt-4 divide-y rounded-sm border">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="flex-1 truncate">{c.name}</span>
              <code className="truncate font-mono text-xs text-muted-foreground">/{c.pattern}/</code>
              <button onClick={() => onChange(list.filter((x) => x.id !== c.id))} className="font-mono text-xs text-muted-foreground hover:text-fail">
                remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

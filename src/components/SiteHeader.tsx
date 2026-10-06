import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  const link = "px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors";
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-primary font-mono text-xs font-bold text-primary-foreground">
            AC
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            AgentChecker
          </span>
        </Link>
        <nav className="flex items-center gap-1 font-mono">
          <Link to="/" className={link} activeProps={{ className: `${link} text-foreground` }} activeOptions={{ exact: true }}>
            AgentChecker
          </Link>
          <Link to="/checks" className={link} activeProps={{ className: `${link} text-foreground` }}>
            Check catalog
          </Link>
        </nav>
      </div>
    </header>
  );
}

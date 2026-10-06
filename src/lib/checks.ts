export type Status = "pass" | "warn" | "fail";
export type Severity = "critical" | "high" | "medium" | "low";

export interface Evidence {
  line: number;
  text: string;
}

export interface CheckResult {
  id: string;
  name: string;
  category: string;
  severity: Severity;
  description: string;
  status: Status;
  message: string;
  evidence: Evidence[];
  custom?: boolean;
}

export interface CheckDef {
  id: string;
  name: string;
  category: string;
  severity: Severity;
  description: string;
  run: (src: string) => { status: Status; message: string; evidence: Evidence[] };
}

export function findAll(src: string, patterns: RegExp[], limit = 3): Evidence[] {
  const lines = src.split(/\r?\n/);
  const out: Evidence[] = [];
  for (let i = 0; i < lines.length && out.length < limit; i++) {
    const ln = lines[i] ?? ""; if (patterns.some((p) => p.test(ln))) {
      out.push({ line: i + 1, text: ln.trim().slice(0, 160) });
    }
  }
  return out;
}

/** Present => pass, absent => (fail|warn). */
function presence(
  patterns: RegExp[],
  ok: string,
  missing: string,
  missingStatus: Status = "fail",
): CheckDef["run"] {
  return (src) => {
    const ev = findAll(src, patterns);
    return ev.length
      ? { status: "pass", message: ok, evidence: ev }
      : { status: missingStatus, message: missing, evidence: [] };
  };
}

/** Present => fail (forbidden pattern). */
function forbidden(patterns: RegExp[], found: string, clean: string): CheckDef["run"] {
  return (src) => {
    const ev = findAll(src, patterns, 5);
    return ev.length
      ? { status: "fail", message: found, evidence: ev }
      : { status: "pass", message: clean, evidence: [] };
  };
}

export const BUILT_IN_CHECKS: CheckDef[] = [
  {
    id: "AR-01",
    name: "System prompt defined",
    category: "Instructions",
    severity: "high",
    description: "The agent declares an explicit system prompt / instructions that scope its role.",
    run: presence(
      [/system[_\s-]?prompt/i, /role\s*[:=]\s*["']system["']/i, /\binstructions\s*[:=]/i, /SystemMessage/],
      "Explicit system instructions found.",
      "No system prompt or instructions detected — the agent's behavior is unscoped.",
    ),
  },
  {
    id: "AR-02",
    name: "Step / iteration limit",
    category: "Control flow",
    severity: "critical",
    description: "Agent loops are bounded by a maximum number of steps to prevent runaway execution.",
    run: presence(
      [/max[_]?(steps|iterations|turns|loops)/i, /maxSteps/, /stepCountIs/, /recursion_limit/i, /max_iter/i],
      "Loop is bounded by an explicit step limit.",
      "No step/iteration cap — an agent loop could run forever and burn tokens.",
    ),
  },
  {
    id: "AR-03",
    name: "Timeout handling",
    category: "Resilience",
    severity: "high",
    description: "Model and tool calls have timeouts so a hung dependency cannot stall the agent.",
    run: presence(
      [/timeout/i, /AbortSignal\.timeout/, /deadline/i],
      "Timeouts configured on calls.",
      "No timeouts detected on model or tool calls.",
      "warn",
    ),
  },
  {
    id: "AR-04",
    name: "Retry with backoff",
    category: "Resilience",
    severity: "medium",
    description: "Transient failures are retried with bounded exponential backoff.",
    run: presence(
      [/retr(y|ies)/i, /backoff/i, /tenacity/i, /p-retry/],
      "Retry logic present.",
      "No retry/backoff strategy for transient failures.",
      "warn",
    ),
  },
  {
    id: "AR-05",
    name: "Error handling",
    category: "Resilience",
    severity: "critical",
    description: "Exceptions from model and tool calls are caught and handled rather than crashing the run.",
    run: presence(
      [/\btry\s*[:{]/, /\bcatch\s*\(/, /\bexcept\b/, /\.catch\(/, /rescue\b/],
      "Error handling blocks found.",
      "No try/catch or except blocks — a single failure crashes the agent.",
    ),
  },
  {
    id: "AR-06",
    name: "Tool schema validation",
    category: "Tools",
    severity: "high",
    description: "Tool inputs are defined with a schema (Zod, JSON Schema, Pydantic) and validated.",
    run: presence(
      [/\bz\.object/, /zod/i, /pydantic/i, /BaseModel/, /json[_\s-]?schema/i, /inputSchema/, /parameters\s*[:=]\s*\{/],
      "Tool inputs are schema-validated.",
      "Tool arguments are not schema-validated — malformed calls will slip through.",
    ),
  },
  {
    id: "AR-07",
    name: "No hardcoded secrets",
    category: "Security",
    severity: "critical",
    description: "API keys and tokens are not embedded in source code.",
    run: forbidden(
      [
        /sk-[A-Za-z0-9_-]{16,}/,
        /AKIA[0-9A-Z]{16}/,
        /ghp_[A-Za-z0-9]{20,}/,
        /(api[_-]?key|secret|token|password)\s*[:=]\s*["'][A-Za-z0-9_\-]{12,}["']/i,
      ],
      "Hardcoded credential detected — rotate it and move it to an environment variable.",
      "No hardcoded credentials found.",
    ),
  },
  {
    id: "AR-08",
    name: "Secrets from environment",
    category: "Security",
    severity: "medium",
    description: "Credentials are loaded from environment variables or a secrets manager.",
    run: presence(
      [/process\.env/, /os\.environ/, /os\.getenv/, /import\.meta\.env/, /Deno\.env/, /dotenv/i],
      "Configuration read from the environment.",
      "No environment-based configuration detected.",
      "warn",
    ),
  },
  {
    id: "AR-09",
    name: "Prompt-injection guard",
    category: "Security",
    severity: "high",
    description: "Untrusted content (web pages, documents, tool output) is fenced or filtered before reaching the model.",
    run: presence(
      [/inject/i, /untrusted/i, /sanitiz/i, /guardrail/i, /moderation/i, /<untrusted>|<document>/i],
      "Injection mitigation or untrusted-content handling found.",
      "No prompt-injection defenses — tool or retrieved content could hijack the agent.",
    ),
  },
  {
    id: "AR-10",
    name: "Input validation",
    category: "Security",
    severity: "medium",
    description: "User input is length-checked and validated before being sent to the model.",
    run: presence(
      [/validat/i, /\.parse\(/, /max[_]?length/i, /\.length\s*>/, /len\(.+\)\s*>/],
      "User input is validated.",
      "User input is passed through without validation or length limits.",
      "warn",
    ),
  },
  {
    id: "AR-11",
    name: "Structured output",
    category: "Output",
    severity: "high",
    description: "Model responses are parsed against a schema instead of trusted as free text.",
    run: presence(
      [/response_format/, /json_schema/, /Output\.object/, /generateObject/, /structured/i, /JSON\.parse/, /json\.loads/],
      "Output is parsed/structured.",
      "Output is consumed as raw text — no structural guarantees.",
      "warn",
    ),
  },
  {
    id: "AR-12",
    name: "Logging & tracing",
    category: "Observability",
    severity: "medium",
    description: "Each step, tool call and failure is logged so runs can be replayed and debugged.",
    run: presence(
      [/logger/i, /logging\./, /console\.(log|info|error)/, /trace/i, /langsmith|langfuse|opentelemetry|otel/i],
      "Logging/tracing present.",
      "No logging or tracing — failures will be invisible.",
      "warn",
    ),
  },
  {
    id: "AR-13",
    name: "Token & cost tracking",
    category: "Observability",
    severity: "medium",
    description: "Token usage is captured per call so cost per task can be measured.",
    run: presence(
      [/usage/i, /tokens?_?(used|count)/i, /prompt_tokens|completion_tokens|inputTokens|outputTokens/, /cost/i],
      "Token usage is recorded.",
      "Token usage is not tracked — you cannot measure cost per run.",
      "warn",
    ),
  },
  {
    id: "AR-14",
    name: "Rate-limit handling",
    category: "Resilience",
    severity: "medium",
    description: "HTTP 429 / rate-limit responses are detected and handled.",
    run: presence(
      [/\b429\b/, /rate[_\s-]?limit/i, /RateLimitError/, /Retry-After/i],
      "Rate-limit responses handled.",
      "No handling for rate-limit (429) responses.",
      "warn",
    ),
  },
  {
    id: "AR-15",
    name: "Human approval for risky tools",
    category: "Tools",
    severity: "high",
    description: "Destructive actions (delete, send, pay, deploy) require confirmation.",
    run: (src) => {
      const risky = findAll(src, [/\b(delete|drop|send_?email|transfer|payment|deploy|rm\s+-rf|shutdown)\b/i]);
      const approval = findAll(src, [/approv/i, /confirm/i, /human[_\s-]?in[_\s-]?the[_\s-]?loop/i, /needsApproval/]);
      if (!risky.length)
        return { status: "pass", message: "No destructive tools detected.", evidence: [] };
      if (approval.length)
        return { status: "pass", message: "Destructive actions are gated by approval.", evidence: approval };
      return {
        status: "fail",
        message: "Destructive actions found with no human approval step.",
        evidence: risky,
      };
    },
  },
  {
    id: "AR-16",
    name: "No arbitrary code execution",
    category: "Security",
    severity: "critical",
    description: "The agent does not pass model output into eval, exec or an unsandboxed shell.",
    run: forbidden(
      [/\beval\s*\(/, /\bexec\s*\(/, /new Function\s*\(/, /subprocess\.(run|call|Popen)\(.*shell\s*=\s*True/, /os\.system\(/, /child_process/],
      "Dynamic code execution found — model output could run arbitrary code.",
      "No eval/exec/shell execution detected.",
    ),
  },
  {
    id: "AR-17",
    name: "Context window management",
    category: "Memory",
    severity: "medium",
    description: "Conversation history is truncated or summarized to stay within the context window.",
    run: presence(
      [/truncat/i, /summari[sz]/i, /context[_\s-]?window/i, /max[_]?(history|messages|context)/i, /\.slice\(-\d+\)/, /\[-\d+:\]/],
      "History is bounded or summarized.",
      "History grows unbounded — long sessions will overflow context.",
      "warn",
    ),
  },
  {
    id: "AR-18",
    name: "Reproducible settings",
    category: "Determinism",
    severity: "low",
    description: "Model, temperature or seed are pinned so runs are comparable across evaluations.",
    run: presence(
      [/temperature/i, /\bseed\b/i, /model\s*[:=]\s*["'][\w./-]+["']/i],
      "Model/sampling settings are pinned.",
      "Model and sampling settings are implicit — results won't be reproducible.",
      "warn",
    ),
  },
  {
    id: "AR-19",
    name: "Evaluation tests present",
    category: "Testing",
    severity: "high",
    description: "Code includes tests, assertions or eval cases with expected outcomes.",
    run: presence(
      [/\bassert\b/, /\bexpect\(/, /\bdescribe\(|\bit\(|\btest\(/, /def test_/, /pytest|vitest|jest/i, /expected[_\s]?(output|outcome)/i],
      "Tests or assertions found.",
      "No tests or expected outcomes — reliability is assumed, not measured.",
    ),
  },
  {
    id: "AR-20",
    name: "Fallback strategy",
    category: "Resilience",
    severity: "low",
    description: "A fallback model, cached answer or graceful message is used when the primary path fails.",
    run: presence(
      [/fallback/i, /graceful/i, /default[_\s]?response/i, /backup[_\s]?model/i],
      "Fallback path defined.",
      "No fallback — users get a hard failure when the model is down.",
      "warn",
    ),
  },
  {
    id: "AR-21",
    name: "PII protection",
    category: "Privacy",
    severity: "medium",
    description: "Personal data is redacted or masked before it is logged or sent to third parties.",
    run: presence(
      [/\bpii\b/i, /redact/i, /mask/i, /anonymi[sz]/i, /presidio/i],
      "PII redaction present.",
      "No PII redaction — personal data may leak into logs or prompts.",
      "warn",
    ),
  },
  {
    id: "AR-22",
    name: "Cancellation support",
    category: "Control flow",
    severity: "low",
    description: "Long-running runs can be cancelled by the user (abort signals, stop events).",
    run: presence(
      [/AbortController/, /abortSignal|signal\s*:/, /cancel/i, /KeyboardInterrupt/, /stop_event/i],
      "Runs can be cancelled.",
      "Runs cannot be stopped once started.",
      "warn",
    ),
  },
];

export const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function score(results: CheckResult[]) {
  let total = 0;
  let got = 0;
  for (const r of results) {
    const w = SEVERITY_WEIGHT[r.severity];
    total += w;
    got += r.status === "pass" ? w : r.status === "warn" ? w * 0.5 : 0;
  }
  return total ? Math.round((got / total) * 100) : 0;
}

export function verdict(results: CheckResult[], s: number) {
  const criticalFail = results.some((r) => r.status === "fail" && r.severity === "critical");
  if (criticalFail) return { label: "Not reliable", tone: "fail" as const };
  if (s >= 80) return { label: "Production ready", tone: "pass" as const };
  if (s >= 55) return { label: "Needs hardening", tone: "warn" as const };
  return { label: "Not reliable", tone: "fail" as const };
}

export const SAMPLE_AGENT = `import os
from openai import OpenAI

client = OpenAI(api_key="sk-live-9f8a7b6c5d4e3f2a1b0c")

SYSTEM_PROMPT = "You are a support agent. Answer billing questions only."

def run_agent(user_input):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.append({"role": "user", "content": user_input})
    while True:
        resp = client.chat.completions.create(model="gpt-4o", messages=messages)
        msg = resp.choices[0].message
        if msg.tool_calls:
            for call in msg.tool_calls:
                if call.function.name == "delete_account":
                    delete_account(call.function.arguments)
                result = eval(call.function.arguments)
                messages.append({"role": "tool", "content": str(result)})
        else:
            print(msg.content)
            return msg.content
`;

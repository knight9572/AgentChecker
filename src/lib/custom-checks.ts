import { findAll, type CheckResult, type Severity } from "./checks";

export interface CustomCheck {
  id: string;
  name: string;
  description: string;
  mode: "must-contain" | "must-not-contain";
  pattern: string;
  severity: Severity;
}

const KEY = "arh.custom-checks.v1";

export function loadCustom(): CustomCheck[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCustom(list: CustomCheck[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function runCustom(c: CustomCheck, src: string): CheckResult {
  let re: RegExp;
  try {
    re = new RegExp(c.pattern, "i");
  } catch {
    return {
      ...base(c),
      status: "warn",
      message: "Invalid pattern — fix the regular expression.",
      evidence: [],
    };
  }
  const ev = findAll(src, [re], 5);
  const found = ev.length > 0;
  const pass = c.mode === "must-contain" ? found : !found;
  return {
    ...base(c),
    status: pass ? "pass" : "fail",
    message: pass
      ? c.mode === "must-contain"
        ? "Required pattern found."
        : "Forbidden pattern absent."
      : c.mode === "must-contain"
        ? "Required pattern missing."
        : "Forbidden pattern present.",
    evidence: ev,
  };
}

function base(c: CustomCheck) {
  return {
    id: c.id,
    name: c.name,
    category: "Custom",
    severity: c.severity,
    description: c.description || `${c.mode === "must-contain" ? "Must contain" : "Must not contain"} /${c.pattern}/`,
    custom: true,
  };
}

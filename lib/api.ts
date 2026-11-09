/**
 * Thin read-only client for the a16z speedrun talent network API.
 * https://speedrun-talent-network.com/api/v1 — no auth, open CORS, edge cached.
 *
 * Every call carries ?source=still-open so the talent team can attribute
 * traffic this tool sends back to their board.
 */

const BASE = "https://speedrun-talent-network.com/api/v1";
export const SOURCE = "still-open";

export type JobSummary = {
  id: string;
  title: string;
  company: string;
  company_slug: string;
  company_url: string;
  url: string;
  location: string | null;
  workplace_type: string | null;
  employment_type: string | null;
  function: string | null;
  seniority: string | null;
  remote: boolean;
  comp_min: number | null;
  comp_max: number | null;
  comp_currency: string | null;
  published_at: string | null;
  stealth: boolean;
  cohort: string | null;
  tier: string | null;
};

/** A closed role keeps only id/title/company/url; apply and description go null. */
export type JobDetail = JobSummary & {
  status: "open" | "closed";
  comp_summary: string | null;
  description_text: string | null;
  apply: { kind: string; url: string } | null;
};

export type Facet = { v: string; n: number };

export type JobSearch = {
  jobs: JobSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  facets: Record<string, Facet[]>;
};

export type SearchParams = {
  q?: string;
  fn?: string;
  wp?: "remote" | "hybrid" | "onsite";
  sen?: string;
  posted?: "24h" | "7d" | "30d";
  scope?: "speedrun" | "portfolio" | "everywhere";
  page?: number;
};

function url(path: string, params: Record<string, string | number | undefined>) {
  const u = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") u.searchParams.set(k, String(v));
  }
  u.searchParams.set("source", SOURCE);
  return u.toString();
}

async function get<T>(target: string): Promise<T> {
  const res = await fetch(target, { headers: { accept: "application/json" } });
  if (!res.ok) {
    let message = `request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      // non-JSON error body, keep the status message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function searchJobs(params: SearchParams) {
  return get<JobSearch>(url("/jobs", { ...params, page_size: 25 }));
}

export async function getJob(id: string) {
  const body = await get<{ job: JobDetail }>(url(`/jobs/${id}`, {}));
  return body.job;
}

/** Canonical board link, tagged so clicks from this tool are attributable. */
export function boardLink(jobUrl: string) {
  try {
    const u = new URL(jobUrl);
    u.searchParams.set("utm_source", SOURCE);
    u.searchParams.set("utm_medium", "agent");
    return u.toString();
  } catch {
    return jobUrl;
  }
}

export function formatComp(job: {
  comp_min: number | null;
  comp_max: number | null;
  comp_currency?: string | null;
}) {
  const { comp_min, comp_max } = job;
  if (!comp_min && !comp_max) return null;
  const k = (n: number) => `$${Math.round(n / 1000)}k`;
  if (comp_min && comp_max) {
    return comp_min === comp_max ? k(comp_min) : `${k(comp_min)}–${k(comp_max)}`;
  }
  return k((comp_min ?? comp_max) as number);
}

/**
 * Tracked roles live in the browser. No accounts, no server, nothing leaves
 * the device. Every read and write tolerates blocked or cleared site data.
 */

import type { JobDetail, JobSummary } from "./api";

const KEY = "still-open:tracked:v1";

export type Status = "open" | "closed" | "unknown";

export type Tracked = {
  id: string;
  title: string;
  company: string;
  url: string;
  location: string | null;
  comp_min: number | null;
  comp_max: number | null;
  workplace_type: string | null;
  addedAt: string;
  appliedAt: string | null;
  status: Status;
  lastChecked: string | null;
  applyUrl: string | null;
};

export function fromSummary(job: JobSummary): Tracked {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    url: job.url,
    location: job.location,
    comp_min: job.comp_min,
    comp_max: job.comp_max,
    workplace_type: job.workplace_type,
    addedAt: new Date().toISOString(),
    appliedAt: null,
    status: "unknown",
    lastChecked: null,
    applyUrl: null,
  };
}

export function applyDetail(entry: Tracked, detail: JobDetail): Tracked {
  return {
    ...entry,
    status: detail.status,
    lastChecked: new Date().toISOString(),
    applyUrl: detail.apply?.url ?? entry.applyUrl,
    // A closed role nulls out its own fields, so keep what we already had.
    location: detail.location ?? entry.location,
    comp_min: detail.comp_min ?? entry.comp_min,
    comp_max: detail.comp_max ?? entry.comp_max,
  };
}

export function load(): Tracked[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Tracked[]) : [];
  } catch {
    return [];
  }
}

export function save(entries: Tracked[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Private window or blocked storage. The list still works for this session.
  }
}

export function daysSince(iso: string | null) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function relativeTime(iso: string | null) {
  if (!iso) return "never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

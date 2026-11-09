"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  boardLink,
  formatComp,
  getJob,
  searchJobs,
  type JobSummary,
} from "@/lib/api";
import {
  applyDetail,
  daysSince,
  fromSummary,
  load,
  relativeTime,
  save,
  type Tracked,
} from "@/lib/store";

const FUNCTIONS = [
  ["", "any function"],
  ["engineering", "engineering"],
  ["data", "data"],
  ["product", "product"],
  ["design", "design"],
  ["operations", "operations"],
  ["research", "research"],
  ["sales", "sales"],
  ["marketing", "marketing"],
] as const;

const WORKPLACES = [
  ["", "anywhere"],
  ["remote", "remote"],
  ["hybrid", "hybrid"],
  ["onsite", "onsite"],
] as const;

/** Re-check in small batches so a long list does not open 40 sockets at once. */
async function inBatches<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>,
) {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

export default function Home() {
  const [tracked, setTracked] = useState<Tracked[]>([]);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [q, setQ] = useState("");
  const [fn, setFn] = useState("engineering");
  const [wp, setWp] = useState("remote");
  const [results, setResults] = useState<JobSummary[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const didInitialCheck = useRef(false);

  useEffect(() => {
    setTracked(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save(tracked);
  }, [tracked, ready]);

  const recheck = useCallback(async (entries: Tracked[]) => {
    if (entries.length === 0) return;
    setChecking(true);
    setError(null);
    try {
      const checked = await inBatches(entries, 4, async (entry) => {
        try {
          return applyDetail(entry, await getJob(entry.id));
        } catch {
          return { ...entry, lastChecked: new Date().toISOString() };
        }
      });
      const byId = new Map(checked.map((e) => [e.id, e]));
      setTracked((current) => current.map((e) => byId.get(e.id) ?? e));
    } finally {
      setChecking(false);
    }
  }, []);

  // One pass on load so the numbers are true the moment the page is open.
  useEffect(() => {
    if (!ready || didInitialCheck.current) return;
    didInitialCheck.current = true;
    const entries = load();
    if (entries.length) void recheck(entries);
  }, [ready, recheck]);

  const runSearch = useCallback(async () => {
    setSearching(true);
    setError(null);
    try {
      const data = await searchJobs({
        q: q.trim() || undefined,
        fn: fn || undefined,
        wp: (wp || undefined) as "remote" | "hybrid" | "onsite" | undefined,
      });
      setResults(data.jobs);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "search failed");
      setResults([]);
      setTotal(null);
    } finally {
      setSearching(false);
    }
  }, [q, fn, wp]);

  useEffect(() => {
    if (panelOpen && results.length === 0 && !searching) void runSearch();
    // Only fires when the panel first opens; runSearch is stable per filter set.
  }, [panelOpen, results.length, searching, runSearch]);

  const trackedIds = useMemo(
    () => new Set(tracked.map((t) => t.id)),
    [tracked],
  );

  function track(job: JobSummary) {
    const entry = fromSummary(job);
    setTracked((current) => [entry, ...current]);
    void recheck([entry]);
  }

  function untrack(id: string) {
    setTracked((current) => current.filter((e) => e.id !== id));
  }

  function toggleApplied(id: string) {
    setTracked((current) =>
      current.map((e) =>
        e.id === id
          ? { ...e, appliedAt: e.appliedAt ? null : new Date().toISOString() }
          : e,
      ),
    );
  }

  async function loadSample() {
    setError(null);
    try {
      const data = await searchJobs({ fn: "engineering", wp: "remote" });
      const picks = data.jobs.slice(0, 4).map(fromSummary);
      setTracked(picks);
      void recheck(picks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not reach the board");
    }
  }

  const closed = tracked.filter((t) => t.status === "closed");
  const open = tracked.filter((t) => t.status === "open");
  const lastChecked = tracked.reduce<string | null>(
    (latest, t) =>
      t.lastChecked && (!latest || t.lastChecked > latest) ? t.lastChecked : latest,
    null,
  );

  return (
    <div className="shell">
      <header className="masthead">
        <h1 className="wordmark">
          still_open<em>()</em>
        </h1>
        <p className="tagline">
          You applied. Then nothing. <strong>Some of those roles are already closed</strong>{" "}
          and nobody told you. This checks, every time you open it.
        </p>
      </header>

      <dl className="band">
        <div className="tile">
          <dt>tracking</dt>
          <dd>{tracked.length}</dd>
        </div>
        <div className="tile is-open">
          <dt>still open</dt>
          <dd>{open.length}</dd>
        </div>
        <div className="tile is-dead">
          <dt>closed</dt>
          <dd>{closed.length}</dd>
        </div>
      </dl>

      {closed.length > 0 && (
        <p className="verdict">
          <b>
            {closed.length} of your {tracked.length}
          </b>{" "}
          tracked {tracked.length === 1 ? "role" : "roles"}{" "}
          {closed.length === 1 ? "is" : "are"} no longer open. Stop waiting on{" "}
          {closed.length === 1 ? "it" : "them"}.
        </p>
      )}

      <div className="toolbar">
        <button
          className="btn primary"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
        >
          {panelOpen ? "close" : "+ add roles"}
        </button>
        <button
          className="btn"
          onClick={() => void recheck(tracked)}
          disabled={checking || tracked.length === 0}
        >
          {checking ? "checking…" : "re-check all"}
        </button>
        <span className="spacer" />
        <span className="checked">last checked {relativeTime(lastChecked)}</span>
      </div>

      {panelOpen && (
        <div className="panel">
          <form
            className="filters"
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch();
            }}
          >
            <input
              id="q"
              type="search"
              placeholder="title or keyword"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search by title or keyword"
            />
            <select
              id="fn"
              value={fn}
              onChange={(e) => setFn(e.target.value)}
              aria-label="Function"
            >
              {FUNCTIONS.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            <select
              id="wp"
              value={wp}
              onChange={(e) => setWp(e.target.value)}
              aria-label="Workplace type"
            >
              {WORKPLACES.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            <button className="btn" type="submit" disabled={searching}>
              {searching ? "…" : "search"}
            </button>
          </form>

          {results.length > 0 && (
            <ul className="results">
              {results.map((job) => {
                const comp = formatComp(job);
                return (
                  <li key={job.id}>
                    <span className="meta">
                      <span className="name">{job.title}</span>
                      <span className="sub">
                        {job.company}
                        {job.location ? ` · ${job.location}` : ""}
                        {comp ? ` · ${comp}` : ""}
                      </span>
                    </span>
                    <button
                      className="btn"
                      onClick={() => track(job)}
                      disabled={trackedIds.has(job.id)}
                    >
                      {trackedIds.has(job.id) ? "tracking" : "track"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {total !== null && (
            <p className="hint">
              {total.toLocaleString()} live roles match. Showing the first{" "}
              {results.length}. Data from the a16z speedrun talent network.
            </p>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      )}

      <p className="section-label">your_applications</p>

      {!ready ? null : tracked.length === 0 ? (
        <div className="empty">
          <h2>Nothing tracked yet</h2>
          <p>
            Add the roles you have applied to. Every time you open this page it
            asks the board whether each one is still live.
          </p>
          <button className="btn primary" onClick={() => void loadSample()}>
            load four real remote roles
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <ul className="rows">
          {tracked.map((entry) => {
            const comp = formatComp(entry);
            const waited = daysSince(entry.appliedAt ?? entry.addedAt);
            const isDead = entry.status === "closed";
            return (
              <li key={entry.id} className={`row${isDead ? " dead" : ""}`}>
                <div>
                  <p className="title">{entry.title}</p>
                  <p className="company">
                    <span>{entry.company}</span>
                    {entry.location && <span>{entry.location}</span>}
                    {comp && <span>{comp}</span>}
                  </p>
                </div>

                <div className="side">
                  <span className={`pill ${entry.status}`}>
                    {entry.status === "unknown" ? "unchecked" : entry.status}
                  </span>
                  <span className="waited">
                    {entry.appliedAt ? "applied" : "added"} {waited}d ago
                  </span>
                  <span className="acts">
                    <button
                      className="btn ghost"
                      onClick={() => toggleApplied(entry.id)}
                    >
                      {entry.appliedAt ? "not applied" : "mark applied"}
                    </button>
                    <a
                      className="btn ghost"
                      href={entry.applyUrl ?? boardLink(entry.url)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {isDead ? "view" : "apply"}
                    </a>
                    <button
                      className="btn ghost"
                      onClick={() => untrack(entry.id)}
                      aria-label={`Remove ${entry.title}`}
                    >
                      remove
                    </button>
                  </span>
                </div>

                {isDead && (
                  <p className="dead-note">
                    Closed. The posting is gone, so no reply is coming.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <footer className="foot">
        <p>
          Built on the{" "}
          <a
            href="https://speedrun-talent-network.com/developers"
            target="_blank"
            rel="noreferrer"
          >
            a16z speedrun talent network API
          </a>
          . Read-only, no auth, <code>?source=still-open</code> on every call so
          clicks back to the board are attributable. Your list stays in your own
          browser. Nothing is uploaded, no account, no tracking.
        </p>
      </footer>
    </div>
  );
}

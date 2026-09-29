"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
type Check = {
  id: string;
  healthy: boolean;
  checkedAt: string;
  statusCode: number | null;
  responseTimeMs: number;
  error: string | null;
  emailStatus: string;
};
type Monitor = {
  id: string;
  url: string;
  email: string;
  paused: boolean;
  nextCheckAt: string;
  latestCheck: Check | null;
};
async function api<T>(path = "", method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api/monitors${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.errors
        ? Object.values(error.errors).flat().join(" ")
        : (error.title ?? `Request failed (${response.status})`),
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
function Status({ check }: { check: Check | null }) {
  return (
    <span
      className={`badge ${check ? (check.healthy ? "healthy" : "unhealthy") : "pending"}`}
    >
      {check ? (check.healthy ? "Healthy" : "Unhealthy") : "Awaiting check"}
    </span>
  );
}
export default function Dashboard({ id }: { id?: string }) {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [history, setHistory] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    if (id) {
      const [monitor, checks] = await Promise.all([
        api<Monitor>(`/${id}`),
        api<Check[]>(`/${id}/checks`),
      ]);
      setMonitors([monitor]);
      setHistory(checks);
    } else setMonitors(await api<Monitor[]>());
  }, [id]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await refresh();
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [refresh]);
  async function action(
    key: string,
    work: () => Promise<unknown>,
    success: string,
  ) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await work();
      await refresh();
      setNotice(success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await action(
      "create",
      async () => {
        await api("", "POST", {
          url: data.get("url"),
          email: data.get("email"),
        });
        form.reset();
      },
      "Monitor created. See the first result and email status below.",
    );
  }
  const healthy = monitors.filter((m) => m.latestCheck?.healthy).length;
  return (
    <>
      <section className="intro">
        <p className="eyebrow">A LITTLE PEACE OF MIND</p>
        <h1>{id ? "Check history" : "Know when your website needs you."}</h1>
        <p className="muted">
          {id
            ? "Every check, response time, and email outcome in one place."
            : "Add a website. We’ll check its pulse and send the result to your inbox."}
        </p>
      </section>
      {id ? (
        <Link className="back" href="/">
          ← All monitors
        </Link>
      ) : (
        <>
          <div className="stats">
            <div>
              <strong>{monitors.length}</strong>
              <span>Monitored websites</span>
            </div>
            <div>
              <strong>{healthy}</strong>
              <span>Healthy now</span>
            </div>
            <div>
              <strong>5 min</strong>
              <span>Check interval</span>
            </div>
          </div>
          <section className="panel">
            <h2>Add a website</h2>
            <form onSubmit={create}>
              <label>
                Website URL
                <input
                  name="url"
                  type="url"
                  placeholder="https://example.com"
                  required
                  maxLength={2048}
                />
              </label>
              <label>
                Result email
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  maxLength={254}
                />
              </label>
              <button disabled={busy !== null}>
                {busy === "create" ? "Checking website…" : "Start monitoring"}
              </button>
            </form>
            <p className="hint">
              Try <code>http://demo-target:8080/healthy</code> with the demo
              profile. Messages stay in Mailpit.
            </p>
          </section>
        </>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <section className="panel">
        <div className="section-title">
          <h2>{id ? "Website" : "Your websites"}</h2>
          <span className="muted">Refreshes every 5 seconds</span>
        </div>
        {loading ? (
          <p role="status">Loading monitors…</p>
        ) : monitors.length === 0 ? (
          <div className="empty">
            <span>◎</span>
            <h3>Your first monitor starts here</h3>
            <p>Add a website above to see its health and check history.</p>
          </div>
        ) : (
          monitors.map((m) => (
            <article className="monitor" key={m.id}>
              <div className="monitor-info">
                <Link href={`/monitors/${m.id}`} className="site">
                  {m.url}
                </Link>
                <p className="muted">{m.email}</p>
                <p className="hint">
                  {m.paused
                    ? "Scheduled checks paused"
                    : `Next check: ${new Date(m.nextCheckAt).toLocaleString()}`}
                </p>
              </div>
              <div className="result">
                <Status check={m.latestCheck} />
                <p>
                  {m.latestCheck
                    ? `${m.latestCheck.responseTimeMs} ms · Email ${m.latestCheck.emailStatus.toLowerCase()}`
                    : "No result yet"}
                </p>
              </div>
              <div className="actions">
                <button
                  disabled={busy !== null}
                  onClick={() =>
                    action(
                      m.id,
                      () => api(`/${m.id}/checks`, "POST"),
                      "Check complete. See the result and email status.",
                    )
                  }
                >
                  {busy === m.id ? "Working…" : "Check now"}
                </button>
                <button
                  className="secondary"
                  disabled={busy !== null}
                  onClick={() =>
                    action(
                      m.id,
                      () => api(`/${m.id}`, "PATCH", { paused: !m.paused }),
                      m.paused ? "Monitoring resumed." : "Monitoring paused.",
                    )
                  }
                >
                  {m.paused ? "Resume" : "Pause"}
                </button>
                <button
                  className="danger"
                  disabled={busy !== null}
                  onClick={() => {
                    if (confirm("Delete this monitor and its history?"))
                      void action(
                        m.id,
                        async () => {
                          await api(`/${m.id}`, "DELETE");
                          if (id) window.location.assign("/");
                        },
                        "Monitor deleted.",
                      );
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>
      {id && (
        <section className="panel">
          <h2>Latest 50 checks</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Health</th>
                  <th>HTTP</th>
                  <th>Response</th>
                  <th>Email</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {history.map((c) => (
                  <tr key={c.id}>
                    <td>{new Date(c.checkedAt).toLocaleString()}</td>
                    <td>
                      <Status check={c} />
                    </td>
                    <td>{c.statusCode ?? "—"}</td>
                    <td>{c.responseTimeMs} ms</td>
                    <td>{c.emailStatus}</td>
                    <td>{c.error ?? "OK"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

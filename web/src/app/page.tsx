"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Book = {
  id: number;
  title: string;
  author: string | null;
  status: string;
  genre: string | null;
  subgenre: string | null;
  language: string | null;
  pages: number | null;
  purchase_year: number | null;
  publisher: string | null;
  purchase_location: string | null;
  rating: number | null;
  notes: string | null;
  is_owned: number | null;
  is_nonfiction: number | null;
};

type Dashboard = {
  kpis: Record<string, number>;
  by_genre: { label: string; value: number }[];
  top_authors: { label: string; value: number }[];
  by_status: { label: string; value: number }[];
  top_subgenres: { label: string; value: number }[];
  pages_by_status: { label: string; value: number }[];
  completed_by_year: { label: number; value: number }[];
  ownership_split: { label: string; value: number }[];
  nonfiction_split: { label: string; value: number }[];
  top_publishers: { label: string; value: number }[];
};

type Filters = { statuses: string[]; genres: string[]; languages: string[] };

type FormState = {
  title: string;
  author: string;
  status: string;
  genre: string;
  subgenre: string;
  language: string;
  pages: string;
  purchase_year: string;
  publisher: string;
  purchase_location: string;
  rating: string;
  notes: string;
  is_owned: "" | "true" | "false";
  is_nonfiction: "" | "true" | "false";
};

const emptyForm: FormState = {
  title: "",
  author: "",
  status: "Not Started",
  genre: "",
  subgenre: "",
  language: "",
  pages: "",
  purchase_year: "",
  publisher: "",
  purchase_location: "",
  rating: "",
  notes: "",
  is_owned: "",
  is_nonfiction: "",
};

function boolValue(v: "" | "true" | "false") {
  if (v === "true") return true;
  if (v === "false") return false;
  return "";
}

function BarList({ data, valueFormatter }: { data: { label: string | number; value: number }[]; valueFormatter?: (v: number) => string | number }) {
  const max = useMemo(() => Math.max(1, ...data.map((x) => Number(x.value || 0))), [data]);
  if (!data.length) return <div className="meta">No data</div>;

  return (
    <div className="bars">
      {data.map((d) => {
        const pct = Math.max(2, Math.round((Number(d.value || 0) / max) * 100));
        return (
          <div key={String(d.label)} className="barRow">
            <div>
              <div className="barLabel">{String(d.label)}</div>
              <div className="bar" style={{ width: `${pct}%` }} />
            </div>
            <strong>{valueFormatter ? valueFormatter(Number(d.value || 0)) : d.value}</strong>
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [filters, setFilters] = useState<Filters>({ statuses: [], genres: [], languages: [] });
  const [query, setQuery] = useState({ search: "", status: "", genre: "", language: "" });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data as T;
  }

  async function loadBooks() {
    const params = new URLSearchParams({ ...query, page: "1", page_size: "100", sort: "title", order: "asc" });
    const data = await fetchJson<{ items: Book[]; total: number }>(`/api/books?${params.toString()}`);
    setBooks(data.items);
    setTotal(data.total);
  }

  async function loadDashboard() {
    const data = await fetchJson<Dashboard>("/api/dashboard");
    setDashboard(data);
  }

  async function loadFilters() {
    const data = await fetchJson<Filters>("/api/filters");
    setFilters(data);
  }

  async function refreshAll() {
    try {
      setError("");
      await Promise.all([loadBooks(), loadFilters(), loadDashboard()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBooks().catch((err) => setError(err instanceof Error ? err.message : "Failed to load books"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.status, query.genre, query.language]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      is_owned: boolValue(form.is_owned),
      is_nonfiction: boolValue(form.is_nonfiction),
    };

    try {
      if (editingId) {
        await fetchJson(`/api/books/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await fetchJson("/api/books", { method: "POST", body: JSON.stringify(payload) });
      }
      setForm(emptyForm);
      setEditingId(null);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  function startEdit(b: Book) {
    setEditingId(b.id);
    setForm({
      title: b.title || "",
      author: b.author || "",
      status: b.status || "Not Started",
      genre: b.genre || "",
      subgenre: b.subgenre || "",
      language: b.language || "",
      pages: b.pages?.toString() || "",
      purchase_year: b.purchase_year?.toString() || "",
      publisher: b.publisher || "",
      purchase_location: b.purchase_location || "",
      rating: b.rating?.toString() || "",
      notes: b.notes || "",
      is_owned: b.is_owned === 1 ? "true" : b.is_owned === 0 ? "false" : "",
      is_nonfiction: b.is_nonfiction === 1 ? "true" : b.is_nonfiction === 0 ? "false" : "",
    });
  }

  async function removeBook(id: number) {
    if (!window.confirm("Delete this book?")) return;
    try {
      await fetchJson(`/api/books/${id}`, { method: "DELETE" });
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <>
      <header className="siteHeader">
        <h1>Library Tracker (Next.js)</h1>
        <p>Single-user local app, cloud-ready architecture</p>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Dashboard</h2>
          {!dashboard ? (
            <p className="meta">Loading...</p>
          ) : (
            <>
              <div className="kpis">
                {[
                  ["Total", dashboard.kpis.total_books],
                  ["Finished", dashboard.kpis.finished_books],
                  ["Reading", dashboard.kpis.reading_books],
                  ["Paused", dashboard.kpis.paused_books],
                  ["DNF", dashboard.kpis.dnf_books],
                  ["Not Started", dashboard.kpis.not_started_books],
                  ["Read %", `${dashboard.kpis.read_ratio}%`],
                  ["Avg Pages", dashboard.kpis.avg_pages],
                ].map(([k, v]) => (
                  <div className="kpi" key={String(k)}>
                    <div className="kpiLabel">{k}</div>
                    <div className="kpiValue">{String(v)}</div>
                  </div>
                ))}
              </div>

              <div className="charts">
                <div><h3>Top Genres</h3><BarList data={dashboard.by_genre} /></div>
                <div><h3>Top Authors</h3><BarList data={dashboard.top_authors} /></div>
                <div><h3>Status Distribution</h3><BarList data={dashboard.by_status} /></div>
                <div><h3>Top Subgenres</h3><BarList data={dashboard.top_subgenres} /></div>
                <div><h3>Average Pages by Status</h3><BarList data={dashboard.pages_by_status} /></div>
                <div><h3>Completion Rate by Purchase Year</h3><BarList data={dashboard.completed_by_year} valueFormatter={(v) => `${v}%`} /></div>
                <div><h3>Owned vs Not Owned</h3><BarList data={dashboard.ownership_split} /></div>
                <div><h3>Fiction vs Nonfiction</h3><BarList data={dashboard.nonfiction_split} /></div>
                <div><h3>Top Publishers</h3><BarList data={dashboard.top_publishers} /></div>
              </div>
            </>
          )}
        </section>

        <section className="panel">
          <h2>Library</h2>
          <div className="toolbar">
            <input placeholder="Search title or author" value={query.search} onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value }))} />
            <select value={query.status} onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value }))}>
              <option value="">All statuses</option>
              {filters.statuses.map((x) => <option key={x}>{x}</option>)}
            </select>
            <select value={query.genre} onChange={(e) => setQuery((q) => ({ ...q, genre: e.target.value }))}>
              <option value="">All genres</option>
              {filters.genres.map((x) => <option key={x}>{x}</option>)}
            </select>
            <select value={query.language} onChange={(e) => setQuery((q) => ({ ...q, language: e.target.value }))}>
              <option value="">All languages</option>
              {filters.languages.map((x) => <option key={x}>{x}</option>)}
            </select>
            <button onClick={refreshAll}>Refresh</button>
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Genre</th>
                  <th>Language</th>
                  <th>Year</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id}>
                    <td>{b.title}</td>
                    <td>{b.author ?? ""}</td>
                    <td>{b.status}</td>
                    <td>{b.genre ?? ""}</td>
                    <td>{b.language ?? ""}</td>
                    <td>{b.purchase_year ?? ""}</td>
                    <td>
                      <button onClick={() => startEdit(b)}>Edit</button>
                      <button onClick={() => removeBook(b.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="meta">{total} books</p>
        </section>

        <section className="panel">
          <h2>{editingId ? "Edit Book" : "Add Book"}</h2>
          <form className="formGrid" onSubmit={onSubmit}>
            <label className="label">Title <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></label>
            <label className="label">Author <input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} /></label>
            <label className="label">Status
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option>Not Started</option>
                <option>Reading</option>
                <option>Paused</option>
                <option>Finished</option>
                <option>DNF</option>
              </select>
            </label>
            <label className="label">Genre <input value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))} /></label>
            <label className="label">Subgenre <input value={form.subgenre} onChange={(e) => setForm((f) => ({ ...f, subgenre: e.target.value }))} /></label>
            <label className="label">Language <input value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} /></label>
            <label className="label">Pages <input type="number" min={1} value={form.pages} onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value }))} /></label>
            <label className="label">Purchase Year <input type="number" value={form.purchase_year} onChange={(e) => setForm((f) => ({ ...f, purchase_year: e.target.value }))} /></label>
            <label className="label">Publisher <input value={form.publisher} onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))} /></label>
            <label className="label">Purchase Location <input value={form.purchase_location} onChange={(e) => setForm((f) => ({ ...f, purchase_location: e.target.value }))} /></label>
            <label className="label">Rating <input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} /></label>
            <label className="label">Owned
              <select value={form.is_owned} onChange={(e) => setForm((f) => ({ ...f, is_owned: e.target.value as "" | "true" | "false" }))}>
                <option value="">Unknown</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="label">Nonfiction
              <select value={form.is_nonfiction} onChange={(e) => setForm((f) => ({ ...f, is_nonfiction: e.target.value as "" | "true" | "false" }))}>
                <option value="">Unknown</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="label full">Notes <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></label>
            <div className="actions full">
              <button type="submit">{editingId ? "Save Changes" : "Add Book"}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel Edit</button>}
            </div>
          </form>
          {error && <p className="meta">Error: {error}</p>}
        </section>
      </main>
    </>
  );
}

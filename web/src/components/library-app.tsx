"use client";

import { useEffect, useMemo, useState } from "react";

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

type ChartItem = { label: string; value: number };

type Dashboard = {
  kpis: {
    total_books: number;
    finished_books: number;
    reading_books: number;
    paused_books: number;
    not_started_books: number;
    dnf_books: number;
    read_ratio: number;
    avg_pages: number;
  };
  by_status: ChartItem[];
  by_genre: ChartItem[];
  top_authors: ChartItem[];
  top_subgenres: ChartItem[];
  top_publishers: ChartItem[];
  ownership_split: ChartItem[];
  nonfiction_split: ChartItem[];
  pages_by_status: ChartItem[];
  completed_by_year: ChartItem[];
};

type Filters = {
  statuses: string[];
  genres: string[];
  languages: string[];
};

type FormDataShape = {
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

const emptyForm: FormDataShape = {
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
  is_nonfiction: ""
};

function asBool(value: "" | "true" | "false") {
  if (value === "true") return true;
  if (value === "false") return false;
  return "";
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

function Bars({ items, valueFormatter }: { items: ChartItem[]; valueFormatter?: (n: number) => string }) {
  const max = useMemo(() => {
    if (!items.length) return 1;
    return Math.max(...items.map((i) => i.value || 0), 1);
  }, [items]);

  if (!items.length) return <div className="meta">No data</div>;

  return (
    <div className="bars">
      {items.map((item) => {
        const pct = Math.max(2, Math.round((item.value / max) * 100));
        return (
          <div className="bar-row" key={`${item.label}-${item.value}`}>
            <div>
              <div className="bar-label">{item.label}</div>
              <div className="bar" style={{ width: `${pct}%` }} />
            </div>
            <strong>{valueFormatter ? valueFormatter(item.value) : item.value}</strong>
          </div>
        );
      })}
    </div>
  );
}

export function LibraryApp() {
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>({ statuses: [], genres: [], languages: [] });
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [query, setQuery] = useState({ search: "", status: "", genre: "", language: "" });
  const [form, setForm] = useState<FormDataShape>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  async function loadBooks() {
    const params = new URLSearchParams({
      page: "1",
      page_size: "100",
      sort: "title",
      order: "asc",
      ...query
    });
    const data = await request<{ items: Book[]; total: number }>(`/api/books?${params.toString()}`);
    setBooks(data.items);
    setTotal(data.total);
  }

  async function loadFilters() {
    const data = await request<Filters>("/api/filters");
    setFilters(data);
  }

  async function loadDashboard() {
    const data = await request<Dashboard>("/api/dashboard");
    setDashboard(data);
  }

  async function refreshAll() {
    setError("");
    try {
      await Promise.all([loadBooks(), loadFilters(), loadDashboard()]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadBooks().catch((e) => setError((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.status, query.genre, query.language]);

  function setFormField<K extends keyof FormDataShape>(key: K, value: FormDataShape[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      is_owned: asBool(form.is_owned),
      is_nonfiction: asBool(form.is_nonfiction)
    };

    try {
      if (editingId) {
        await request(`/api/books/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await request("/api/books", { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      await refreshAll();
    } catch (e2) {
      setError((e2 as Error).message);
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm("Delete this book?")) return;
    try {
      await request(`/api/books/${id}`, { method: "DELETE" });
      if (editingId === id) resetForm();
      await refreshAll();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function onEdit(book: Book) {
    setEditingId(book.id);
    setForm({
      title: book.title || "",
      author: book.author || "",
      status: book.status || "Not Started",
      genre: book.genre || "",
      subgenre: book.subgenre || "",
      language: book.language || "",
      pages: book.pages?.toString() || "",
      purchase_year: book.purchase_year?.toString() || "",
      publisher: book.publisher || "",
      purchase_location: book.purchase_location || "",
      rating: book.rating?.toString() || "",
      notes: book.notes || "",
      is_owned: book.is_owned === 1 ? "true" : book.is_owned === 0 ? "false" : "",
      is_nonfiction: book.is_nonfiction === 1 ? "true" : book.is_nonfiction === 0 ? "false" : ""
    });
  }

  return (
    <>
      <header className="site-header">
        <h1>Library Tracker (Next.js)</h1>
        <p>Single-user local app with analytics and CRUD</p>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Dashboard</h2>
          <div className="kpis">
            {dashboard &&
              [
                ["Total", dashboard.kpis.total_books],
                ["Finished", dashboard.kpis.finished_books],
                ["Reading", dashboard.kpis.reading_books],
                ["Paused", dashboard.kpis.paused_books],
                ["DNF", dashboard.kpis.dnf_books],
                ["Not Started", dashboard.kpis.not_started_books],
                ["Read %", `${dashboard.kpis.read_ratio}%`],
                ["Avg Pages", dashboard.kpis.avg_pages]
              ].map(([label, value]) => (
                <div className="kpi" key={String(label)}>
                  <div className="label">{label}</div>
                  <div className="value">{value}</div>
                </div>
              ))}
          </div>

          <div className="charts">
            <div><h3>Top Genres</h3><Bars items={dashboard?.by_genre || []} /></div>
            <div><h3>Top Authors</h3><Bars items={dashboard?.top_authors || []} /></div>
            <div><h3>Status Distribution</h3><Bars items={dashboard?.by_status || []} /></div>
            <div><h3>Top Subgenres</h3><Bars items={dashboard?.top_subgenres || []} /></div>
            <div><h3>Average Pages by Status</h3><Bars items={dashboard?.pages_by_status || []} /></div>
            <div><h3>Completion Rate by Purchase Year</h3><Bars items={dashboard?.completed_by_year || []} valueFormatter={(v) => `${v}%`} /></div>
            <div><h3>Owned vs Not Owned</h3><Bars items={dashboard?.ownership_split || []} /></div>
            <div><h3>Fiction vs Nonfiction</h3><Bars items={dashboard?.nonfiction_split || []} /></div>
            <div><h3>Top Publishers</h3><Bars items={dashboard?.top_publishers || []} /></div>
          </div>
        </section>

        <section className="panel">
          <h2>Library</h2>
          <div className="toolbar">
            <input
              type="search"
              placeholder="Search title or author"
              value={query.search}
              onChange={(e) => setQuery((prev) => ({ ...prev, search: e.target.value }))}
            />
            <select value={query.status} onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="">All statuses</option>
              {filters.statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={query.genre} onChange={(e) => setQuery((prev) => ({ ...prev, genre: e.target.value }))}>
              <option value="">All genres</option>
              {filters.genres.map((g) => <option key={g}>{g}</option>)}
            </select>
            <select value={query.language} onChange={(e) => setQuery((prev) => ({ ...prev, language: e.target.value }))}>
              <option value="">All languages</option>
              {filters.languages.map((l) => <option key={l}>{l}</option>)}
            </select>
            <button onClick={() => void refreshAll()}>Refresh</button>
          </div>

          <div className="table-wrap">
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
                    <td>{b.author || ""}</td>
                    <td>{b.status || ""}</td>
                    <td>{b.genre || ""}</td>
                    <td>{b.language || ""}</td>
                    <td>{b.purchase_year || ""}</td>
                    <td>
                      <button onClick={() => onEdit(b)}>Edit</button>{" "}
                      <button className="secondary" onClick={() => void onDelete(b.id)}>Delete</button>
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
          <form className="form-grid" onSubmit={onSubmit}>
            <label>Title <input required value={form.title} onChange={(e) => setFormField("title", e.target.value)} /></label>
            <label>Author <input value={form.author} onChange={(e) => setFormField("author", e.target.value)} /></label>
            <label>Status
              <select value={form.status} onChange={(e) => setFormField("status", e.target.value)}>
                <option>Not Started</option>
                <option>Reading</option>
                <option>Paused</option>
                <option>Finished</option>
                <option>DNF</option>
              </select>
            </label>
            <label>Genre <input value={form.genre} onChange={(e) => setFormField("genre", e.target.value)} /></label>
            <label>Subgenre <input value={form.subgenre} onChange={(e) => setFormField("subgenre", e.target.value)} /></label>
            <label>Language <input value={form.language} onChange={(e) => setFormField("language", e.target.value)} /></label>
            <label>Pages <input type="number" min={1} value={form.pages} onChange={(e) => setFormField("pages", e.target.value)} /></label>
            <label>Purchase Year <input type="number" min={0} value={form.purchase_year} onChange={(e) => setFormField("purchase_year", e.target.value)} /></label>
            <label>Publisher <input value={form.publisher} onChange={(e) => setFormField("publisher", e.target.value)} /></label>
            <label>Purchase Location <input value={form.purchase_location} onChange={(e) => setFormField("purchase_location", e.target.value)} /></label>
            <label>Rating (1-5) <input type="number" min={1} max={5} value={form.rating} onChange={(e) => setFormField("rating", e.target.value)} /></label>
            <label>Owned
              <select value={form.is_owned} onChange={(e) => setFormField("is_owned", e.target.value as "" | "true" | "false")}>
                <option value="">Unknown</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label>Nonfiction
              <select value={form.is_nonfiction} onChange={(e) => setFormField("is_nonfiction", e.target.value as "" | "true" | "false")}>
                <option value="">Unknown</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="full">Notes <textarea rows={3} value={form.notes} onChange={(e) => setFormField("notes", e.target.value)} /></label>
            <div className="actions full">
              <button type="submit">{editingId ? "Save Changes" : "Add Book"}</button>
              {editingId && <button type="button" className="secondary" onClick={resetForm}>Cancel Edit</button>}
            </div>
          </form>
          {error && <p className="error">{error}</p>}
        </section>
      </main>
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Book = {
  id: number;
  title: string;
  author: string | null;
  status: string;
  genre: string | null;
  language: string | null;
  purchase_year: number | null;
};

type Filters = { statuses: string[]; genres: string[]; languages: string[] };

function statusTone(status: string) {
  if (status === "Finished") return "statusDone";
  if (status === "Reading") return "statusReading";
  if (status === "Paused") return "statusPaused";
  if (status === "DNF") return "statusDnf";
  return "statusTodo";
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filters, setFilters] = useState<Filters>({ statuses: [], genres: [], languages: [] });
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState({ search: "", status: "", genre: "", language: "" });
  const [error, setError] = useState("");

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

  async function loadFilters() {
    const data = await fetchJson<Filters>("/api/filters");
    setFilters(data);
  }

  async function refreshAll() {
    try {
      setError("");
      await Promise.all([loadBooks(), loadFilters()]);
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

  async function removeBook(id: number) {
    if (!window.confirm("Delete this book?")) return;
    try {
      await fetchJson(`/api/books/${id}`, { method: "DELETE" });
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <section id="library" className="panel">
      <div className="sectionHead">
        <h2>Library</h2>
        <p className="meta">Search, filter, and manage your collection.</p>
      </div>

      <div className="toolbar stickyTools">
        <input
          className="searchInput"
          placeholder="Search title or author"
          value={query.search}
          onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value }))}
        />
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
        <button type="button" className="ghostBtn" onClick={() => setQuery({ search: "", status: "", genre: "", language: "" })}>Clear</button>
        <button type="button" onClick={refreshAll}>Refresh</button>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.length === 0 ? (
              <tr>
                <td colSpan={7} className="meta">No books match current filters.</td>
              </tr>
            ) : (
              books.map((b) => (
                <tr key={b.id}>
                  <td>{b.title}</td>
                  <td>{b.author ?? ""}</td>
                  <td><span className={`statusPill ${statusTone(b.status)}`}>{b.status}</span></td>
                  <td>{b.genre ?? ""}</td>
                  <td>{b.language ?? ""}</td>
                  <td>{b.purchase_year ?? ""}</td>
                  <td className="actionCell">
                    <div className="actionButtons">
                      <Link className="ghostBtn" href={`/add?id=${b.id}`}>Edit</Link>
                      <button type="button" className="dangerBtn" onClick={() => removeBook(b.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="meta">{total} books</p>
      {error ? <p className="meta">Error: {error}</p> : null}
    </section>
  );
}

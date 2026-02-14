"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/http";
import { BookCard, FilterChip, GlassCard, SearchInput } from "@/components/ui/figma";

type Book = {
  id: number;
  title: string;
  author: string | null;
  status: string;
  genre: string | null;
};

type Filters = { statuses: string[]; genres: string[]; languages: string[] };

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filters, setFilters] = useState<Filters>({ statuses: [], genres: [], languages: [] });
  const [query, setQuery] = useState({ search: "", status: "", genre: "", language: "" });
  const [error, setError] = useState("");

  async function loadBooks() {
    const params = new URLSearchParams({ ...query, page: "1", page_size: "100", sort: "title", order: "asc" });
    const data = await fetchJson<{ items: Book[] }>(`/api/books?${params.toString()}`);
    setBooks(data.items);
  }

  async function loadFilters() {
    setFilters(await fetchJson<Filters>("/api/filters"));
  }

  useEffect(() => {
    Promise.all([loadBooks(), loadFilters()]).catch((e) => setError(e instanceof Error ? e.message : "Failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBooks().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.status, query.genre, query.language]);

  async function removeBook(id: number) {
    if (!window.confirm("Delete this book?")) return;
    await fetchJson(`/api/books/${id}`, { method: "DELETE" });
    await loadBooks();
  }

  const statusCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of books) m.set(b.status, (m.get(b.status) || 0) + 1);
    return m;
  }, [books]);

  return (
    <div className="fgScreen">
      <header className="fgHeader">
        <h2>Library</h2>
        <p>{books.length} books in your collection</p>
      </header>

      <GlassCard className="fgStack">
        <SearchInput
          placeholder="Search by title, author, or genre..."
          value={query.search}
          onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value }))}
        />

        <div className="fgChipRow">
          <FilterChip label="All Books" count={books.length} active={!query.status} onClick={() => setQuery((q) => ({ ...q, status: "" }))} />
          {filters.statuses.map((s) => (
            <FilterChip key={s} label={s} count={statusCounts.get(s) || 0} active={query.status === s} onClick={() => setQuery((q) => ({ ...q, status: s }))} />
          ))}
        </div>

        <div className="fgFilterRow">
          <select value={query.genre} onChange={(e) => setQuery((q) => ({ ...q, genre: e.target.value }))}>
            <option value="">All genres</option>
            {filters.genres.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select value={query.language} onChange={(e) => setQuery((q) => ({ ...q, language: e.target.value }))}>
            <option value="">All languages</option>
            {filters.languages.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </GlassCard>

      <div className="fgStack">
        {books.map((b) => (
          <BookCard
            key={b.id}
            title={b.title}
            author={b.author || "Unknown author"}
            status={b.status}
            genre={b.genre || undefined}
            onEdit={() => (window.location.href = `/add?id=${b.id}`)}
            onDelete={() => removeBook(b.id)}
          />
        ))}
      </div>

      {error ? <p className="fgError">Error: {error}</p> : null}
    </div>
  );
}

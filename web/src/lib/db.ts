import Database from "better-sqlite3";
import path from "node:path";

export type Book = {
  id: number;
  title: string;
  author: string | null;
  series_name: string | null;
  series_number: number | null;
  is_series: number | null;
  pages: number | null;
  language: string | null;
  genre: string | null;
  subgenre: string | null;
  status: string;
  is_owned: number | null;
  is_nonfiction: number | null;
  purchase_year: number | null;
  purchase_location: string | null;
  publisher: string | null;
  format: string | null;
  source: string | null;
  rating: number | null;
  notes: string | null;
  date_added: string | null;
  date_started: string | null;
  date_finished: string | null;
  created_at: string;
  updated_at: string;
};

const DB_PATH = process.env.BOOKS_DB_PATH || path.resolve(process.cwd(), "../app/data/books.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

type SqlValue = string | number | null;

function parseIntOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseBoolToInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  const t = String(value).toLowerCase().trim();
  if (["1", "true", "yes", "y"].includes(t)) return 1;
  if (["0", "false", "no", "n"].includes(t)) return 0;
  return null;
}

function cleanText(value: unknown): string | null {
  const v = String(value ?? "").trim();
  return v.length ? v : null;
}

export type BookPayload = {
  title: string;
  author?: string;
  series_name?: string;
  series_number?: number;
  is_series?: boolean;
  pages?: number;
  language?: string;
  genre?: string;
  subgenre?: string;
  status?: string;
  is_owned?: boolean;
  is_nonfiction?: boolean;
  purchase_year?: number;
  purchase_location?: string;
  publisher?: string;
  format?: string;
  source?: string;
  rating?: number;
  notes?: string;
  date_added?: string;
  date_started?: string;
  date_finished?: string;
};

const STATUSES = new Set(["Not Started", "Reading", "Paused", "Finished", "DNF"]);

export function sanitizeBookPayload(payload: Record<string, unknown>) {
  const status = String(payload.status ?? "Not Started").trim();
  return {
    title: String(payload.title ?? "").trim(),
    author: cleanText(payload.author),
    series_name: cleanText(payload.series_name),
    series_number: parseIntOrNull(payload.series_number),
    is_series: parseBoolToInt(payload.is_series),
    pages: parseIntOrNull(payload.pages),
    language: cleanText(payload.language),
    genre: cleanText(payload.genre),
    subgenre: cleanText(payload.subgenre),
    status: STATUSES.has(status) ? status : "Not Started",
    is_owned: parseBoolToInt(payload.is_owned),
    is_nonfiction: parseBoolToInt(payload.is_nonfiction),
    purchase_year: parseIntOrNull(payload.purchase_year),
    purchase_location: cleanText(payload.purchase_location),
    publisher: cleanText(payload.publisher),
    format: cleanText(payload.format),
    source: cleanText(payload.source),
    rating: parseIntOrNull(payload.rating),
    notes: cleanText(payload.notes),
    date_added: cleanText(payload.date_added),
    date_started: cleanText(payload.date_started),
    date_finished: cleanText(payload.date_finished),
  };
}

export function listBooks(params: {
  search?: string;
  status?: string;
  genre?: string;
  language?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}) {
  const search = (params.search ?? "").trim();
  const status = (params.status ?? "").trim();
  const genre = (params.genre ?? "").trim();
  const language = (params.language ?? "").trim();
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = Math.max(1, Math.min(200, Number(params.page_size ?? 50)));

  const sortMap: Record<string, string> = {
    title: "title",
    author: "author",
    status: "status",
    genre: "genre",
    language: "language",
    purchase_year: "purchase_year",
    created_at: "created_at",
  };
  const sortCol = sortMap[params.sort ?? "title"] || "title";
  const order = params.order === "desc" ? "DESC" : "ASC";

  const where: string[] = [];
  const args: SqlValue[] = [];

  if (search) {
    where.push("(title LIKE ? OR author LIKE ?)");
    args.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    where.push("status = ?");
    args.push(status);
  }
  if (genre) {
    where.push("genre = ?");
    args.push(genre);
  }
  if (language) {
    where.push("language = ?");
    args.push(language);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const total = db.prepare(`SELECT COUNT(*) AS c FROM books ${whereSql}`).get(...(args as any[])) as { c: number };
  const items = db
    .prepare(
      `SELECT * FROM books ${whereSql} ORDER BY ${sortCol} ${order}, id ASC LIMIT ? OFFSET ?`
    )
    .all(...args, pageSize, offset) as Book[];

  return { items, total: total.c, page, page_size: pageSize };
}

export function getBook(id: number) {
  return db.prepare("SELECT * FROM books WHERE id = ?").get(id) as Book | undefined;
}

export function createBook(payload: Record<string, unknown>) {
  const data = sanitizeBookPayload(payload);
  if (!data.title) throw new Error("title is required");
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO books (
      title, author, series_name, series_number, is_series, pages, language, genre, subgenre,
      status, is_owned, is_nonfiction, purchase_year, purchase_location, publisher,
      format, source, rating, notes, date_added, date_started, date_finished, created_at, updated_at
    ) VALUES (
      @title, @author, @series_name, @series_number, @is_series, @pages, @language, @genre, @subgenre,
      @status, @is_owned, @is_nonfiction, @purchase_year, @purchase_location, @publisher,
      @format, @source, @rating, @notes, @date_added, @date_started, @date_finished, @created_at, @updated_at
    )
  `);

  const info = stmt.run({ ...data, created_at: now, updated_at: now });
  return getBook(Number(info.lastInsertRowid));
}

export function updateBook(id: number, payload: Record<string, unknown>) {
  const data = sanitizeBookPayload(payload);
  if (!data.title) throw new Error("title is required");
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE books SET
      title=@title, author=@author, series_name=@series_name, series_number=@series_number, is_series=@is_series,
      pages=@pages, language=@language, genre=@genre, subgenre=@subgenre, status=@status,
      is_owned=@is_owned, is_nonfiction=@is_nonfiction, purchase_year=@purchase_year,
      purchase_location=@purchase_location, publisher=@publisher, format=@format, source=@source,
      rating=@rating, notes=@notes, date_added=@date_added, date_started=@date_started,
      date_finished=@date_finished, updated_at=@updated_at
    WHERE id=@id
  `);

  const result = stmt.run({ ...data, updated_at: now, id });
  if (result.changes === 0) return null;
  return getBook(id);
}

export function deleteBook(id: number) {
  const result = db.prepare("DELETE FROM books WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getFilters() {
  const statuses = db.prepare("SELECT DISTINCT status FROM books WHERE status IS NOT NULL AND status != '' ORDER BY status").all() as { status: string }[];
  const genres = db.prepare("SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL AND genre != '' ORDER BY genre").all() as { genre: string }[];
  const languages = db.prepare("SELECT DISTINCT language FROM books WHERE language IS NOT NULL AND language != '' ORDER BY language").all() as { language: string }[];
  return {
    statuses: statuses.map((x) => x.status),
    genres: genres.map((x) => x.genre),
    languages: languages.map((x) => x.language),
  };
}

export function getDashboard() {
  const kpis = db.prepare(`
    SELECT
      COUNT(*) AS total_books,
      SUM(CASE WHEN status = 'Finished' THEN 1 ELSE 0 END) AS finished_books,
      SUM(CASE WHEN status = 'Reading' THEN 1 ELSE 0 END) AS reading_books,
      SUM(CASE WHEN status = 'Paused' THEN 1 ELSE 0 END) AS paused_books,
      SUM(CASE WHEN status = 'Not Started' THEN 1 ELSE 0 END) AS not_started_books,
      SUM(CASE WHEN status = 'DNF' THEN 1 ELSE 0 END) AS dnf_books,
      ROUND(AVG(CASE WHEN pages IS NOT NULL THEN pages END), 1) AS avg_pages
    FROM books
  `).get() as Record<string, number>;

  const total = Number(kpis.total_books || 0);
  const finished = Number(kpis.finished_books || 0);

  const query = (sql: string) => db.prepare(sql).all() as { label: string | number; value: number }[];

  return {
    kpis: {
      ...kpis,
      read_ratio: total ? Number(((finished / total) * 100).toFixed(2)) : 0,
    },
    by_status: query("SELECT status AS label, COUNT(*) AS value FROM books WHERE status IS NOT NULL AND status != '' GROUP BY status ORDER BY value DESC, label ASC"),
    by_genre: query("SELECT genre AS label, COUNT(*) AS value FROM books WHERE genre IS NOT NULL AND genre != '' GROUP BY genre ORDER BY value DESC, label ASC LIMIT 12"),
    top_authors: query("SELECT author AS label, COUNT(*) AS value FROM books WHERE author IS NOT NULL AND author != '' GROUP BY author ORDER BY value DESC, label ASC LIMIT 10"),
    top_subgenres: query("SELECT subgenre AS label, COUNT(*) AS value FROM books WHERE subgenre IS NOT NULL AND subgenre != '' GROUP BY subgenre ORDER BY value DESC, label ASC LIMIT 12"),
    pages_by_status: query("SELECT status AS label, ROUND(AVG(pages), 1) AS value FROM books WHERE pages IS NOT NULL AND status IS NOT NULL AND status != '' GROUP BY status ORDER BY value DESC, label ASC"),
    completed_by_year: query("SELECT purchase_year AS label, ROUND((SUM(CASE WHEN status='Finished' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) AS value FROM books WHERE purchase_year IS NOT NULL GROUP BY purchase_year ORDER BY purchase_year ASC"),
    ownership_split: query("SELECT CASE WHEN is_owned=1 THEN 'Owned' WHEN is_owned=0 THEN 'Not Owned' ELSE 'Unknown' END AS label, COUNT(*) AS value FROM books GROUP BY label ORDER BY value DESC, label ASC"),
    nonfiction_split: query("SELECT CASE WHEN is_nonfiction=1 THEN 'Nonfiction' WHEN is_nonfiction=0 THEN 'Fiction' ELSE 'Unknown' END AS label, COUNT(*) AS value FROM books GROUP BY label ORDER BY value DESC, label ASC"),
    top_publishers: query("SELECT publisher AS label, COUNT(*) AS value FROM books WHERE publisher IS NOT NULL AND publisher != '' GROUP BY publisher ORDER BY value DESC, label ASC LIMIT 10"),
  };
}

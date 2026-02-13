#!/usr/bin/env python3
import csv
import json
import os
import sqlite3
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"
DB_PATH = Path(os.getenv("BOOKS_DB", DATA_DIR / "books.db"))
PROJECT_ROOT = BASE_DIR.parent


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def parse_bool(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return 1 if value else 0
    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "y"}:
        return 1
    if text in {"0", "false", "no", "n", ""}:
        return 0
    return None


def parse_int(value):
    if value in (None, ""):
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def normalize_status(read_value):
    parsed = parse_bool(read_value)
    if parsed == 1:
        return "Finished"
    if parsed == 0:
        return "Not Started"
    return "Not Started"


def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT,
                series_name TEXT,
                series_number INTEGER,
                is_series INTEGER,
                pages INTEGER,
                language TEXT,
                genre TEXT,
                subgenre TEXT,
                status TEXT NOT NULL DEFAULT 'Not Started',
                is_owned INTEGER,
                is_nonfiction INTEGER,
                purchase_year INTEGER,
                purchase_location TEXT,
                publisher TEXT,
                format TEXT,
                source TEXT,
                rating INTEGER,
                notes TEXT,
                date_added TEXT,
                date_started TEXT,
                date_finished TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_books_title ON books(title)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_books_author ON books(author)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_books_status ON books(status)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_books_language ON books(language)")


BOOK_COLUMNS = [
    "title",
    "author",
    "series_name",
    "series_number",
    "is_series",
    "pages",
    "language",
    "genre",
    "subgenre",
    "status",
    "is_owned",
    "is_nonfiction",
    "purchase_year",
    "purchase_location",
    "publisher",
    "format",
    "source",
    "rating",
    "notes",
    "date_added",
    "date_started",
    "date_finished",
]


def bootstrap_data():
    default_csv = PROJECT_ROOT / "lib_updated.csv"
    if not default_csv.exists():
        return 0
    with get_conn() as conn:
        existing = conn.execute("SELECT COUNT(*) FROM books").fetchone()[0]
    if existing > 0:
        return 0
    return import_csv(default_csv)


def sanitize_book_payload(payload):
    data = {}
    data["title"] = str(payload.get("title", "")).strip()
    data["author"] = str(payload.get("author", "")).strip() or None
    data["series_name"] = str(payload.get("series_name", "")).strip() or None
    data["series_number"] = parse_int(payload.get("series_number"))
    data["is_series"] = parse_bool(payload.get("is_series"))
    data["pages"] = parse_int(payload.get("pages"))
    data["language"] = str(payload.get("language", "")).strip() or None
    data["genre"] = str(payload.get("genre", "")).strip() or None
    data["subgenre"] = str(payload.get("subgenre", "")).strip() or None

    status = str(payload.get("status", "Not Started")).strip()
    valid_statuses = {"Not Started", "Reading", "Paused", "Finished", "DNF"}
    data["status"] = status if status in valid_statuses else "Not Started"

    data["is_owned"] = parse_bool(payload.get("is_owned"))
    data["is_nonfiction"] = parse_bool(payload.get("is_nonfiction"))
    data["purchase_year"] = parse_int(payload.get("purchase_year"))
    data["purchase_location"] = str(payload.get("purchase_location", "")).strip() or None
    data["publisher"] = str(payload.get("publisher", "")).strip() or None
    data["format"] = str(payload.get("format", "")).strip() or None
    data["source"] = str(payload.get("source", "")).strip() or None
    data["rating"] = parse_int(payload.get("rating"))
    data["notes"] = str(payload.get("notes", "")).strip() or None
    data["date_added"] = str(payload.get("date_added", "")).strip() or None
    data["date_started"] = str(payload.get("date_started", "")).strip() or None
    data["date_finished"] = str(payload.get("date_finished", "")).strip() or None
    return data


def row_to_dict(row):
    item = dict(row)
    for key in ["is_series", "is_owned", "is_nonfiction"]:
        if item.get(key) is not None:
            item[key] = bool(item[key])
    return item


def import_csv(csv_path):
    csv_file = Path(csv_path)
    if not csv_file.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    with csv_file.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    now = datetime.utcnow().isoformat(timespec="seconds")
    records = []
    for row in rows:
        title = str(row.get("Name", "")).strip()
        if not title:
            continue

        records.append(
            {
                "title": title,
                "author": str(row.get("Author", "")).strip() or None,
                "series_name": None,
                "series_number": None,
                "is_series": parse_bool(row.get("Series")),
                "pages": parse_int(row.get("# of Pages")),
                "language": str(row.get("Language", "")).strip() or None,
                "genre": str(row.get("Genre", "")).strip() or None,
                "subgenre": str(row.get("Subgenre", "")).strip() or None,
                "status": normalize_status(row.get("Read")),
                "is_owned": parse_bool(row.get("Home?")),
                "is_nonfiction": parse_bool(row.get("Non Fiction")),
                "purchase_year": parse_int(row.get("Purchase Year")),
                "purchase_location": str(row.get("Purchase Location", "")).strip() or None,
                "publisher": str(row.get("Publisher", "")).strip() or None,
                "format": None,
                "source": None,
                "rating": None,
                "notes": None,
                "date_added": None,
                "date_started": None,
                "date_finished": None,
                "created_at": now,
                "updated_at": now,
            }
        )

    with get_conn() as conn:
        conn.execute("DELETE FROM books")
        conn.executemany(
            """
            INSERT INTO books (
                title, author, series_name, series_number, is_series, pages, language, genre, subgenre,
                status, is_owned, is_nonfiction, purchase_year, purchase_location, publisher,
                format, source, rating, notes, date_added, date_started, date_finished,
                created_at, updated_at
            )
            VALUES (
                :title, :author, :series_name, :series_number, :is_series, :pages, :language, :genre, :subgenre,
                :status, :is_owned, :is_nonfiction, :purchase_year, :purchase_location, :publisher,
                :format, :source, :rating, :notes, :date_added, :date_started, :date_finished,
                :created_at, :updated_at
            )
            """,
            records,
        )

    return len(records)


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def _send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/books":
            return self.handle_list_books(parsed.query)
        if parsed.path == "/api/filters":
            return self.handle_filters()
        if parsed.path == "/api/dashboard":
            return self.handle_dashboard()
        if parsed.path.startswith("/api/books/"):
            return self.handle_get_book(parsed.path.rsplit("/", 1)[-1])
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/books":
            return self.handle_create_book()
        if self.path == "/api/import":
            return self.handle_import()
        self.send_error(HTTPStatus.NOT_FOUND, "Not found")

    def do_PUT(self):
        if self.path.startswith("/api/books/"):
            return self.handle_update_book(self.path.rsplit("/", 1)[-1])
        self.send_error(HTTPStatus.NOT_FOUND, "Not found")

    def do_DELETE(self):
        if self.path.startswith("/api/books/"):
            return self.handle_delete_book(self.path.rsplit("/", 1)[-1])
        self.send_error(HTTPStatus.NOT_FOUND, "Not found")

    def handle_list_books(self, query):
        params = parse_qs(query)
        search = params.get("search", [""])[0].strip()
        status = params.get("status", [""])[0].strip()
        genre = params.get("genre", [""])[0].strip()
        language = params.get("language", [""])[0].strip()
        sort = params.get("sort", ["title"])[0]
        order = params.get("order", ["asc"])[0].lower()
        page = max(1, parse_int(params.get("page", [1])[0]) or 1)
        page_size = min(200, max(1, parse_int(params.get("page_size", [50])[0]) or 50))

        sort_map = {
            "title": "title",
            "author": "author",
            "status": "status",
            "genre": "genre",
            "language": "language",
            "purchase_year": "purchase_year",
            "created_at": "created_at",
        }
        order_sql = "DESC" if order == "desc" else "ASC"
        sort_col = sort_map.get(sort, "title")

        where = []
        args = []
        if search:
            where.append("(title LIKE ? OR author LIKE ?)")
            like = f"%{search}%"
            args.extend([like, like])
        if status:
            where.append("status = ?")
            args.append(status)
        if genre:
            where.append("genre = ?")
            args.append(genre)
        if language:
            where.append("language = ?")
            args.append(language)

        where_sql = f"WHERE {' AND '.join(where)}" if where else ""
        offset = (page - 1) * page_size

        with get_conn() as conn:
            total = conn.execute(f"SELECT COUNT(*) FROM books {where_sql}", args).fetchone()[0]
            rows = conn.execute(
                f"""
                SELECT * FROM books
                {where_sql}
                ORDER BY {sort_col} {order_sql}, id ASC
                LIMIT ? OFFSET ?
                """,
                [*args, page_size, offset],
            ).fetchall()

        self._send_json(
            {
                "items": [row_to_dict(r) for r in rows],
                "total": total,
                "page": page,
                "page_size": page_size,
            }
        )

    def handle_get_book(self, book_id):
        try:
            bid = int(book_id)
        except ValueError:
            return self._send_json({"error": "Invalid ID"}, status=HTTPStatus.BAD_REQUEST)

        with get_conn() as conn:
            row = conn.execute("SELECT * FROM books WHERE id = ?", (bid,)).fetchone()

        if row is None:
            return self._send_json({"error": "Book not found"}, status=HTTPStatus.NOT_FOUND)

        self._send_json(row_to_dict(row))

    def handle_create_book(self):
        payload = self._read_json()
        data = sanitize_book_payload(payload)
        if not data["title"]:
            return self._send_json({"error": "title is required"}, status=HTTPStatus.BAD_REQUEST)

        now = datetime.utcnow().isoformat(timespec="seconds")
        values = [data[col] for col in BOOK_COLUMNS]
        with get_conn() as conn:
            cursor = conn.execute(
                f"""
                INSERT INTO books ({', '.join(BOOK_COLUMNS)}, created_at, updated_at)
                VALUES ({', '.join(['?'] * len(BOOK_COLUMNS))}, ?, ?)
                """,
                [*values, now, now],
            )
            new_id = cursor.lastrowid
            row = conn.execute("SELECT * FROM books WHERE id = ?", (new_id,)).fetchone()

        self._send_json(row_to_dict(row), status=HTTPStatus.CREATED)

    def handle_update_book(self, book_id):
        try:
            bid = int(book_id)
        except ValueError:
            return self._send_json({"error": "Invalid ID"}, status=HTTPStatus.BAD_REQUEST)

        payload = self._read_json()
        data = sanitize_book_payload(payload)
        if not data["title"]:
            return self._send_json({"error": "title is required"}, status=HTTPStatus.BAD_REQUEST)

        now = datetime.utcnow().isoformat(timespec="seconds")
        assignments = ", ".join([f"{col} = ?" for col in BOOK_COLUMNS])
        values = [data[col] for col in BOOK_COLUMNS]

        with get_conn() as conn:
            cur = conn.execute(
                f"UPDATE books SET {assignments}, updated_at = ? WHERE id = ?",
                [*values, now, bid],
            )
            if cur.rowcount == 0:
                return self._send_json({"error": "Book not found"}, status=HTTPStatus.NOT_FOUND)
            row = conn.execute("SELECT * FROM books WHERE id = ?", (bid,)).fetchone()

        self._send_json(row_to_dict(row))

    def handle_delete_book(self, book_id):
        try:
            bid = int(book_id)
        except ValueError:
            return self._send_json({"error": "Invalid ID"}, status=HTTPStatus.BAD_REQUEST)

        with get_conn() as conn:
            cur = conn.execute("DELETE FROM books WHERE id = ?", (bid,))
            if cur.rowcount == 0:
                return self._send_json({"error": "Book not found"}, status=HTTPStatus.NOT_FOUND)

        self._send_json({"ok": True})

    def handle_filters(self):
        with get_conn() as conn:
            statuses = [r[0] for r in conn.execute("SELECT DISTINCT status FROM books WHERE status IS NOT NULL AND status != '' ORDER BY status")]
            genres = [r[0] for r in conn.execute("SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL AND genre != '' ORDER BY genre")]
            languages = [r[0] for r in conn.execute("SELECT DISTINCT language FROM books WHERE language IS NOT NULL AND language != '' ORDER BY language")]

        self._send_json({"statuses": statuses, "genres": genres, "languages": languages})

    def handle_dashboard(self):
        with get_conn() as conn:
            totals = conn.execute(
                """
                SELECT
                  COUNT(*) AS total,
                  SUM(CASE WHEN status = 'Finished' THEN 1 ELSE 0 END) AS finished,
                  SUM(CASE WHEN status = 'Reading' THEN 1 ELSE 0 END) AS reading,
                  SUM(CASE WHEN status = 'Paused' THEN 1 ELSE 0 END) AS paused,
                  SUM(CASE WHEN status = 'Not Started' THEN 1 ELSE 0 END) AS not_started,
                  SUM(CASE WHEN status = 'DNF' THEN 1 ELSE 0 END) AS dnf,
                  AVG(CASE WHEN pages IS NOT NULL THEN pages END) AS avg_pages
                FROM books
                """
            ).fetchone()
            by_status = conn.execute(
                """
                SELECT status AS label, COUNT(*) AS value
                FROM books
                WHERE status IS NOT NULL AND status != ''
                GROUP BY status
                ORDER BY value DESC, label ASC
                """
            ).fetchall()
            by_genre = conn.execute(
                """
                SELECT genre AS label, COUNT(*) AS value
                FROM books
                WHERE genre IS NOT NULL AND genre != ''
                GROUP BY genre
                ORDER BY value DESC, label ASC
                LIMIT 12
                """
            ).fetchall()
            top_subgenres = conn.execute(
                """
                SELECT subgenre AS label, COUNT(*) AS value
                FROM books
                WHERE subgenre IS NOT NULL AND subgenre != ''
                GROUP BY subgenre
                ORDER BY value DESC, label ASC
                LIMIT 12
                """
            ).fetchall()
            by_year = conn.execute(
                """
                SELECT purchase_year AS label, COUNT(*) AS value
                FROM books
                WHERE purchase_year IS NOT NULL
                GROUP BY purchase_year
                ORDER BY purchase_year ASC
                """
            ).fetchall()
            completed_by_year = conn.execute(
                """
                SELECT purchase_year AS label,
                       SUM(CASE WHEN status = 'Finished' THEN 1 ELSE 0 END) AS finished,
                       COUNT(*) AS total
                FROM books
                WHERE purchase_year IS NOT NULL
                GROUP BY purchase_year
                HAVING total > 0
                ORDER BY purchase_year ASC
                """
            ).fetchall()
            ownership_split = conn.execute(
                """
                SELECT
                  CASE
                    WHEN is_owned = 1 THEN 'Owned'
                    WHEN is_owned = 0 THEN 'Not Owned'
                    ELSE 'Unknown'
                  END AS label,
                  COUNT(*) AS value
                FROM books
                GROUP BY label
                ORDER BY value DESC, label ASC
                """
            ).fetchall()
            nonfiction_split = conn.execute(
                """
                SELECT
                  CASE
                    WHEN is_nonfiction = 1 THEN 'Nonfiction'
                    WHEN is_nonfiction = 0 THEN 'Fiction'
                    ELSE 'Unknown'
                  END AS label,
                  COUNT(*) AS value
                FROM books
                GROUP BY label
                ORDER BY value DESC, label ASC
                """
            ).fetchall()
            pages_by_status = conn.execute(
                """
                SELECT status AS label, ROUND(AVG(pages), 1) AS value
                FROM books
                WHERE pages IS NOT NULL AND status IS NOT NULL AND status != ''
                GROUP BY status
                ORDER BY value DESC, label ASC
                """
            ).fetchall()
            by_language = conn.execute(
                """
                SELECT language AS label, COUNT(*) AS value
                FROM books
                WHERE language IS NOT NULL AND language != ''
                GROUP BY language
                ORDER BY value DESC, label ASC
                """
            ).fetchall()
            top_authors = conn.execute(
                """
                SELECT author AS label, COUNT(*) AS value
                FROM books
                WHERE author IS NOT NULL AND author != ''
                GROUP BY author
                ORDER BY value DESC, label ASC
                LIMIT 10
                """
            ).fetchall()
            top_publishers = conn.execute(
                """
                SELECT publisher AS label, COUNT(*) AS value
                FROM books
                WHERE publisher IS NOT NULL AND publisher != ''
                GROUP BY publisher
                ORDER BY value DESC, label ASC
                LIMIT 10
                """
            ).fetchall()

        total = totals["total"] or 0
        finished = totals["finished"] or 0
        read_ratio = round((finished / total) * 100, 2) if total else 0

        self._send_json(
            {
                "kpis": {
                    "total_books": total,
                    "finished_books": finished,
                    "reading_books": totals["reading"] or 0,
                    "paused_books": totals["paused"] or 0,
                    "not_started_books": totals["not_started"] or 0,
                    "dnf_books": totals["dnf"] or 0,
                    "read_ratio": read_ratio,
                    "avg_pages": round(totals["avg_pages"] or 0, 1),
                },
                "by_status": [dict(r) for r in by_status],
                "by_genre": [dict(r) for r in by_genre],
                "top_subgenres": [dict(r) for r in top_subgenres],
                "by_year": [dict(r) for r in by_year],
                "completed_by_year": [
                    {
                        "label": r["label"],
                        "value": round((r["finished"] / r["total"]) * 100, 2) if r["total"] else 0,
                    }
                    for r in completed_by_year
                ],
                "ownership_split": [dict(r) for r in ownership_split],
                "nonfiction_split": [dict(r) for r in nonfiction_split],
                "pages_by_status": [dict(r) for r in pages_by_status],
                "by_language": [dict(r) for r in by_language],
                "top_authors": [dict(r) for r in top_authors],
                "top_publishers": [dict(r) for r in top_publishers],
            }
        )

    def handle_import(self):
        payload = self._read_json()
        csv_path = payload.get("csv_path")
        if not csv_path:
            return self._send_json({"error": "csv_path is required"}, status=HTTPStatus.BAD_REQUEST)
        try:
            imported = import_csv(csv_path)
            self._send_json({"ok": True, "imported": imported})
        except FileNotFoundError as exc:
            self._send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)


def run(host="127.0.0.1", port=8000):
    init_db()
    imported = bootstrap_data()
    if imported:
        print(f"Bootstrapped DB with {imported} books from {PROJECT_ROOT / 'lib_updated.csv'}")
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"Server running at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run(host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "8000")))

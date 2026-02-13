# Library Tracker

Local-first book management app with analytics, built from your CSV library.

## Repository Structure

- `app/`: Python local app (SQLite + built-in web server + dashboard)
- `web/`: Next.js app (local single-user UI + API routes + advanced analytics)
- `Lib - Books.csv`: Original reference CSV
- `lib_updated.csv`: CSV with added `Genre` and `Subgenre`

## Current Data Source

Both apps use the SQLite database at:

- `app/data/books.db`

The Python app can bootstrap from `lib_updated.csv` when DB is empty.

## Run Option 1: Python Local App

```bash
cd "<repo-root>"
python3 app/server.py
```

Open: [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Run Option 2: Next.js App

```bash
cd "<repo-root>/web"
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm install
npm run dev
```

Open: [http://127.0.0.1:3000](http://127.0.0.1:3000)

## Main Features

- Add, edit, delete books
- Search + filters (status, genre, language)
- Advanced analytics:
  - read ratio
  - status distribution
  - top genres, authors, subgenres, publishers
  - completion rate by purchase year
  - pages by status
  - ownership and fiction/nonfiction splits

## API (Next.js)

- `GET /api/books`
- `POST /api/books`
- `GET /api/books/{id}`
- `PUT /api/books/{id}`
- `DELETE /api/books/{id}`
- `GET /api/filters`
- `GET /api/dashboard`

## Versioning

Suggested baseline tag:

- `v0.1.0`: initial local release (Python app + Next.js app + analytics)

## Next Direction

- Improve UI/UX design system and interaction polish
- Add auth + Postgres for cloud deployment
- Deploy Next.js app

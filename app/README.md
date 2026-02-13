# Library Tracker (Local)

A local single-user web app for managing your books with SQLite and a built-in analytics dashboard.

## Features

- Import books from `lib_updated.csv` (auto on first run if DB is empty)
- Add, edit, delete books
- Search and filter by status, genre, language
- Dashboard KPIs and top genres/authors
- Advanced analytics:
  - status distribution
  - top subgenres and publishers
  - average pages by status
  - completion rate by purchase year
  - ownership split and fiction/nonfiction split
- CSV import endpoint for re-syncing from file

## Run

```bash
cd /Users/begumyolcu/Documents/New\ project
python3 app/server.py
```

Open:

- `http://127.0.0.1:8000`

## Data

- SQLite DB: `/Users/begumyolcu/Documents/New project/app/data/books.db`
- Default CSV bootstrap source: `/Users/begumyolcu/Documents/New project/lib_updated.csv`

## API (local)

- `GET /api/books`
- `POST /api/books`
- `GET /api/books/{id}`
- `PUT /api/books/{id}`
- `DELETE /api/books/{id}`
- `GET /api/filters`
- `GET /api/dashboard`
- `POST /api/import` with `{ "csv_path": "/absolute/path.csv" }`

## Cloud migration path

1. Replace SQLite with Postgres.
2. Add auth and `user_id` to books.
3. Deploy backend/frontend together (or split API + frontend).

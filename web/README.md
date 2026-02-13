# Library Tracker Next.js

Next.js replacement for the local library app.

## Features

- Uses existing SQLite database at `/Users/begumyolcu/Documents/New project/app/data/books.db`
- Book CRUD API routes
- Search and filters
- Advanced analytics dashboard

## Prerequisites

- Node.js installed (Homebrew path may be needed):
  - `export PATH="/opt/homebrew/Cellar/node/25.6.1/bin:$PATH"`

## Run

```bash
cd "/Users/begumyolcu/Documents/New project/web"
export PATH="/opt/homebrew/Cellar/node/25.6.1/bin:$PATH"
export npm_config_cache="$PWD/.npm-cache"
npm install
npm run dev
```

Open: [http://127.0.0.1:3000](http://127.0.0.1:3000)

If `npm install` fails with `ENOTFOUND registry.npmjs.org`, network DNS access to npm is blocked in the current environment. Run the same commands on a network where npm registry is reachable.

## Optional DB override

If you move the DB:

```bash
BOOKS_DB_PATH="/absolute/path/to/books.db" npm run dev
```

## API routes

- `GET /api/books`
- `POST /api/books`
- `GET /api/books/{id}`
- `PUT /api/books/{id}`
- `DELETE /api/books/{id}`
- `GET /api/filters`
- `GET /api/dashboard`

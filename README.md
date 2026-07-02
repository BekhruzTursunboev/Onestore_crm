# OneStore CRM

OneStore CRM is a Next.js CRM dashboard for CS2 skin buyers, transactions, profit tracking, invoice printing, and giveaway selection.

## Tech Stack

- Next.js 16 App Router
- React 19
- Prisma 5
- SQLite for local demo data
- Tailwind CSS
- Radix UI primitives

## Local Setup

Install dependencies:

```bash
npm install
```

Create the local SQLite database and seed demo data:

```bash
npm run db:setup
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Demo Pages

- `/` - dashboard command center
- `/clients` - client list and CRM entry point
- `/clients/[id]` - client profile, transaction history, and invoice print view
- `/giveaway` - giveaway randomizer

## Quality Checks

Run these before presenting or deploying:

```bash
npm run lint
npm run build
```

Both commands should pass before the app is shown to someone else.

## Database Notes

The local SQLite database is generated at `prisma/dev.db`. It is intentionally ignored by Git so private demo data is not pushed to GitHub.

If the app is cloned on a new machine, run `npm run db:setup` before `npm run dev`.

Running `npm run db:seed` clears existing demo clients and transactions, then recreates seeded data.

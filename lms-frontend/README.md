# LMS — Lead Management System (Frontend v1)

> Next.js 15 · TypeScript · Tailwind CSS · Redux Toolkit · Recharts

## Quick Start

```bash
cd lms-frontend
npm install
npm run dev
# http://localhost:3000 → auto-redirects to /dashboard
```

## Folder Structure

```
src/
├── app/               # Next.js App Router pages
│   ├── dashboard/     # KPI dashboard (matches screenshot 1)
│   ├── leads/         # Leads list + [id] detail page
│   ├── contacts/      # Contacts grid
│   ├── companies/     # Companies table
│   ├── calls/         # Call log management
│   ├── reports/       # Analytics & charts
│   ├── tasks/         # Placeholder
│   ├── users/         # Team members
│   └── settings/      # Settings
├── components/
│   ├── layout/        # Sidebar, Header, ReduxProvider
│   ├── ui/            # Badge, StatCard, DataTable, Modal
│   ├── dashboard/     # All 9 dashboard widgets/charts
│   └── leads/         # AddLeadForm (matches screenshot 2)
├── store/             # Redux store + 3 slices
├── hooks/             # Typed redux hooks
├── types/             # All TS interfaces
├── data/              # Static mock data
└── lib/               # Utils (cn, formatCurrency, etc.)
```

## All implemented routes
- /dashboard — Full dashboard matching screenshots
- /leads — List + filters + Add Lead modal
- /leads/[id] — Lead detail with call history
- /contacts, /companies, /calls, /reports, /users, /settings

## Next: Backend ZIP
Built with Node.js + Express + MongoDB + JWT auth.
Replace src/data/mockData.ts with API calls.

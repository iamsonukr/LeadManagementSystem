# Frontend Documentation (Lead Management System)

## Overview
The frontend of the Lead Management System is a modern web application built using **Next.js** (App Router) and **React**. It is designed to provide a responsive, user-friendly interface for managing leads, follow-ups, calls, and overall team performance.

## Tech Stack
- **Framework:** Next.js 16.2.4 (React 19)
- **State Management:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI primitives, Lucide React (Icons), Recharts (Data Visualization)
- **HTTP Client:** Axios
- **Language:** TypeScript

## Directory Structure
The frontend codebase follows a structured organization under the `src` directory:

- `src/app`: Contains the Next.js App Router definitions.
  - `(app)`: The main layout containing authenticated routes such as:
    - `/dashboard`: Overall statistics and performance metrics.
    - `/leads`: Lead management and listing.
    - `/followups`: Follow-up scheduling and tracking.
    - `/calls`: Call logs and analytics.
    - `/projects` / `/project`: Project-related management.
    - `/companies`, `/reports`, `/team`, `/users`, `/settings`, `/myprofile`.
  - `login`: Authentication page.
- `src/components`: Reusable UI components (buttons, modals, tables, etc.).
- `src/context`: React Context providers (e.g., Theme, Auth context).
- `src/hooks`: Custom React hooks for shared logic.
- `src/services`: API integration layer using Axios to communicate with the backend.
- `src/store`: Redux store configuration and state slices.
- `src/types`: TypeScript interfaces and type definitions for data models.
- `src/lib`: Shared utility functions.
- `src/data`: Static mock data or configuration constants.

## Key Features
1. **Dashboard & Analytics:** Visual representations of leads and sales performance using Recharts.
2. **Lead & Follow-up Management:** Comprehensive tables and forms to track the lifecycle of a lead.
3. **Responsive Design:** Styled with Tailwind CSS to ensure seamless usage across devices.
4. **Accessible UI:** Built with Radix UI to ensure accessibility (a11y) standards are met.
5. **State Handling:** Global state managed efficiently via Redux Toolkit.

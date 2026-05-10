# Backend Documentation (Lead Management System)

## Overview
The backend of the Lead Management System is a robust and scalable RESTful API built with **NestJS**. It handles all the business logic, data persistence, and authentication for the application, interacting with a MongoDB database.

## Tech Stack
- **Framework:** NestJS 11
- **Database:** MongoDB
- **ORM/ODM:** Mongoose (`@nestjs/mongoose`)
- **Authentication:** Passport.js, JWT (`@nestjs/jwt`), bcrypt
- **Validation:** `class-validator`, `class-transformer`
- **API Documentation:** Swagger (`@nestjs/swagger`)
- **Language:** TypeScript

## Directory Structure
The backend is modularized based on features, located inside the `src` directory:

- `src/app.module.ts`: The root module of the application where all feature modules are imported.
- `src/main.ts`: The entry point of the application.
- `src/seed.ts`: A script used to seed initial mock data or admin users into the database.

### Feature Modules
Each feature typically contains its own Module, Controller, Service, and Schema:
- `auth`: Handles user authentication, JWT generation, and validation strategies.
- `users`: Manages user accounts, roles, and profiles.
- `leads`: Core business logic for creating, updating, and querying leads.
- `followups`: Manages follow-up schedules, statuses, and reminders for leads.
- `calls`: Logs and tracks call records associated with leads or clients.
- `projects`: Manages projects associated with leads or clients.
- `department`: Handles organizational structuring (e.g., Sales, Marketing).
- `dashboard`: Aggregates statistics and metrics for the frontend dashboard.
- `integrations`: Handles connections to external third-party tools or APIs.

### Shared Directories
- `common`: Contains shared resources such as global guards, interceptors, custom decorators, and exception filters.
- `types`: Shared TypeScript interfaces and types across the backend application.

## Key Features
1. **Secure Authentication:** Implements JWT-based authentication to secure endpoints.
2. **Data Validation:** Uses decorators from `class-validator` to enforce strict DTO (Data Transfer Object) validation rules.
3. **Modular Architecture:** Highly decoupled modules following NestJS best practices, making it easy to scale and maintain.
4. **Database Integration:** Utilizes Mongoose for elegant MongoDB object modeling, enabling complex queries and aggregations (e.g., for dashboard metrics).
5. **API Documentation:** Configured with Swagger for easy testing and API exploration.

# Dumut Core Express Backend API Gateway

This directory houses the core REST API Gateway for the Dumut ecosystem. It handles authentication, data models, database interactions, relational data caching, and schedules background evaluation operations.

---

## Architectural Details

The system is built on Node.js using Express and TypeScript. It utilizes:
*   **Prisma ORM:** Database modeling, migrations, and type-safe queries.
*   **Zod Schema Validation:** Strictly validates all request payloads at runtime.
*   **JWT Authentication:** Uses access and refresh token rotation schemes.
*   **Node-Cron Scheduler:** Performs daily reset processes for user streaks and levels, and manages badge qualification checks.
*   **Winston Logging:** Structured logging configuration for development and production environments.

---

## Getting Started

### Prerequisites
*   Node.js 18+ and npm
*   Active PostgreSQL or SQLite Database

### Installation and Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Setup environment variables:**
    Create a `.env` file in the root of this folder and fill in the parameters matching your environment:
    ```env
    PORT=3000
    DATABASE_URL="postgresql://username:password@localhost:5432/finans_db?schema=public"
    NODE_ENV=development
    JWT_ACCESS_SECRET=your-access-secret-key
    JWT_REFRESH_SECRET=your-refresh-secret-key
    JWT_ACCESS_EXPIRES_IN=15m
    JWT_REFRESH_EXPIRES_IN=7d
    FRONTEND_URL=http://localhost:3001
    GEMINI_API_KEY=your-gemini-key
    COLLECT_API_KEY=your-collectapi-key
    AI_MICROSERVICE_URL=http://localhost:8000
    ```

3.  **Synchronize the Database Schema:**
    Generate the Prisma client and run the database sync command:
    ```bash
    npx prisma generate
    npm run db:push
    ```

4.  **Populate Initial Data (Seeding):**
    Run the seeder to populate system categories, rules, and system badges:
    ```bash
    npm run db:seed
    ```

5.  **Run in Development Mode:**
    ```bash
    npm run dev
    ```

---

## Project Script Reference

*   `npm run dev`: Runs the compiler and starts the watch server.
*   `npm run build`: Generates the production build inside the `dist` folder.
*   `npm start`: Runs the built production server using `node dist/server.js`.
*   `npm run db:push`: Synchronizes database tables with the Prisma schema.
*   `npm run db:seed`: Seeds baseline categories, items, and system rules.

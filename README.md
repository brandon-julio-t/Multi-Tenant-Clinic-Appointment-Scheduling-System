# Multi Tenant Clinic Appointment System

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app` for a medical appointment management system.

## Technologies Used

- [Next.js](https://nextjs.org) - React framework
- [Better Auth](https://better-auth.com) - Authentication
- [Prisma](https://prisma.io) - Database ORM
- [PostgreSQL](https://postgresql.org) - Database
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [tRPC](https://trpc.io) - Type-safe API layer
- [TypeScript](https://typescriptlang.org) - Type safety

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or bun package manager

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd multi-tenant-clinic-appointment-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your database URL and auth secrets:

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5433/test"
   BETTER_AUTH_SECRET="your-secret-key-here"
   NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
   ```

4. **Set up Infrastructure**

   ```bash
   docker compose up -d
   ```

5. **Set up and seed the database with sample data**

   ```bash
   npm run db:reset
   ```

   This will create:
   - 2 organizations (Main Street Medical Clinic & General Hospital)
   - 4 users with authentication accounts
   - Organization members and roles
   - 4 doctors, 4 patients
   - Services, rooms, and medical devices
   - Sample appointments with device associations

   There also exist `./dev/backup.sql` for convenience of setting up the database with seed data with only using SQL.

### Development

```bash
# Start development server
npm run dev

# Open Prisma Studio to view database
npm run db:studio
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:reset` - Reset and seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Database Schema

The application uses the following main entities:

- **Organizations** - Medical facilities
- **Users** - Staff and administrators
- **Doctors** - Medical practitioners
- **Patients** - People receiving care
- **Services** - Types of medical services
- **Rooms** - Examination and procedure rooms
- **Devices** - Medical equipment
- **Appointments** - Scheduled medical visits
- **AppointmentDevices** - Equipment used in appointments

## Authentication

The app uses Better Auth for authentication with email/password login and organization management. The seed script creates organizations and users using the proper Better Auth API to ensure data integrity and login functionality.

Sample users created by the seed script:

**Main Street Medical Clinic:**

- Admin: `sarah.johnson@mainstreetclinic.com` / `password123`
- Staff: `emily.rodriguez@mainstreetclinic.com` / `password123`

**General Hospital:**

- Admin: `michael.chen@generalhospital.com` / `password123`
- Staff: `david.kim@generalhospital.com` / `password123`

The seed script uses Better Auth's organization plugin API to properly create:

- Organizations using `authClient.organization.create()`
- Users using `authClient.signUp.email()`
- Organization members using `authClient.organization.addMember()`

This ensures that all authentication data is correctly structured and users can successfully log in with proper organization membership.

## Postman

There is a file in `./dev/tRPC OpenAPI.postman_collection.json` that can be imported into Postman for REST API development style.

## Deployment

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

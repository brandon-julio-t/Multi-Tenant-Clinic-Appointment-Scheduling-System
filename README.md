
https://github.com/user-attachments/assets/9a897fb8-f03b-41f4-9a0b-1a017d9767c7

https://github.com/user-attachments/assets/9b67e0d3-d7ba-439d-9d23-fae80b485a7e

<img width="4032" height="2302" alt="Screenshot 2025-09-17 at 17 20 51" src="https://github.com/user-attachments/assets/8c5c6a8b-1b00-4fd4-a9aa-30098b40ab06" />

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

**City Medical Organization:**

- Admin: `sarah.johnson@citymedical.com` / `password123`
- Staff: `emily.rodriguez@citymedical.com` / `password123`

**Family Practice Organization:**

- Admin: `michael.chen@familypractice.com` / `password123`
- Staff: `james.wilson@familypractice.com` / `password123`

The seed script uses Better Auth's organization plugin API to properly create:

- Organizations using `authClient.organization.create()`
- Users using `authClient.signUp.email()`
- Organization members using `authClient.organization.addMember()`

This ensures that all authentication data is correctly structured and users can successfully log in with proper organization membership.

## Postman

There is a file in `./dev/tRPC OpenAPI.postman_collection.json` that can be imported into Postman for REST API development style.

## Deployment

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

---

# Copy-paste from `DESIGN.md` for reader convenience

---

# Decisions

- Next.js as the frontend because it's the modern standard of developing React app and frontend web app in general.
- tRPC for fast development, minimal infrastructure, tight integration between frontend and backend for maximum development velocity.
- PostgreSQL as the database because it's the modern standard DB, with transaction isolation set to the highest level: "Serializable", because we should be debugging business logic / semantic problems rather than concurrency problems.
- Prisma as the ORM because it's battery included from schema generation, migration system, admin UI, and ORM.
- TailwindCSS + shadcn/ui as the design system because it's the golden standard of React design system.
- DB indexes have been carefully chosen according to the `where` and `order by` clauses in SQL query pattern, and also triple-checked with SQL `explain analyze`, `oha` benchmark, and AI to make sure that index is well placed and fully utilized.

# Trade-offs

- In `getAvailableTimeSlotsForCreateAppointment`, `limit` is not used, but can be extended in the future, because the time slots have been bound to just single day and adding limit logic would make the code to be convoluted with no clear benefit at the point of writing. Also, the user cannot schedule an appointment in the afternoon, due to this limitation. Hence, because the `limit` parameter has more cons than the pros, it is omitted for now.
- For testing, the database is not mocked to match real-life scenario and ensure no concurrency problem occurs. Hence, database seed is very important when testing.
- For OpenAPI, the authorization for now is hardcoded according to seed data, so it is important to setup the database with the data seed, because the primary development is using tRPC and writing OpenAPI only slows down development velocity. Hence, the OpenAPI is done in bare minimum manner.
- For timezone, we setup `appTimezone` from the user's active organization, so that everybody in the organization will see the same time display, no matter whether they work on-site according to the timezone or remote in country far far away with different timezone. The consequence is we need to always consider timezone when doing date manipulation/creation, but this is already handled by using `{ in: tz(timezone) }` options in date-fns.

# Algorithm/data-structure complexity

The algorithm to generate available time slots is relatively basic, traverse the doctor working hours, generate time range from start to end according to the service duration, and skip if the doctor/room is not available at that time slot using interval intersection by `date-fns`.

# Scale considerations

The app should scale well horizontally, we can just deploy it using PM2 in a traditional VPS like EC2, load balancing should not be a problem since we're not doing anything sophisticated in-memory.

PostgreSQL also should be able to handle the workload, considering the well-placed index and all queries have been checked to be using the index.

If we take the assumptions of 50k bookings/day and peak traffic of 09:00-11:00, we can calculate that there are around ~1 bookings per second (actual value is 0.58).

We can model this into stress test using `oha -n 10000 -c 200` which means 10.000 total requests with 200 concurrent requests.

## appointment.getAppointments

```
Summary:
  Success rate:	100.00%
  Total:	16.3833 sec
  Slowest:	6.0896 sec
  Fastest:	0.0486 sec
  Average:	0.3260 sec
  Requests/sec:	610.3769

  Total data:	36.06 MiB
  Size/request:	3.69 KiB
  Size/sec:	2.20 MiB

Response time histogram:
  0.049 sec [1]    |
  0.653 sec [9850] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.257 sec [28]   |
  1.861 sec [22]   |
  2.465 sec [18]   |
  3.069 sec [16]   |
  3.673 sec [14]   |
  4.277 sec [14]   |
  4.881 sec [14]   |
  5.485 sec [12]   |
  6.090 sec [11]   |

Response time distribution:
  10.00% in 0.2042 sec
  25.00% in 0.2774 sec
  50.00% in 0.3069 sec
  75.00% in 0.3180 sec
  90.00% in 0.3373 sec
  95.00% in 0.3555 sec
  99.00% in 1.8422 sec
  99.90% in 5.5758 sec
  99.99% in 6.0383 sec


Details (average, fastest, slowest):
  DNS+dialup:	0.1759 sec, 0.0070 sec, 1.1075 sec
  DNS-lookup:	0.0000 sec, 0.0000 sec, 0.0007 sec

Status code distribution:
  [200] 10000 responses
```

## appointment.getAvailableTimeSlotsForCreateAppointment

```
Summary:
  Success rate:	100.00%
  Total:	28.3050 sec
  Slowest:	9.5509 sec
  Fastest:	0.1706 sec
  Average:	0.5624 sec
  Requests/sec:	353.2943

  Total data:	33.65 MiB
  Size/request:	3.45 KiB
  Size/sec:	1.19 MiB

Response time histogram:
  0.171 sec [1]    |
  1.109 sec [9865] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  2.047 sec [23]   |
  2.985 sec [18]   |
  3.923 sec [18]   |
  4.861 sec [14]   |
  5.799 sec [14]   |
  6.737 sec [13]   |
  7.675 sec [12]   |
  8.613 sec [11]   |
  9.551 sec [11]   |

Response time distribution:
  10.00% in 0.3245 sec
  25.00% in 0.4756 sec
  50.00% in 0.5270 sec
  75.00% in 0.5534 sec
  90.00% in 0.6057 sec
  95.00% in 0.6522 sec
  99.00% in 2.6405 sec
  99.90% in 8.7294 sec
  99.99% in 9.4645 sec


Details (average, fastest, slowest):
  DNS+dialup:	0.1310 sec, 0.0031 sec, 1.4988 sec
  DNS-lookup:	0.0000 sec, 0.0000 sec, 0.0005 sec

Status code distribution:
  [200] 10000 responses
```

## appointment.createAppointment

```
Summary:
  Success rate:	100.00%
  Total:	17.0872 sec
  Slowest:	2.8022 sec
  Fastest:	0.1269 sec
  Average:	0.3401 sec
  Requests/sec:	585.2350

  Total data:	2.15 MiB
  Size/request:	225 B
  Size/sec:	128.59 KiB

Response time histogram:
  0.127 sec [1]    |
  0.394 sec [8433] |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  0.662 sec [1437] |■■■■■
  0.930 sec [20]   |
  1.197 sec [16]   |
  1.465 sec [13]   |
  1.732 sec [16]   |
  2.000 sec [16]   |
  2.267 sec [13]   |
  2.535 sec [15]   |
  2.802 sec [20]   |

Response time distribution:
  10.00% in 0.2316 sec
  25.00% in 0.2748 sec
  50.00% in 0.3226 sec
  75.00% in 0.3678 sec
  90.00% in 0.4205 sec
  95.00% in 0.4619 sec
  99.00% in 1.0896 sec
  99.90% in 2.6914 sec
  99.99% in 2.7492 sec


Details (average, fastest, slowest):
  DNS+dialup:	0.0460 sec, 0.0024 sec, 0.6236 sec
  DNS-lookup:	0.0000 sec, 0.0000 sec, 0.0005 sec

Status code distribution:
  [200] 10000 responses
```

The `oha` stress test shows that the app should perform well, judging from the 100% success rate with slowest response time between 1s-10s, which falls on the 99%+ distribution, and at that point the user should have an instinct to refresh the page or just wait full 10s.

In the future we can also enforce query time limit of around 5s-30s to encourage user to re-try to avoid long waiting time which can degrade UX.

> Note: benchmark done in 16GB M1 MacBook Pro, results may vary and average ubuntu server should perform good as well, combined with strong database provider like AWS Aurora or PlanetScale.

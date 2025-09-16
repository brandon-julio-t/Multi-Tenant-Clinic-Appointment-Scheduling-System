# Decisions

- Next.js as the frontend because it's the modern standard of developing React app and frontend web app in general.
- tRPC for fast development, minimal infrastructure, tight integration between frontend and backend for maximum development velocity.
- PostgreSQL as the database because it's the modern standard DB, with transaction isolation set to the highest level: "Serializable", because we should be debugging business logic / semantic problems rather than concurrency problems.
- Prisma as the ORM because it's battery included from schema generation, migration system, admin UI, and ORM.
- TailwindCSS + shadcn/ui as the design system because it's the golden standard of React design system.
- DB indexes have been carefully chosen according to the `where` and `order by` clauses in SQL query pattern, and also triple-checked with SQL `explain analyze`, `oha` benchmark, and AI to make sure that index is well placed and fully utilized.

# Trade-offs

- In `getAvailableTimeSlotsForCreateAppointment`, `limit` is not used, but can be extended in the future, because the time slots have been bound to just single day and adding limit logic would make the code to be convoluted with no clear benefit at the point of writing. Also, the user cannot schedule an appointment in the afternoon, due to this limitation. Hence, because the `limit` parameter has more cons than the pros, it is omitted for now.
- For testing, the database is not mocked to match real-life scenario and ensure no concurrency problem occurs. Hence, database seed is very improtant when testing.
- For OpenAPI, the authorization for now is hardcoded according to seed data, so it is important to setup the database with the data seed, because the primary development is using tRPC and writing OpenAPI only slows down development velocity. Hence, the OpenAPI is done in bare minimum manner.
- For timezone, we setup `appTimezone` from the user's active organization, so that everybody in the organization will see the same time display, no matter whether they work on-site according to the timezone or remote in country far far away with different timezone. The consequence is we need to always consider timezone when doing date manipulation/creation, but this is already handled by using `{ in: tz(timezone) }` options in date-fns.

# Algorithm/data-structure complexity

The algorithm to generate available time slots is relatively basic, traverse the doctor working hours, generate time range from start to end according to the service duration, and skip if the doctor/room is not available at that time slot using interval intersection by `date-fns`.

# And scale considerations.

The app should scale well horizontally, we can just deploy it using PM2 in a traditional VPS like EC2, load balancing should not be a problem since we're not doing anything sophisticated in-memory.

PostgresSQL also should be able to handle the workload, considering the well-placed index and all queries have been checked to be using the index.

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

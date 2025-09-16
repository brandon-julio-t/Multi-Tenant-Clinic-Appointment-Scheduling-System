import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { tz } from "@date-fns/tz";
import {
  addMinutes,
  areIntervalsOverlapping,
  constructNow,
  getDay,
  isBefore,
  set,
  startOfDay,
} from "date-fns";
import { createTRPCRouter, protectedOrgProcedure } from "~/server/api/trpc";
import {
  createAppointment,
  createAppointmentInputSchema,
} from "./logics/create-appointment";

export const appointmentRouter = createTRPCRouter({
  // Fetch all doctors
  getDoctors: protectedOrgProcedure.query(async ({ ctx }) => {
    return ctx.db.doctor.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
      where: {
        organizationId: ctx.activeOrganizationId,
      },
    });
  }),

  // Fetch all services
  getServices: protectedOrgProcedure.query(async ({ ctx }) => {
    return ctx.db.service.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
      where: {
        organizationId: ctx.activeOrganizationId,
      },
    });
  }),

  // Fetch all rooms
  getRooms: protectedOrgProcedure.query(async ({ ctx }) => {
    return ctx.db.room.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
      where: {
        organizationId: ctx.activeOrganizationId,
      },
    });
  }),

  // Fetch all devices
  getDevices: protectedOrgProcedure.query(async ({ ctx }) => {
    return ctx.db.device.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
      where: {
        organizationId: ctx.activeOrganizationId,
      },
    });
  }),

  // Fetch all patients
  getPatients: protectedOrgProcedure.query(async ({ ctx }) => {
    return ctx.db.patient.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
      where: {
        organizationId: ctx.activeOrganizationId,
      },
    });
  }),

  // Fetch all appointments
  // GET /api/doctors/:id/schedule?from=...&to=... — list doctor’s appointments for calendar view
  getAppointments: protectedOrgProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/appointments",
        tags: ["appointments"],
      },
    })
    .input(
      z.object({
        from: z.date().describe("Example: 2025-08-31T22:00:00.000Z"),
        to: z.date().describe("Example: 2025-09-30T21:59:59.999Z"),
      }),
    )
    .output(
      z.array(
        z.object({
          id: z.string(),
          doctor: z.object({
            id: z.string(),
            name: z.string(),
          }),
          service: z.object({
            id: z.string(),
            name: z.string(),
          }),
          room: z.object({
            id: z.string(),
            name: z.string(),
          }),
          startAt: z.date(),
          endAt: z.date(),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      console.log("input", input);

      const whereAnd: Prisma.AppointmentWhereInput[] = [
        {
          organizationId: ctx.activeOrganizationId,
          startAt: { gte: input.from },
          endAt: { lte: input.to },
        },
      ];

      console.log("whereAnd", whereAnd);

      return ctx.db.appointment.findMany({
        where: {
          AND: whereAnd,
        },
        include: {
          doctor: true,
          service: true,
          room: true,
        },
        orderBy: {
          startAt: "asc",
        },
      });
    }),

  // GET /api/availability — search availability (see payload below)
  getAvailableTimeSlotsForCreateAppointment: protectedOrgProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/appointments/availability",
        tags: ["appointments"],
      },
    })
    .input(
      z.object({
        roomId: z
          .string()
          .describe("Example: 97013d9c-52d6-4607-af0d-ae87c205c6b6"),
        doctorId: z
          .string()
          .describe("Example: 1a4353a6-a79d-4056-8a8b-5e28c538f7c1"),
        serviceId: z.string().describe("Example: service_cardiology"),
        from: z.date().describe("Example: 2025-09-18T22:00:00.000Z"),
        to: z.date().describe("Example: 2025-09-19T21:59:59.999Z"),
        limit: z.number().optional().default(3).describe("Example: 3"),
      }),
    )
    .output(
      z.array(
        z.object({
          start: z.date(),
          end: z.date(),
          disabled: z.boolean(),
          disabledReason: z.string().optional(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      console.log("input", input);

      const dayOfWeek = getDay(input.from, {
        in: tz(ctx.organizationTimezone),
      });

      const [doctorWorkingHours, service, bookedAppointments] =
        await ctx.db.$transaction([
          ctx.db.doctorWorkingHour.findMany({
            where: {
              doctor: {
                id: input.doctorId,
                organizationId: ctx.activeOrganizationId,
              },
              dayOfWeek,
            },
          }),

          ctx.db.service.findUniqueOrThrow({
            where: {
              id: input.serviceId,
              organizationId: ctx.activeOrganizationId,
            },
          }),

          ctx.db.appointment.findMany({
            where: {
              organizationId: ctx.activeOrganizationId,
              OR: [{ roomId: input.roomId }, { doctorId: input.doctorId }],
              startAt: { gte: input.from },
              endAt: { lte: input.to },
            },
          }),
        ]);

      console.log("doctorWorkingHours", doctorWorkingHours);
      console.log("service", service);
      console.log("bookedAppointments", bookedAppointments);

      const timezone = ctx.organizationTimezone;
      const serviceDurationMinutes = service.durationMinutes;

      const timeSlots: Array<{
        start: Date;
        end: Date;
        disabled: boolean;
        disabledReason?: string;
      }> = [];

      const currentTime = new Date();
      const now = startOfDay(input.from, { in: tz(timezone) });

      const isTimeSlotBooked = (start: Date, end: Date) => {
        return bookedAppointments.some((appointment) => {
          return areIntervalsOverlapping(
            { start, end },
            { start: appointment.startAt, end: appointment.endAt },
          );
        });
      };

      for (const workingHour of doctorWorkingHours) {
        const [startHour, startMinute] = workingHour.startHour.split(":");
        const [endHour, endMinute] = workingHour.endHour.split(":");

        const end = set(
          now,
          {
            hours: Number(endHour ?? "00"),
            minutes: Number(endMinute ?? "00"),
            seconds: 0,
            milliseconds: 0,
          },
          { in: tz(timezone) },
        );

        let curr = set(
          now,
          {
            hours: Number(startHour ?? "00"),
            minutes: Number(startMinute ?? "00"),
            seconds: 0,
            milliseconds: 0,
          },
          { in: tz(timezone) },
        );

        while (isBefore(curr, end)) {
          const start = curr;
          const end = addMinutes(curr, serviceDurationMinutes, {
            in: tz(timezone),
          });

          let disabledReason = "";
          if (isBefore(start, constructNow(currentTime))) {
            disabledReason = "Past time";
          } else if (isTimeSlotBooked(start, end)) {
            disabledReason = "Time slot booked";
          }

          timeSlots.push({
            start: start,
            end: end,
            disabled: !!disabledReason,
            disabledReason,
          });

          curr = addMinutes(curr, serviceDurationMinutes, { in: tz(timezone) });
        }
      }

      return timeSlots;
    }),

  // Create a new appointment
  // POST /api/appointments — create booking
  createAppointment: protectedOrgProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/appointments",
        tags: ["appointments"],
      },
    })
    .input(createAppointmentInputSchema)
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("input", input);

      const output = await createAppointment({
        timezone: ctx.organizationTimezone,
        organizationId: ctx.activeOrganizationId,
        prisma: ctx.db,
        input,
      });

      console.log("output", output);

      return output;
    }),

  // DELETE /api/appointments/:id — cancel booking
  deleteAppointment: protectedOrgProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/appointments/{id}",
        tags: ["appointments"],
      },
    })
    .input(
      z.object({
        id: z
          .string()
          .describe("Example: 1a4353a6-a79d-4056-8a8b-5e28c538f7c1"),
      }),
    )
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("input", input);

      const deleted = await ctx.db.appointment.delete({
        where: {
          id: input.id,
          organizationId: ctx.activeOrganizationId,
        },
      });

      console.log("deleted", deleted);

      return deleted;
    }),
});

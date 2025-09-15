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
  getAppointments: protectedOrgProcedure
    .input(
      z.object({
        roomId: z.string().nullish(),
        from: z.date(),
        to: z.date(),
      }),
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

      if (input.roomId) {
        whereAnd.push({ roomId: input.roomId });
      }

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

  getAvailableTimeSlotsForCreateAppointment: protectedOrgProcedure
    .input(
      z.object({
        roomId: z.string(),
        doctorId: z.string(),
        serviceId: z.string(),
        from: z.date(),
        to: z.date(),
        limit: z.number().optional().default(3),
      }),
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
  createAppointment: protectedOrgProcedure
    .input(createAppointmentInputSchema)
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
});

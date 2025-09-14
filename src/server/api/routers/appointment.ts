import type { Prisma } from "@prisma/client";
import { z } from "zod";

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
        from: z.instanceof(Date),
        to: z.instanceof(Date),
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
      });
    }),

  getAppointmentsByRoomOrDoctorForTimeSlot: protectedOrgProcedure
    .input(
      z.object({
        roomId: z.string(),
        doctorId: z.string(),
        from: z.instanceof(Date),
        to: z.instanceof(Date),
      }),
    )
    .query(async ({ ctx, input }) => {
      console.log("input", input);

      return ctx.db.appointment.findMany({
        where: {
          organizationId: ctx.activeOrganizationId,
          OR: [{ roomId: input.roomId }, { doctorId: input.doctorId }],
          startAt: { gte: input.from },
          endAt: { lte: input.to },
        },
      });
    }),

  // Create a new appointment
  createAppointment: protectedOrgProcedure
    .input(
      createAppointmentInputSchema.extend({
        // TODO: timezone should come from user auth, but for now we use a fixed value
        timezone: z.string().nonempty(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("input", input);

      return await createAppointment({
        timezone: input.timezone,
        organizationId: ctx.activeOrganizationId,
        prisma: ctx.db,
        input,
      });
    }),
});

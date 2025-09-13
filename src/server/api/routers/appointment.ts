import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  createAppointment,
  createAppointmentInputSchema,
} from "./logics/create-appointment";

// TODO: organizationId should come from user auth, but for now we use a fixed value

export const appointmentRouter = createTRPCRouter({
  // Fetch all doctors
  getDoctors: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.doctor.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
        where: {
          organizationId: input.organizationId,
        },
      });
    }),

  // Fetch all services
  getServices: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.service.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
        where: {
          organizationId: input.organizationId,
        },
      });
    }),

  // Fetch all rooms
  getRooms: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.room.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
        where: {
          organizationId: input.organizationId,
        },
      });
    }),

  // Fetch all devices
  getDevices: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.device.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
        where: {
          organizationId: input.organizationId,
        },
      });
    }),

  // Fetch all patients
  getPatients: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.patient.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
        where: {
          organizationId: input.organizationId,
        },
      });
    }),

  // Fetch all appointments
  getAppointments: publicProcedure
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

  // Create a new appointment
  createAppointment: publicProcedure
    .input(createAppointmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      console.log("input", input);

      return await createAppointment({
        prisma: ctx.db,
        input,
      });
    }),
});

import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

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
      });
    }),

  // Create a new appointment
  createAppointment: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        doctorId: z.string(),
        serviceId: z.string(),
        roomId: z.string(),
        patientId: z.string(),
        deviceIds: z.array(z.string()),
        startAt: z.date(),
        endAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Add validation to ensure the appointment doesn't conflict with existing ones
      // For now, we'll just create the appointment

      console.log("input", input);

      await ctx.db.$transaction(async (tx) => {
        await tx.appointment.create({
          data: {
            organizationId: input.organizationId,
            doctorId: input.doctorId,
            serviceId: input.serviceId,
            roomId: input.roomId,
            patientId: input.patientId,
            startAt: input.startAt,
            endAt: input.endAt,
            appointmentDevices: {
              createMany: {
                data: input.deviceIds.map((deviceId) => ({
                  deviceId,
                })),
              },
            },
          },
        });

        const appointmentsByRoom = await tx.appointment.findMany({
          where: {
            roomId: input.roomId,
            startAt: {
              gte: input.startAt,
            },
            endAt: {
              lte: input.endAt,
            },
          },
        });

        if (appointmentsByRoom.length > 1) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Room is already booked for this time",
          });
        }
      });

      return input;
    }),
});

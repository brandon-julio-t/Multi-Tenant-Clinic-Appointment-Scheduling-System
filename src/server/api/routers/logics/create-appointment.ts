import { tz } from "@date-fns/tz";
import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { areIntervalsOverlapping, endOfDay, startOfDay } from "date-fns";
import z from "zod";

export const createAppointmentInputSchema = z.object({
  doctorId: z
    .string()
    .nonempty()
    .describe("Example: 1a4353a6-a79d-4056-8a8b-5e28c538f7c1"),
  serviceId: z.string().nonempty().describe("Example: service_cardiology"),
  roomId: z
    .string()
    .nonempty()
    .describe("Example: 97013d9c-52d6-4607-af0d-ae87c205c6b6"),
  patientId: z
    .string()
    .nonempty()
    .describe("Example: 1a4353a6-a79d-4056-8a8b-5e28c538f7c1"),
  deviceIds: z
    .array(z.string().nonempty())
    .nonempty()
    .describe("Example: [1a4353a6-a79d-4056-8a8b-5e28c538f7c1]"),
  startAt: z.date().describe("Example: 2025-09-18T22:00:00.000Z"),
  endAt: z.date().describe("Example: 2025-09-18T22:30:00.000Z"),
});

export async function createAppointment({
  timezone,
  organizationId,
  prisma,
  input,
}: {
  timezone: string;
  organizationId: string;
  prisma: PrismaClient;
  input: z.infer<typeof createAppointmentInputSchema>;
}) {
  return await prisma.$transaction(async (tx) => {
    const startAt = startOfDay(input.startAt, { in: tz(timezone) });
    const endAt = endOfDay(input.endAt, { in: tz(timezone) });

    const appointmentsByRoom = await tx.appointment.findMany({
      where: {
        roomId: input.roomId,
        startAt: {
          gte: startAt,
        },
        endAt: {
          lte: endAt,
        },
      },
    });

    appointmentsByRoom.forEach((appointment) => {
      if (
        areIntervalsOverlapping(
          { start: appointment.startAt, end: appointment.endAt },
          { start: input.startAt, end: input.endAt },
        )
      ) {
        console.log(
          "Room conflict with appointment",
          appointment,
          { start: appointment.startAt, end: appointment.endAt },
          { start: input.startAt, end: input.endAt },
        );

        throw new TRPCError({
          code: "CONFLICT",
          message: "Room is already booked for this time",
        });
      }
    });

    const appointmentsByDoctor = await tx.appointment.findMany({
      where: {
        doctorId: input.doctorId,
        startAt: {
          gte: startAt,
        },
        endAt: {
          lte: endAt,
        },
      },
    });

    appointmentsByDoctor.forEach((appointment) => {
      if (
        areIntervalsOverlapping(
          { start: appointment.startAt, end: appointment.endAt },
          { start: input.startAt, end: input.endAt },
        )
      ) {
        console.log(
          "Doctor conflict with appointment",
          appointment,
          { start: appointment.startAt, end: appointment.endAt },
          { start: input.startAt, end: input.endAt },
        );

        throw new TRPCError({
          code: "CONFLICT",
          message: "Doctor is already booked for this time",
        });
      }
    });

    const createdAppointment = await tx.appointment.create({
      data: {
        organizationId: organizationId,
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

    return createdAppointment;
  });
}

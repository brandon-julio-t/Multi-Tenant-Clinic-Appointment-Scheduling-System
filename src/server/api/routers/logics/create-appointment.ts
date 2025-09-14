import { tz } from "@date-fns/tz";
import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { areIntervalsOverlapping, endOfDay, startOfDay } from "date-fns";
import z from "zod";

export const createAppointmentInputSchema = z.object({
  organizationId: z.string().nonempty(),
  doctorId: z.string().nonempty(),
  serviceId: z.string().nonempty(),
  roomId: z.string().nonempty(),
  patientId: z.string().nonempty(),
  deviceIds: z.array(z.string().nonempty()).nonempty(),
  startAt: z.date(),
  endAt: z.date(),
});

export async function createAppointment({
  timezone,
  prisma,
  input,
}: {
  timezone: string;
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
        throw new TRPCError({
          code: "CONFLICT",
          message: "Doctor is already booked for this time",
        });
      }
    });

    const createdAppointment = await tx.appointment.create({
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

    return createdAppointment;
  });
}

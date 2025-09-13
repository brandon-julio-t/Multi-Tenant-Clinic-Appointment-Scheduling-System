import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
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
  prisma,
  input,
}: {
  prisma: PrismaClient;
  input: z.infer<typeof createAppointmentInputSchema>;
}) {
  return await prisma.$transaction(async (tx) => {
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

    return createdAppointment;
  });
}

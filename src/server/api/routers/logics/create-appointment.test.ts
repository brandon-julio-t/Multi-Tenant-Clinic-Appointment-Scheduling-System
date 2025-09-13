import { TRPCError } from "@trpc/server";
import { afterEach, expect, it } from "bun:test";
import { db } from "~/server/db";
import { createAppointment } from "./create-appointment";

const startAt = new Date("0001-01-01T09:00:00Z");
const endAt = new Date("0001-01-01T09:30:00Z");

async function setupSuccessfulInput() {
  const [organizationId, doctorId, serviceId, roomId, patientId, deviceIds] =
    await Promise.all([
      db.organization.findFirstOrThrow().then((org) => org?.id),
      db.doctor.findFirstOrThrow().then((doc) => doc?.id),
      db.service.findFirstOrThrow().then((service) => service?.id),
      db.room.findFirstOrThrow().then((room) => room?.id),
      db.patient.findFirstOrThrow().then((patient) => patient?.id),
      db.device
        .findMany()
        .then((devices) => devices.map((device) => device.id)),
    ]);

  return {
    organizationId,
    doctorId,
    serviceId,
    roomId,
    patientId,
    deviceIds,
    startAt,
    endAt,
  };
}

afterEach(async () => {
  await db.appointment.deleteMany({
    where: {
      startAt: { gte: startAt },
      endAt: { lte: endAt },
    },
  });
});

it("should create appointment successfully", async () => {
  const input = await setupSuccessfulInput();

  const appointment = await createAppointment({
    prisma: db,
    input: input,
  });

  const createdAppointmentsCount = await db.appointment.count({
    where: {
      startAt: { gte: input.startAt },
      endAt: { lte: input.endAt },
      roomId: input.roomId,
    },
  });

  expect(appointment).toBeDefined();

  expect(typeof appointment.id === "string").toBeTruthy();

  expect(appointment.createdAt instanceof Date).toBeTruthy();

  expect(appointment.updatedAt instanceof Date).toBeTruthy();

  expect(appointment).toMatchObject({
    organizationId: input.organizationId,
    doctorId: input.doctorId,
    patientId: input.patientId,
    roomId: input.roomId,
    serviceId: input.serviceId,
    startAt: input.startAt,
    endAt: input.endAt,
  });

  expect(createdAppointmentsCount).toBe(1);
});

it("should throw an error if the room is already booked for the same time", async () => {
  const input = await setupSuccessfulInput();

  const appointment1 = await createAppointment({
    prisma: db,
    input: input,
  });

  expect(appointment1).toBeDefined();

  try {
    await createAppointment({
      prisma: db,
      input: input,
    });

    expect(false, "Should not create appointment").toBeTruthy();
  } catch (error) {
    expect(error).toBeDefined();

    expect(error instanceof TRPCError).toBeTruthy();

    const trpcError = error as TRPCError;

    expect(trpcError.code).toBe("CONFLICT");

    expect(trpcError.message).toBe("Room is already booked for this time");
  }

  const createdAppointmentsCount = await db.appointment.count({
    where: {
      startAt: { gte: input.startAt },
      endAt: { lte: input.endAt },
      roomId: input.roomId,
    },
  });

  expect(createdAppointmentsCount).toBe(1);
});

it("should withstand thundering herd of create appointment requests into the same room and time slots at the same time", async () => {
  const input = await setupSuccessfulInput();

  const concurrent = 1_000;

  const appointments = await Promise.allSettled(
    Array.from({ length: concurrent }, async () => {
      return await createAppointment({
        prisma: db,
        input: input,
      });
    }),
  );

  const createdAppointmentsCount = await db.appointment.count({
    where: {
      startAt: { gte: input.startAt },
      endAt: { lte: input.endAt },
      roomId: input.roomId,
    },
  });

  const success = appointments.filter((x) => x.status === "fulfilled").length;
  const failed = appointments.filter((x) => x.status === "rejected").length;

  expect(success).toBe(1);
  expect(failed).toBe(concurrent - 1);
  expect(createdAppointmentsCount).toBe(1);
});

import { TRPCError } from "@trpc/server";
import { afterEach, expect, it } from "bun:test";
import { db } from "~/server/db";
import { createAppointment } from "./create-appointment";

const timezone = "UTC";
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
      startAt: { gte: new Date("0001-01-01T00:00:00Z") },
      endAt: { lte: new Date("0001-12-31T23:59:59Z") },
    },
  });
});

it("should create appointment successfully", async () => {
  const input = await setupSuccessfulInput();

  const appointment = await createAppointment({
    timezone,
    organizationId: input.organizationId,
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
    timezone,
    organizationId: input.organizationId,
    prisma: db,
    input: input,
  });

  expect(appointment1).toBeDefined();

  try {
    await createAppointment({
      timezone,
      organizationId: input.organizationId,
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

it("should throw an error if the room is already booked with overlapping time #1", async () => {
  const input = await setupSuccessfulInput();

  const appointment1 = await createAppointment({
    timezone,
    organizationId: input.organizationId,
    prisma: db,
    input: {
      ...input,
      startAt: new Date("0001-01-01T09:00:00Z"),
      endAt: new Date("0001-01-01T09:30:00Z"),
    },
  });

  expect(appointment1).toBeDefined();

  try {
    await createAppointment({
      timezone,
      organizationId: input.organizationId,
      prisma: db,
      input: {
        ...input,
        startAt: new Date("0001-01-01T08:00:00Z"),
        endAt: new Date("0001-01-01T10:00:00Z"),
      },
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
      roomId: input.roomId,
      startAt: { gte: new Date("0001-01-01T09:00:00Z") },
      endAt: { lte: new Date("0001-01-01T09:30:00Z") },
    },
  });

  expect(createdAppointmentsCount).toBe(1);
});

it("should throw an error if the room is already booked with overlapping time #2", async () => {
  const input = await setupSuccessfulInput();

  const appointment1 = await createAppointment({
    timezone,
    organizationId: input.organizationId,
    prisma: db,
    input: {
      ...input,
      startAt: new Date("0001-01-01T08:00:00Z"),
      endAt: new Date("0001-01-01T10:00:00Z"),
    },
  });

  expect(appointment1).toBeDefined();

  try {
    await createAppointment({
      timezone,
      organizationId: input.organizationId,
      prisma: db,
      input: {
        ...input,
        startAt: new Date("0001-01-01T09:00:00Z"),
        endAt: new Date("0001-01-01T09:30:00Z"),
      },
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
      roomId: input.roomId,
      startAt: { gte: new Date("0001-01-01T08:00:00Z") },
      endAt: { lte: new Date("0001-01-01T10:00:00Z") },
    },
  });

  expect(createdAppointmentsCount).toBe(1);
});

it("should withstand thundering herd of create appointment requests into the same room and time slots at the same time", async () => {
  const input = await setupSuccessfulInput();

  const concurrent = 100;

  const appointments = await Promise.allSettled(
    Array.from({ length: concurrent }, async () => {
      return await createAppointment({
        timezone,
        organizationId: input.organizationId,
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

it("should throw an error if the doctor is already booked for the same time", async () => {
  const input = await setupSuccessfulInput();

  const appointment1 = await createAppointment({
    timezone,
    organizationId: input.organizationId,
    prisma: db,
    input: input,
  });

  expect(appointment1).toBeDefined();

  // Create a second appointment with different room but same doctor and time
  const [differentRoomId] = await Promise.all([
    db.room
      .findMany()
      .then((rooms) => rooms.find((room) => room.id !== input.roomId)?.id),
  ]);

  expect(differentRoomId).toBeDefined();

  try {
    await createAppointment({
      timezone,
      organizationId: input.organizationId,
      prisma: db,
      input: {
        ...input,
        roomId: differentRoomId!,
      },
    });

    expect(false, "Should not create appointment").toBeTruthy();
  } catch (error) {
    expect(error).toBeDefined();

    expect(error instanceof TRPCError).toBeTruthy();

    const trpcError = error as TRPCError;

    expect(trpcError.code).toBe("CONFLICT");

    expect(trpcError.message).toBe("Doctor is already booked for this time");
  }

  const createdAppointmentsCount = await db.appointment.count({
    where: {
      startAt: { gte: input.startAt },
      endAt: { lte: input.endAt },
      doctorId: input.doctorId,
    },
  });

  expect(createdAppointmentsCount).toBe(1);
});

it("should throw an error if the doctor is already booked with overlapping time #1", async () => {
  const input = await setupSuccessfulInput();

  const appointment1 = await createAppointment({
    timezone,
    organizationId: input.organizationId,
    prisma: db,
    input: {
      ...input,
      startAt: new Date("0001-01-01T09:00:00Z"),
      endAt: new Date("0001-01-01T09:30:00Z"),
    },
  });

  expect(appointment1).toBeDefined();

  // Create a second appointment with different room but same doctor and overlapping time
  const [differentRoomId] = await Promise.all([
    db.room
      .findMany()
      .then((rooms) => rooms.find((room) => room.id !== input.roomId)?.id),
  ]);

  expect(differentRoomId).toBeDefined();

  try {
    await createAppointment({
      timezone,
      organizationId: input.organizationId,
      prisma: db,
      input: {
        ...input,
        roomId: differentRoomId!,
        startAt: new Date("0001-01-01T08:00:00Z"),
        endAt: new Date("0001-01-01T10:00:00Z"),
      },
    });

    expect(false, "Should not create appointment").toBeTruthy();
  } catch (error) {
    expect(error).toBeDefined();

    expect(error instanceof TRPCError).toBeTruthy();

    const trpcError = error as TRPCError;

    expect(trpcError.code).toBe("CONFLICT");

    expect(trpcError.message).toBe("Doctor is already booked for this time");
  }

  const createdAppointmentsCount = await db.appointment.count({
    where: {
      doctorId: input.doctorId,
      startAt: { gte: new Date("0001-01-01T09:00:00Z") },
      endAt: { lte: new Date("0001-01-01T09:30:00Z") },
    },
  });

  expect(createdAppointmentsCount).toBe(1);
});

it("should throw an error if the doctor is already booked with overlapping time #2", async () => {
  const input = await setupSuccessfulInput();

  const appointment1 = await createAppointment({
    timezone,
    organizationId: input.organizationId,
    prisma: db,
    input: {
      ...input,
      startAt: new Date("0001-01-01T08:00:00Z"),
      endAt: new Date("0001-01-01T10:00:00Z"),
    },
  });

  expect(appointment1).toBeDefined();

  // Create a second appointment with different room but same doctor and overlapping time
  const [differentRoomId] = await Promise.all([
    db.room
      .findMany()
      .then((rooms) => rooms.find((room) => room.id !== input.roomId)?.id),
  ]);

  expect(differentRoomId).toBeDefined();

  try {
    await createAppointment({
      timezone,
      organizationId: input.organizationId,
      prisma: db,
      input: {
        ...input,
        roomId: differentRoomId!,
        startAt: new Date("0001-01-01T09:00:00Z"),
        endAt: new Date("0001-01-01T09:30:00Z"),
      },
    });

    expect(false, "Should not create appointment").toBeTruthy();
  } catch (error) {
    expect(error).toBeDefined();

    expect(error instanceof TRPCError).toBeTruthy();

    const trpcError = error as TRPCError;

    expect(trpcError.code).toBe("CONFLICT");

    expect(trpcError.message).toBe("Doctor is already booked for this time");
  }

  const createdAppointmentsCount = await db.appointment.count({
    where: {
      doctorId: input.doctorId,
      startAt: { gte: new Date("0001-01-01T08:00:00Z") },
      endAt: { lte: new Date("0001-01-01T10:00:00Z") },
    },
  });

  expect(createdAppointmentsCount).toBe(1);
});

it("should withstand thundering herd of create appointment requests for the same doctor and time slots at the same time", async () => {
  const input = await setupSuccessfulInput();

  const concurrent = 100;

  const availableRooms = await db.room.findMany();

  const appointments = await Promise.allSettled(
    Array.from({ length: concurrent }, async (_, index) => {
      // Use different rooms for each concurrent request
      const differentRoomId = availableRooms[index % availableRooms.length]?.id;
      if (!differentRoomId) {
        throw new Error("No available rooms found");
      }

      return await createAppointment({
        timezone,
        organizationId: input.organizationId,
        prisma: db,
        input: {
          ...input,
          roomId: differentRoomId,
        },
      });
    }),
  );

  const createdAppointmentsCount = await db.appointment.count({
    where: {
      startAt: { gte: input.startAt },
      endAt: { lte: input.endAt },
      doctorId: input.doctorId,
    },
  });

  const success = appointments.filter((x) => x.status === "fulfilled").length;
  const failed = appointments.filter((x) => x.status === "rejected").length;

  expect(success).toBe(1);
  expect(failed).toBe(concurrent - 1);
  expect(createdAppointmentsCount).toBe(1);
});

import { db } from "../src/server/db";
import { hashPassword } from "better-auth/crypto";

async function main() {
  console.log("🌱 Starting database seed...");

  // Create organizations
  const organizations = await Promise.all([
    db.organization.upsert({
      where: { id: "org_medical_center" },
      update: {},
      create: {
        id: "org_medical_center",
        name: "City Medical Center",
        slug: "city-medical-center",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
    }),
    db.organization.upsert({
      where: { id: "org_family_practice" },
      update: {},
      create: {
        id: "org_family_practice",
        name: "Family Practice Associates",
        slug: "family-practice-associates",
        createdAt: new Date("2024-01-15T00:00:00Z"),
      },
    }),
    db.organization.upsert({
      where: { id: "org_specialty_clinic" },
      update: {},
      create: {
        id: "org_specialty_clinic",
        name: "Specialty Care Clinic",
        slug: "specialty-care-clinic",
        createdAt: new Date("2024-02-01T00:00:00Z"),
      },
    }),
  ]);

  console.log(`✅ Created ${organizations.length} organizations`);

  // Create users and link them as members to organizations
  const users = await Promise.all([
    // Admin users
    db.user.upsert({
      where: { id: "user_admin_1" },
      update: {},
      create: {
        id: "user_admin_1",
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@citymedical.com",
        emailVerified: true,
      },
    }),
    db.user.upsert({
      where: { id: "user_admin_2" },
      update: {},
      create: {
        id: "user_admin_2",
        name: "Dr. Michael Chen",
        email: "michael.chen@familypractice.com",
        emailVerified: true,
      },
    }),
    // Staff users
    db.user.upsert({
      where: { id: "user_staff_1" },
      update: {},
      create: {
        id: "user_staff_1",
        name: "Emily Rodriguez",
        email: "emily.rodriguez@citymedical.com",
        emailVerified: true,
      },
    }),
    db.user.upsert({
      where: { id: "user_staff_2" },
      update: {},
      create: {
        id: "user_staff_2",
        name: "James Wilson",
        email: "james.wilson@familypractice.com",
        emailVerified: true,
      },
    }),
    // Patient users
    db.user.upsert({
      where: { id: "user_patient_1" },
      update: {},
      create: {
        id: "user_patient_1",
        name: "John Smith",
        email: "john.smith@email.com",
        emailVerified: true,
      },
    }),
    db.user.upsert({
      where: { id: "user_patient_2" },
      update: {},
      create: {
        id: "user_patient_2",
        name: "Maria Garcia",
        email: "maria.garcia@email.com",
        emailVerified: true,
      },
    }),
    db.user.upsert({
      where: { id: "user_patient_3" },
      update: {},
      create: {
        id: "user_patient_3",
        name: "Anna Johnson",
        email: "anna.johnson@email.com",
        emailVerified: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create authentication accounts for users
  const hashedPassword = await hashPassword("password123");

  const accounts = await Promise.all([
    db.account.upsert({
      where: { id: "account_admin_1" },
      update: { password: hashedPassword },
      create: {
        id: "account_admin_1",
        accountId: "user_admin_1",
        providerId: "credential",
        userId: "user_admin_1",
        password: hashedPassword,
      },
    }),
    db.account.upsert({
      where: { id: "account_admin_2" },
      update: { password: hashedPassword },
      create: {
        id: "account_admin_2",
        accountId: "user_admin_2",
        providerId: "credential",
        userId: "user_admin_2",
        password: hashedPassword,
      },
    }),
    db.account.upsert({
      where: { id: "account_staff_1" },
      update: { password: hashedPassword },
      create: {
        id: "account_staff_1",
        accountId: "user_staff_1",
        providerId: "credential",
        userId: "user_staff_1",
        password: hashedPassword,
      },
    }),
    db.account.upsert({
      where: { id: "account_staff_2" },
      update: { password: hashedPassword },
      create: {
        id: "account_staff_2",
        accountId: "user_staff_2",
        providerId: "credential",
        userId: "user_staff_2",
        password: hashedPassword,
      },
    }),
    // Patient accounts
    db.account.upsert({
      where: { id: "account_patient_1" },
      update: { password: hashedPassword },
      create: {
        id: "account_patient_1",
        accountId: "user_patient_1",
        providerId: "credential",
        userId: "user_patient_1",
        password: hashedPassword,
      },
    }),
    db.account.upsert({
      where: { id: "account_patient_2" },
      update: { password: hashedPassword },
      create: {
        id: "account_patient_2",
        accountId: "user_patient_2",
        providerId: "credential",
        userId: "user_patient_2",
        password: hashedPassword,
      },
    }),
    db.account.upsert({
      where: { id: "account_patient_3" },
      update: { password: hashedPassword },
      create: {
        id: "account_patient_3",
        accountId: "user_patient_3",
        providerId: "credential",
        userId: "user_patient_3",
        password: hashedPassword,
      },
    }),
  ]);

  console.log(`✅ Created ${accounts.length} authentication accounts`);

  // Create sessions with active organization
  const sessions = await Promise.all([
    db.session.create({
      data: {
        id: "session_admin_1",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        token: "session_token_admin_1_" + Date.now(),
        userId: "user_admin_1",
        activeOrganizationId: "org_medical_center",
      },
    }),
    db.session.create({
      data: {
        id: "session_admin_2",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        token: "session_token_admin_2_" + Date.now(),
        userId: "user_admin_2",
        activeOrganizationId: "org_family_practice",
      },
    }),
    db.session.create({
      data: {
        id: "session_staff_1",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        token: "session_token_staff_1_" + Date.now(),
        userId: "user_staff_1",
        activeOrganizationId: "org_medical_center",
      },
    }),
    db.session.create({
      data: {
        id: "session_staff_2",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        token: "session_token_staff_2_" + Date.now(),
        userId: "user_staff_2",
        activeOrganizationId: "org_family_practice",
      },
    }),
    // Patient sessions
    db.session.create({
      data: {
        id: "session_patient_1",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        token: "session_token_patient_1_" + Date.now(),
        userId: "user_patient_1",
        activeOrganizationId: "org_medical_center",
      },
    }),
    db.session.create({
      data: {
        id: "session_patient_2",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        token: "session_token_patient_2_" + Date.now(),
        userId: "user_patient_2",
        activeOrganizationId: "org_medical_center",
      },
    }),
    db.session.create({
      data: {
        id: "session_patient_3",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        token: "session_token_patient_3_" + Date.now(),
        userId: "user_patient_3",
        activeOrganizationId: "org_family_practice",
      },
    }),
  ]);

  console.log(
    `✅ Created ${sessions.length} sessions with active organizations`,
  );

  // Create organization members
  const members = await Promise.all([
    // City Medical Center members
    db.member.upsert({
      where: { id: "member_admin_1" },
      update: {},
      create: {
        id: "member_admin_1",
        organizationId: "org_medical_center",
        userId: "user_admin_1",
        role: "admin",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
    }),
    db.member.upsert({
      where: { id: "member_staff_1" },
      update: {},
      create: {
        id: "member_staff_1",
        organizationId: "org_medical_center",
        userId: "user_staff_1",
        role: "staff",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
    }),
    // Family Practice members
    db.member.upsert({
      where: { id: "member_admin_2" },
      update: {},
      create: {
        id: "member_admin_2",
        organizationId: "org_family_practice",
        userId: "user_admin_2",
        role: "admin",
        createdAt: new Date("2024-01-15T00:00:00Z"),
      },
    }),
    db.member.upsert({
      where: { id: "member_staff_2" },
      update: {},
      create: {
        id: "member_staff_2",
        organizationId: "org_family_practice",
        userId: "user_staff_2",
        role: "staff",
        createdAt: new Date("2024-01-15T00:00:00Z"),
      },
    }),
  ]);

  console.log(`✅ Created ${members.length} organization members`);

  // Create doctors for each organization
  const doctors = await Promise.all([
    // City Medical Center doctors
    db.doctor.create({
      data: {
        id: "doctor_sarah_johnson",
        organizationId: "org_medical_center",
        name: "Dr. Sarah Johnson",
      },
    }),
    db.doctor.create({
      data: {
        id: "doctor_emily_davis",
        organizationId: "org_medical_center",
        name: "Dr. Emily Davis",
      },
    }),
    db.doctor.create({
      data: {
        id: "doctor_robert_miller",
        organizationId: "org_medical_center",
        name: "Dr. Robert Miller",
      },
    }),
    // Family Practice doctors
    db.doctor.create({
      data: {
        id: "doctor_michael_chen",
        organizationId: "org_family_practice",
        name: "Dr. Michael Chen",
      },
    }),
    db.doctor.create({
      data: {
        id: "doctor_lisa_parker",
        organizationId: "org_family_practice",
        name: "Dr. Lisa Parker",
      },
    }),
    // Specialty Clinic doctors
    db.doctor.create({
      data: {
        id: "doctor_david_kim",
        organizationId: "org_specialty_clinic",
        name: "Dr. David Kim",
      },
    }),
  ]);

  console.log(`✅ Created ${doctors.length} doctors`);

  // Create services
  const services = await Promise.all([
    // City Medical Center services
    db.service.create({
      data: {
        id: "service_general_checkup",
        organizationId: "org_medical_center",
        name: "General Checkup",
      },
    }),
    db.service.create({
      data: {
        id: "service_cardiology",
        organizationId: "org_medical_center",
        name: "Cardiology Consultation",
      },
    }),
    db.service.create({
      data: {
        id: "service_dermatology",
        organizationId: "org_medical_center",
        name: "Dermatology",
      },
    }),
    db.service.create({
      data: {
        id: "service_orthopedics",
        organizationId: "org_medical_center",
        name: "Orthopedics",
      },
    }),
    db.service.create({
      data: {
        id: "service_pediatrics",
        organizationId: "org_medical_center",
        name: "Pediatrics",
      },
    }),
    // Family Practice services
    db.service.create({
      data: {
        id: "service_family_medicine",
        organizationId: "org_family_practice",
        name: "Family Medicine",
      },
    }),
    db.service.create({
      data: {
        id: "service_annual_physical",
        organizationId: "org_family_practice",
        name: "Annual Physical",
      },
    }),
    db.service.create({
      data: {
        id: "service_vaccinations",
        organizationId: "org_family_practice",
        name: "Vaccinations",
      },
    }),
    db.service.create({
      data: {
        id: "service_womens_health",
        organizationId: "org_family_practice",
        name: "Women's Health",
      },
    }),
    // Specialty Clinic services
    db.service.create({
      data: {
        id: "service_neurology",
        organizationId: "org_specialty_clinic",
        name: "Neurology",
      },
    }),
    db.service.create({
      data: {
        id: "service_psychiatry",
        organizationId: "org_specialty_clinic",
        name: "Psychiatry",
      },
    }),
  ]);

  console.log(`✅ Created ${services.length} services`);

  // Create rooms for each organization
  const rooms = await Promise.all([
    // City Medical Center rooms
    db.room.create({
      data: {
        id: "room_mc_101",
        organizationId: "org_medical_center",
        name: "Room 101",
      },
    }),
    db.room.create({
      data: {
        id: "room_mc_102",
        organizationId: "org_medical_center",
        name: "Room 102",
      },
    }),
    db.room.create({
      data: {
        id: "room_mc_103",
        organizationId: "org_medical_center",
        name: "Room 103",
      },
    }),
    db.room.create({
      data: {
        id: "room_mc_104",
        organizationId: "org_medical_center",
        name: "Room 104",
      },
    }),
    // Family Practice rooms
    db.room.create({
      data: {
        id: "room_fp_201",
        organizationId: "org_family_practice",
        name: "Consultation Room 1",
      },
    }),
    db.room.create({
      data: {
        id: "room_fp_202",
        organizationId: "org_family_practice",
        name: "Consultation Room 2",
      },
    }),
    // Specialty Clinic rooms
    db.room.create({
      data: {
        id: "room_sc_301",
        organizationId: "org_specialty_clinic",
        name: "Neurology Suite",
      },
    }),
  ]);

  console.log(`✅ Created ${rooms.length} rooms`);

  // Create devices
  const devices = await Promise.all([
    // City Medical Center devices
    db.device.create({
      data: {
        id: "device_mc_ecg",
        organizationId: "org_medical_center",
        name: "ECG Machine",
      },
    }),
    db.device.create({
      data: {
        id: "device_mc_ultrasound",
        organizationId: "org_medical_center",
        name: "Ultrasound Scanner",
      },
    }),
    db.device.create({
      data: {
        id: "device_mc_xray",
        organizationId: "org_medical_center",
        name: "X-Ray Machine",
      },
    }),
    db.device.create({
      data: {
        id: "device_mc_blood_pressure",
        organizationId: "org_medical_center",
        name: "Blood Pressure Monitor",
      },
    }),
    db.device.create({
      data: {
        id: "device_mc_otoscope",
        organizationId: "org_medical_center",
        name: "Otoscopes",
      },
    }),
    // Family Practice devices
    db.device.create({
      data: {
        id: "device_fp_scale",
        organizationId: "org_family_practice",
        name: "Digital Scale",
      },
    }),
    db.device.create({
      data: {
        id: "device_fp_thermometer",
        organizationId: "org_family_practice",
        name: "Digital Thermometer",
      },
    }),
    db.device.create({
      data: {
        id: "device_fp_bp_monitor",
        organizationId: "org_family_practice",
        name: "Blood Pressure Monitor",
      },
    }),
    // Specialty Clinic devices
    db.device.create({
      data: {
        id: "device_sc_eeg",
        organizationId: "org_specialty_clinic",
        name: "EEG Machine",
      },
    }),
    db.device.create({
      data: {
        id: "device_sc_mri",
        organizationId: "org_specialty_clinic",
        name: "MRI Scanner",
      },
    }),
  ]);

  console.log(`✅ Created ${devices.length} devices`);

  // Create patients for each organization
  const patients = await Promise.all([
    // City Medical Center patients
    db.patient.create({
      data: {
        id: "patient_mc_001",
        organizationId: "org_medical_center",
        name: "John Smith",
      },
    }),
    db.patient.create({
      data: {
        id: "patient_mc_002",
        organizationId: "org_medical_center",
        name: "Maria Garcia",
      },
    }),
    db.patient.create({
      data: {
        id: "patient_mc_003",
        organizationId: "org_medical_center",
        name: "David Brown",
      },
    }),
    db.patient.create({
      data: {
        id: "patient_mc_004",
        organizationId: "org_medical_center",
        name: "Jennifer Davis",
      },
    }),
    db.patient.create({
      data: {
        id: "patient_mc_005",
        organizationId: "org_medical_center",
        name: "Robert Wilson",
      },
    }),
    // Family Practice patients
    db.patient.create({
      data: {
        id: "patient_fp_001",
        organizationId: "org_family_practice",
        name: "Anna Johnson",
      },
    }),
    db.patient.create({
      data: {
        id: "patient_fp_002",
        organizationId: "org_family_practice",
        name: "Carlos Rodriguez",
      },
    }),
    db.patient.create({
      data: {
        id: "patient_fp_003",
        organizationId: "org_family_practice",
        name: "Linda Thompson",
      },
    }),
    // Specialty Clinic patients
    db.patient.create({
      data: {
        id: "patient_sc_001",
        organizationId: "org_specialty_clinic",
        name: "Mark Anderson",
      },
    }),
    db.patient.create({
      data: {
        id: "patient_sc_002",
        organizationId: "org_specialty_clinic",
        name: "Susan Lee",
      },
    }),
  ]);

  console.log(`✅ Created ${patients.length} patients`);

  // Create appointments
  const appointments = await Promise.all([
    // City Medical Center appointments
    db.appointment.create({
      data: {
        id: "appt_mc_001",
        organizationId: "org_medical_center",
        doctorId: "doctor_sarah_johnson",
        patientId: "patient_mc_001",
        roomId: "room_mc_101",
        startAt: new Date("2024-09-15T09:00:00Z"),
        endAt: new Date("2024-09-15T09:30:00Z"),
      },
    }),
    db.appointment.create({
      data: {
        id: "appt_mc_002",
        organizationId: "org_medical_center",
        doctorId: "doctor_emily_davis",
        patientId: "patient_mc_002",
        roomId: "room_mc_102",
        startAt: new Date("2024-09-15T10:00:00Z"),
        endAt: new Date("2024-09-15T10:45:00Z"),
      },
    }),
    db.appointment.create({
      data: {
        id: "appt_mc_003",
        organizationId: "org_medical_center",
        doctorId: "doctor_robert_miller",
        patientId: "patient_mc_003",
        roomId: "room_mc_103",
        startAt: new Date("2024-09-15T14:00:00Z"),
        endAt: new Date("2024-09-15T14:30:00Z"),
      },
    }),
    // Family Practice appointments
    db.appointment.create({
      data: {
        id: "appt_fp_001",
        organizationId: "org_family_practice",
        doctorId: "doctor_michael_chen",
        patientId: "patient_fp_001",
        roomId: "room_fp_201",
        startAt: new Date("2024-09-16T08:30:00Z"),
        endAt: new Date("2024-09-16T09:00:00Z"),
      },
    }),
    db.appointment.create({
      data: {
        id: "appt_fp_002",
        organizationId: "org_family_practice",
        doctorId: "doctor_lisa_parker",
        patientId: "patient_fp_002",
        roomId: "room_fp_202",
        startAt: new Date("2024-09-16T11:00:00Z"),
        endAt: new Date("2024-09-16T11:30:00Z"),
      },
    }),
    // Specialty Clinic appointments
    db.appointment.create({
      data: {
        id: "appt_sc_001",
        organizationId: "org_specialty_clinic",
        doctorId: "doctor_david_kim",
        patientId: "patient_sc_001",
        roomId: "room_sc_301",
        startAt: new Date("2024-09-17T13:00:00Z"),
        endAt: new Date("2024-09-17T14:00:00Z"),
      },
    }),
  ]);

  console.log(`✅ Created ${appointments.length} appointments`);

  // Create appointment-device associations
  const appointmentDevices = await Promise.all([
    db.appointmentDevice.create({
      data: {
        id: "appt_device_mc_001",
        appointmentId: "appt_mc_001",
        deviceId: "device_mc_blood_pressure",
      },
    }),
    db.appointmentDevice.create({
      data: {
        id: "appt_device_mc_002",
        appointmentId: "appt_mc_001",
        deviceId: "device_mc_otoscope",
      },
    }),
    db.appointmentDevice.create({
      data: {
        id: "appt_device_mc_003",
        appointmentId: "appt_mc_002",
        deviceId: "device_mc_ecg",
      },
    }),
    db.appointmentDevice.create({
      data: {
        id: "appt_device_fp_001",
        appointmentId: "appt_fp_001",
        deviceId: "device_fp_bp_monitor",
      },
    }),
    db.appointmentDevice.create({
      data: {
        id: "appt_device_fp_002",
        appointmentId: "appt_fp_002",
        deviceId: "device_fp_thermometer",
      },
    }),
    db.appointmentDevice.create({
      data: {
        id: "appt_device_sc_001",
        appointmentId: "appt_sc_001",
        deviceId: "device_sc_eeg",
      },
    }),
  ]);

  console.log(
    `✅ Created ${appointmentDevices.length} appointment-device associations`,
  );

  console.log("🎉 Database seeding completed successfully!");
}

await main().catch(async (e) => {
  console.error("❌ Error seeding database:", e);
  await db.$disconnect();
  process.exit(1);
});

await db.$disconnect();

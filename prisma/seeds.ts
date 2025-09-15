import { db } from "../src/server/db";
import { hashPassword } from "better-auth/crypto";
import { faker } from "@faker-js/faker";
import type { Organization } from "@prisma/client";

// Function to generate stress test data for existing organizations
async function generateStressTestData(organizations: Organization[]) {
  console.log(
    `🔄 Generating stress test data for ${organizations.length} organizations...`,
  );

  // Generate doctors
  console.log("👨‍⚕️ Generating doctors...");
  const doctors = [];
  for (let i = 0; i < 500; i++) {
    const orgIndex = i % organizations.length;
    const org = organizations[orgIndex];
    if (!org) continue;

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `Dr. ${firstName} ${lastName}`;
    const id = faker.string.uuid();

    try {
      const doctor = await db.doctor.create({
        data: {
          id,
          organizationId: org.id,
          name,
        },
      });
      doctors.push(doctor);
    } catch (error) {
      // Skip if doctor creation fails (might already exist)
      console.log(
        `⚠️  Skipping doctor creation: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  console.log(`✅ Created ${doctors.length} additional doctors`);

  // Generate doctor working hours
  console.log("🕒 Generating doctor working hours...");
  const workingHoursPromises = [];
  for (const doctor of doctors) {
    if (!doctor) continue;

    // Generate random working hours for each doctor
    const workingDays = faker.helpers.arrayElements([1, 2, 3, 4, 5], {
      min: 3,
      max: 5,
    }); // 3-5 working days per week

    for (const dayOfWeek of workingDays) {
      const startHour = faker.helpers.arrayElement([
        "08:00",
        "08:30",
        "09:00",
        "09:30",
        "10:00",
      ]);
      const duration = faker.helpers.arrayElement([8, 8.5, 9, 9.5, 10]); // 8-10 hour days
      const startDate = new Date(`2024-01-01T${startHour}:00Z`);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + duration);

      const endHour = endDate.toTimeString().slice(0, 5);
      const id = faker.string.uuid();

      workingHoursPromises.push(
        db.doctorWorkingHour.create({
          data: {
            id,
            doctorId: doctor.id,
            dayOfWeek,
            startHour,
            endHour,
            startAt: startDate,
            endAt: endDate,
          },
        }),
      );
    }
  }

  const doctorWorkingHours = await Promise.all(workingHoursPromises);
  console.log(
    `✅ Created ${doctorWorkingHours.length} additional doctor working hours`,
  );

  // Generate services
  console.log("🩺 Generating services...");
  const services = [];
  const medicalServices = [
    "Internal Medicine",
    "Surgery",
    "Emergency Medicine",
    "Radiology",
    "Pathology",
    "Anesthesiology",
    "Ophthalmology",
    "Otolaryngology",
    "Urology",
    "Gynecology",
    "Oncology",
    "Endocrinology",
    "Gastroenterology",
    "Pulmonology",
    "Nephrology",
    "Rheumatology",
    "Hematology",
    "Infectious Diseases",
    "Sports Medicine",
    "Physical Therapy",
    "Occupational Therapy",
    "Mental Health Counseling",
    "Nutrition Counseling",
    "Diabetes Management",
    "Hypertension Management",
    "Asthma Management",
    "Allergy Testing",
    "Immunizations",
    "Wellness Exams",
    "Preventive Care",
    "Chronic Disease Management",
    "Pain Management",
    "Sleep Medicine",
    "Geriatric Care",
    "Pediatric Care",
    "Adolescent Medicine",
    "Maternity Care",
    "Fertility Services",
    "Genetic Counseling",
  ];

  for (let i = 0; i < 200; i++) {
    const orgIndex = i % organizations.length;
    const org = organizations[orgIndex];
    if (!org) continue;

    const serviceName = medicalServices[i % medicalServices.length];
    const id = faker.string.uuid();

    try {
      const service = await db.service.create({
        data: {
          id,
          organizationId: org.id,
          name: serviceName!,
          durationMinutes: faker.helpers.arrayElement([15, 30, 45, 60, 90]),
        },
      });
      services.push(service);
    } catch (error) {
      console.log(
        `⚠️  Skipping service creation: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  console.log(`✅ Created ${services.length} additional services`);

  // Generate patients
  console.log("👥 Generating patients...");
  const patients = [];
  for (let i = 0; i < 1000; i++) {
    const orgIndex = i % organizations.length;
    const org = organizations[orgIndex];
    if (!org) continue;

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const id = faker.string.uuid();

    try {
      const patient = await db.patient.create({
        data: {
          id,
          organizationId: org.id,
          name,
        },
      });
      patients.push(patient);
    } catch (error) {
      console.log(
        `⚠️  Skipping patient creation: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  console.log(`✅ Created ${patients.length} additional patients`);

  console.log("\n🎯 STRESS TEST DATA ADDED SUCCESSFULLY!");
  console.log(`🏢 Organizations: ${organizations.length}`);
  console.log(`👨‍⚕️ Doctors: ${doctors.length}`);
  console.log(`🕒 Doctor Working Hours: ${doctorWorkingHours.length}`);
  console.log(`🩺 Services: ${services.length}`);
  console.log(`👥 Patients: ${patients.length}`);
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Check if data already exists
  const existingOrganizations = await db.organization.count();
  if (existingOrganizations > 0) {
    console.log("📊 Database already has data. Adding stress test data...");

    // Get existing organizations for stress testing
    const organizations = await db.organization.findMany();

    // Skip to the stress test data generation
    await generateStressTestData(organizations);
    return;
  }

  console.log("🆕 Creating fresh database seed...");

  // Create organizations
  const organizations = await Promise.all([
    // Keep existing organizations
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
    // Add many more organizations for stress testing
    ...Array.from({ length: 37 }, (_, i) => {
      const orgName = faker.company.name();
      const slug = faker.helpers.slugify(orgName).toLowerCase() + `-${i + 4}`;
      const id = `org_${slug}`;
      return db.organization.upsert({
        where: { id },
        update: {},
        create: {
          id,
          name: orgName,
          slug,
          createdAt: faker.date.between({
            from: new Date("2024-01-01T00:00:00Z"),
            to: new Date("2025-12-31T23:59:59Z"),
          }),
        },
      });
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

  // Create sessions with active organization (skip if already exists)
  try {
    const sessions = await Promise.all([
      db.session.upsert({
        where: { id: "session_admin_1" },
        update: {},
        create: {
          id: "session_admin_1",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          token: "session_token_admin_1_" + Date.now(),
          userId: "user_admin_1",
          activeOrganizationId: "org_medical_center",
        },
      }),
      db.session.upsert({
        where: { id: "session_admin_2" },
        update: {},
        create: {
          id: "session_admin_2",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          token: "session_token_admin_2_" + Date.now(),
          userId: "user_admin_2",
          activeOrganizationId: "org_family_practice",
        },
      }),
      db.session.upsert({
        where: { id: "session_staff_1" },
        update: {},
        create: {
          id: "session_staff_1",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          token: "session_token_staff_1_" + Date.now(),
          userId: "user_staff_1",
          activeOrganizationId: "org_medical_center",
        },
      }),
      db.session.upsert({
        where: { id: "session_staff_2" },
        update: {},
        create: {
          id: "session_staff_2",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          token: "session_token_staff_2_" + Date.now(),
          userId: "user_staff_2",
          activeOrganizationId: "org_family_practice",
        },
      }),
      // Patient sessions
      db.session.upsert({
        where: { id: "session_patient_1" },
        update: {},
        create: {
          id: "session_patient_1",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          token: "session_token_patient_1_" + Date.now(),
          userId: "user_patient_1",
          activeOrganizationId: "org_medical_center",
        },
      }),
      db.session.upsert({
        where: { id: "session_patient_2" },
        update: {},
        create: {
          id: "session_patient_2",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          token: "session_token_patient_2_" + Date.now(),
          userId: "user_patient_2",
          activeOrganizationId: "org_medical_center",
        },
      }),
      db.session.upsert({
        where: { id: "session_patient_3" },
        update: {},
        create: {
          id: "session_patient_3",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          token: "session_token_patient_3_" + Date.now(),
          userId: "user_patient_3",
          activeOrganizationId: "org_family_practice",
        },
      }),
    ]);

    console.log(
      `✅ Created/Updated ${sessions.length} sessions with active organizations`,
    );
  } catch (error) {
    console.log(
      `⚠️  Skipping session creation (better-auth tables may already have data): ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Create organization members
  try {
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

    console.log(`✅ Created/Updated ${members.length} organization members`);
  } catch (error) {
    console.log(
      `⚠️  Skipping member creation: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Create doctors for each organization
  const doctors = await Promise.all([
    // Keep existing doctors (use upsert to handle existing data)
    db.doctor.upsert({
      where: { id: "doctor_sarah_johnson" },
      update: {},
      create: {
        id: "doctor_sarah_johnson",
        organizationId: "org_medical_center",
        name: "Dr. Sarah Johnson",
      },
    }),
    db.doctor.upsert({
      where: { id: "doctor_emily_davis" },
      update: {},
      create: {
        id: "doctor_emily_davis",
        organizationId: "org_medical_center",
        name: "Dr. Emily Davis",
      },
    }),
    db.doctor.upsert({
      where: { id: "doctor_robert_miller" },
      update: {},
      create: {
        id: "doctor_robert_miller",
        organizationId: "org_medical_center",
        name: "Dr. Robert Miller",
      },
    }),
    db.doctor.upsert({
      where: { id: "doctor_michael_chen" },
      update: {},
      create: {
        id: "doctor_michael_chen",
        organizationId: "org_family_practice",
        name: "Dr. Michael Chen",
      },
    }),
    db.doctor.upsert({
      where: { id: "doctor_lisa_parker" },
      update: {},
      create: {
        id: "doctor_lisa_parker",
        organizationId: "org_family_practice",
        name: "Dr. Lisa Parker",
      },
    }),
    db.doctor.upsert({
      where: { id: "doctor_david_kim" },
      update: {},
      create: {
        id: "doctor_david_kim",
        organizationId: "org_specialty_clinic",
        name: "Dr. David Kim",
      },
    }),
    // Add many more doctors for stress testing
    ...Array.from({ length: 194 }, (_, i) => {
      const orgIndex = (i + 3) % organizations.length; // Distribute across all organizations
      const org = organizations[orgIndex];
      if (!org) return null;

      const orgId = org.id;
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const name = `Dr. ${firstName} ${lastName}`;
      const id = faker.string.uuid();

      return db.doctor.create({
        data: {
          id,
          organizationId: orgId,
          name,
        },
      });
    }).filter(Boolean),
  ]);

  console.log(`✅ Created ${doctors.length} doctors`);

  // Create doctor working hours
  console.log("🕒 Creating doctor working hours...");
  const doctorWorkingHours = await Promise.all([
    // Working hours for Dr. Sarah Johnson (Medical Center) - Monday to Friday, 9 AM - 5 PM
    ...Array.from({ length: 5 }, (_, i) => {
      const dayOfWeek = i + 1; // Monday = 1, Tuesday = 2, etc.
      return db.doctorWorkingHour.upsert({
        where: { id: `wh_sarah_${dayOfWeek}` },
        update: {},
        create: {
          id: `wh_sarah_${dayOfWeek}`,
          doctorId: "doctor_sarah_johnson",
          dayOfWeek,
          startHour: "09:00",
          endHour: "17:00",
          startAt: new Date(`2024-01-01T09:00:00Z`),
          endAt: new Date(`2024-01-01T17:00:00Z`),
        },
      });
    }),
    // Working hours for Dr. Emily Davis (Medical Center) - Monday, Wednesday, Friday, 8 AM - 4 PM
    ...[1, 3, 5].map((dayOfWeek) =>
      db.doctorWorkingHour.upsert({
        where: { id: `wh_emily_${dayOfWeek}` },
        update: {},
        create: {
          id: `wh_emily_${dayOfWeek}`,
          doctorId: "doctor_emily_davis",
          dayOfWeek,
          startHour: "08:00",
          endHour: "16:00",
          startAt: new Date(`2024-01-01T08:00:00Z`),
          endAt: new Date(`2024-01-01T16:00:00Z`),
        },
      }),
    ),
    // Working hours for Dr. Robert Miller (Medical Center) - Tuesday, Thursday, 10 AM - 6 PM
    ...[2, 4].map((dayOfWeek) =>
      db.doctorWorkingHour.upsert({
        where: { id: `wh_robert_${dayOfWeek}` },
        update: {},
        create: {
          id: `wh_robert_${dayOfWeek}`,
          doctorId: "doctor_robert_miller",
          dayOfWeek,
          startHour: "10:00",
          endHour: "18:00",
          startAt: new Date(`2024-01-01T10:00:00Z`),
          endAt: new Date(`2024-01-01T18:00:00Z`),
        },
      }),
    ),
    // Working hours for Dr. Michael Chen (Family Practice) - Monday to Friday, 9 AM - 5 PM
    ...Array.from({ length: 5 }, (_, i) => {
      const dayOfWeek = i + 1;
      return db.doctorWorkingHour.upsert({
        where: { id: `wh_michael_${dayOfWeek}` },
        update: {},
        create: {
          id: `wh_michael_${dayOfWeek}`,
          doctorId: "doctor_michael_chen",
          dayOfWeek,
          startHour: "09:00",
          endHour: "17:00",
          startAt: new Date(`2024-01-01T09:00:00Z`),
          endAt: new Date(`2024-01-01T17:00:00Z`),
        },
      });
    }),
    // Working hours for Dr. Lisa Parker (Family Practice) - Monday, Wednesday, Friday, 8:30 AM - 4:30 PM
    ...[1, 3, 5].map((dayOfWeek) =>
      db.doctorWorkingHour.upsert({
        where: { id: `wh_lisa_${dayOfWeek}` },
        update: {},
        create: {
          id: `wh_lisa_${dayOfWeek}`,
          doctorId: "doctor_lisa_parker",
          dayOfWeek,
          startHour: "08:30",
          endHour: "16:30",
          startAt: new Date(`2024-01-01T08:30:00Z`),
          endAt: new Date(`2024-01-01T16:30:00Z`),
        },
      }),
    ),
    // Working hours for Dr. David Kim (Specialty Clinic) - Tuesday to Thursday, 9 AM - 5 PM
    ...[2, 3, 4].map((dayOfWeek) =>
      db.doctorWorkingHour.upsert({
        where: { id: `wh_david_${dayOfWeek}` },
        update: {},
        create: {
          id: `wh_david_${dayOfWeek}`,
          doctorId: "doctor_david_kim",
          dayOfWeek,
          startHour: "09:00",
          endHour: "17:00",
          startAt: new Date(`2024-01-01T09:00:00Z`),
          endAt: new Date(`2024-01-01T17:00:00Z`),
        },
      }),
    ),
    // Working hours for bulk generated doctors
    ...doctors.slice(6).flatMap((doctor, _doctorIndex) => {
      if (!doctor) return [];

      // Generate random working hours for bulk doctors
      const workingDays = faker.helpers.arrayElements([1, 2, 3, 4, 5], {
        min: 3,
        max: 5,
      }); // 3-5 working days per week
      return workingDays.map((dayOfWeek) => {
        const startHour = faker.helpers.arrayElement([
          "08:00",
          "08:30",
          "09:00",
          "09:30",
          "10:00",
        ]);
        const duration = faker.helpers.arrayElement([8, 8.5, 9, 9.5, 10]); // 8-10 hour days
        const startDate = new Date(`2024-01-01T${startHour}:00Z`);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + duration);

        const endHour = endDate.toTimeString().slice(0, 5);

        return db.doctorWorkingHour.create({
          data: {
            id: faker.string.uuid(),
            doctorId: doctor.id,
            dayOfWeek,
            startHour,
            endHour,
            startAt: startDate,
            endAt: endDate,
          },
        });
      });
    }),
  ]);

  console.log(`✅ Created ${doctorWorkingHours.length} doctor working hours`);

  // Create services
  const services = await Promise.all([
    // Keep existing services (use upsert to handle existing data)
    db.service.upsert({
      where: { id: "service_general_checkup" },
      update: {},
      create: {
        id: "service_general_checkup",
        organizationId: "org_medical_center",
        name: "General Checkup",
        durationMinutes: 30,
      },
    }),
    db.service.upsert({
      where: { id: "service_cardiology" },
      update: {},
      create: {
        id: "service_cardiology",
        organizationId: "org_medical_center",
        name: "Cardiology Consultation",
        durationMinutes: 45,
      },
    }),
    db.service.upsert({
      where: { id: "service_dermatology" },
      update: {},
      create: {
        id: "service_dermatology",
        organizationId: "org_medical_center",
        name: "Dermatology",
        durationMinutes: 30,
      },
    }),
    db.service.upsert({
      where: { id: "service_orthopedics" },
      update: {},
      create: {
        id: "service_orthopedics",
        organizationId: "org_medical_center",
        name: "Orthopedics",
        durationMinutes: 45,
      },
    }),
    db.service.upsert({
      where: { id: "service_pediatrics" },
      update: {},
      create: {
        id: "service_pediatrics",
        organizationId: "org_medical_center",
        name: "Pediatrics",
        durationMinutes: 30,
      },
    }),
    db.service.upsert({
      where: { id: "service_family_medicine" },
      update: {},
      create: {
        id: "service_family_medicine",
        organizationId: "org_family_practice",
        name: "Family Medicine",
        durationMinutes: 30,
      },
    }),
    db.service.upsert({
      where: { id: "service_annual_physical" },
      update: {},
      create: {
        id: "service_annual_physical",
        organizationId: "org_family_practice",
        name: "Annual Physical",
        durationMinutes: 60,
      },
    }),
    db.service.upsert({
      where: { id: "service_vaccinations" },
      update: {},
      create: {
        id: "service_vaccinations",
        organizationId: "org_family_practice",
        name: "Vaccinations",
        durationMinutes: 15,
      },
    }),
    db.service.upsert({
      where: { id: "service_womens_health" },
      update: {},
      create: {
        id: "service_womens_health",
        organizationId: "org_family_practice",
        name: "Women's Health",
        durationMinutes: 45,
      },
    }),
    db.service.upsert({
      where: { id: "service_neurology" },
      update: {},
      create: {
        id: "service_neurology",
        organizationId: "org_specialty_clinic",
        name: "Neurology",
        durationMinutes: 60,
      },
    }),
    db.service.upsert({
      where: { id: "service_psychiatry" },
      update: {},
      create: {
        id: "service_psychiatry",
        organizationId: "org_specialty_clinic",
        name: "Psychiatry",
        durationMinutes: 50,
      },
    }),
    // Add many more services for stress testing
    ...Array.from({ length: 88 }, (_, i) => {
      const medicalServices = [
        "Internal Medicine",
        "Surgery",
        "Emergency Medicine",
        "Radiology",
        "Pathology",
        "Anesthesiology",
        "Ophthalmology",
        "Otolaryngology",
        "Urology",
        "Gynecology",
        "Oncology",
        "Endocrinology",
        "Gastroenterology",
        "Pulmonology",
        "Nephrology",
        "Rheumatology",
        "Hematology",
        "Infectious Diseases",
        "Sports Medicine",
        "Physical Therapy",
        "Occupational Therapy",
        "Mental Health Counseling",
        "Nutrition Counseling",
        "Diabetes Management",
        "Hypertension Management",
        "Asthma Management",
        "Allergy Testing",
        "Immunizations",
        "Wellness Exams",
        "Preventive Care",
        "Chronic Disease Management",
        "Pain Management",
        "Sleep Medicine",
        "Geriatric Care",
        "Pediatric Care",
        "Adolescent Medicine",
        "Maternity Care",
        "Fertility Services",
        "Genetic Counseling",
        "Telemedicine Consultation",
        "Second Opinion",
        "Pre-operative Evaluation",
        "Post-operative Care",
        "Rehabilitation Services",
        "Home Health Services",
        "Urgent Care",
        "Walk-in Clinic",
        "Health Screening",
        "Diagnostic Testing",
        "Laboratory Services",
        "Imaging Services",
        "Pharmacy Services",
        "Medical Equipment Rental",
        "Home Medical Supplies",
        "Health Education",
        "Weight Management",
        "Smoking Cessation",
        "Stress Management",
        "Biofeedback Therapy",
        "Acupuncture",
        "Massage Therapy",
        "Chiropractic Care",
        "Podiatry",
        "Optometry",
        "Audiology",
        "Speech Therapy",
        "Cardiac Rehabilitation",
        "Pulmonary Rehabilitation",
        "Physical Medicine",
        "Nuclear Medicine",
        "Interventional Radiology",
        "Vascular Surgery",
        "Thoracic Surgery",
        "Neurosurgery",
        "Plastic Surgery",
        "Oral Surgery",
        "Maxillofacial Surgery",
        "Trauma Surgery",
        "Burn Care",
        "Wound Care",
        "IV Therapy",
        "Infusion Services",
        "Transfusion Services",
        "Dialysis",
        "Oxygen Therapy",
        "Ventilator Management",
        "Pain Management Clinic",
        "Headache Clinic",
        "Epilepsy Clinic",
        "Multiple Sclerosis Clinic",
      ];

      const orgIndex = (i + 3) % organizations.length;
      const org = organizations[orgIndex];
      if (!org) return null;

      const orgId = org.id;
      const serviceName = medicalServices[i % medicalServices.length];
      if (!serviceName) return null;

      const id = faker.string.uuid();

      return db.service.create({
        data: {
          id,
          organizationId: orgId,
          name: serviceName,
          durationMinutes: faker.helpers.arrayElement([15, 30, 45, 60, 90]),
        },
      });
    }).filter(Boolean),
  ]);

  console.log(`✅ Created ${services.length} services`);

  // Create rooms for each organization
  const rooms = await Promise.all([
    // Keep existing rooms (use upsert to handle existing data)
    db.room.upsert({
      where: { id: "room_mc_101" },
      update: {},
      create: {
        id: "room_mc_101",
        organizationId: "org_medical_center",
        name: "Room 101",
      },
    }),
    db.room.upsert({
      where: { id: "room_mc_102" },
      update: {},
      create: {
        id: "room_mc_102",
        organizationId: "org_medical_center",
        name: "Room 102",
      },
    }),
    db.room.upsert({
      where: { id: "room_mc_103" },
      update: {},
      create: {
        id: "room_mc_103",
        organizationId: "org_medical_center",
        name: "Room 103",
      },
    }),
    db.room.upsert({
      where: { id: "room_mc_104" },
      update: {},
      create: {
        id: "room_mc_104",
        organizationId: "org_medical_center",
        name: "Room 104",
      },
    }),
    db.room.upsert({
      where: { id: "room_fp_201" },
      update: {},
      create: {
        id: "room_fp_201",
        organizationId: "org_family_practice",
        name: "Consultation Room 1",
      },
    }),
    db.room.upsert({
      where: { id: "room_fp_202" },
      update: {},
      create: {
        id: "room_fp_202",
        organizationId: "org_family_practice",
        name: "Consultation Room 2",
      },
    }),
    db.room.upsert({
      where: { id: "room_sc_301" },
      update: {},
      create: {
        id: "room_sc_301",
        organizationId: "org_specialty_clinic",
        name: "Neurology Suite",
      },
    }),
    // Add many more rooms for stress testing
    ...Array.from({ length: 293 }, (_, i) => {
      const roomTypes = [
        "Consultation Room",
        "Examination Room",
        "Procedure Room",
        "Waiting Room",
        "Recovery Room",
        "Operating Room",
        "Imaging Suite",
        "Lab Room",
        "Therapy Room",
        "Office",
        "Conference Room",
        "Storage Room",
        "Nurse Station",
        "Pharmacy",
        "Reception Area",
        "Restroom",
        "Break Room",
        "Supply Room",
        "Equipment Room",
        "Patient Room",
        "Intensive Care Unit",
        "Emergency Room",
        "X-Ray Room",
        "MRI Suite",
        "CT Scan Room",
        "Ultrasound Room",
        "Cardiology Suite",
        "Surgery Suite",
      ];

      const orgIndex = (i + 3) % organizations.length;
      const org = organizations[orgIndex];
      if (!org) return null;

      const orgId = org.id;
      const roomType = roomTypes[i % roomTypes.length];
      const roomNumber = faker.number.int({ min: 100, max: 999 });
      const name = `${roomType} ${roomNumber}`;
      const id = faker.string.uuid();

      return db.room.create({
        data: {
          id,
          organizationId: orgId,
          name,
        },
      });
    }).filter(Boolean),
  ]);

  console.log(`✅ Created ${rooms.length} rooms`);

  // Create devices
  const devices = await Promise.all([
    // Keep existing devices (use upsert to handle existing data)
    db.device.upsert({
      where: { id: "device_mc_ecg" },
      update: {},
      create: {
        id: "device_mc_ecg",
        organizationId: "org_medical_center",
        name: "ECG Machine",
      },
    }),
    db.device.upsert({
      where: { id: "device_mc_ultrasound" },
      update: {},
      create: {
        id: "device_mc_ultrasound",
        organizationId: "org_medical_center",
        name: "Ultrasound Scanner",
      },
    }),
    db.device.upsert({
      where: { id: "device_mc_xray" },
      update: {},
      create: {
        id: "device_mc_xray",
        organizationId: "org_medical_center",
        name: "X-Ray Machine",
      },
    }),
    db.device.upsert({
      where: { id: "device_mc_blood_pressure" },
      update: {},
      create: {
        id: "device_mc_blood_pressure",
        organizationId: "org_medical_center",
        name: "Blood Pressure Monitor",
      },
    }),
    db.device.upsert({
      where: { id: "device_mc_otoscope" },
      update: {},
      create: {
        id: "device_mc_otoscope",
        organizationId: "org_medical_center",
        name: "Otoscopes",
      },
    }),
    db.device.upsert({
      where: { id: "device_fp_scale" },
      update: {},
      create: {
        id: "device_fp_scale",
        organizationId: "org_family_practice",
        name: "Digital Scale",
      },
    }),
    db.device.upsert({
      where: { id: "device_fp_thermometer" },
      update: {},
      create: {
        id: "device_fp_thermometer",
        organizationId: "org_family_practice",
        name: "Digital Thermometer",
      },
    }),
    db.device.upsert({
      where: { id: "device_fp_bp_monitor" },
      update: {},
      create: {
        id: "device_fp_bp_monitor",
        organizationId: "org_family_practice",
        name: "Blood Pressure Monitor",
      },
    }),
    db.device.upsert({
      where: { id: "device_sc_eeg" },
      update: {},
      create: {
        id: "device_sc_eeg",
        organizationId: "org_specialty_clinic",
        name: "EEG Machine",
      },
    }),
    db.device.upsert({
      where: { id: "device_sc_mri" },
      update: {},
      create: {
        id: "device_sc_mri",
        organizationId: "org_specialty_clinic",
        name: "MRI Scanner",
      },
    }),
    // Add many more devices for stress testing
    ...Array.from({ length: 190 }, (_, i) => {
      const medicalDevices = [
        "Defibrillator",
        "Ventilator",
        "Infusion Pump",
        "Patient Monitor",
        "Anesthesia Machine",
        "Surgical Table",
        "Operating Microscope",
        "Endoscope",
        "Colonoscope",
        "Bronchoscope",
        "Laparoscope",
        "Arthroscope",
        "Cystoscope",
        "Hysteroscope",
        "Gastroscope",
        "Duodenoscope",
        "Sigmoidoscope",
        "Proctoscope",
        "Ophthalmoscope",
        "Retinoscope",
        "Slit Lamp",
        "Tonometer",
        "Perimeter",
        "OCT Scanner",
        "Audiometer",
        "Tympanometer",
        "Pure Tone Audiometer",
        "BERA Machine",
        "EMG Machine",
        "NCS Machine",
        "Echocardiogram",
        "Stress Test System",
        "Holter Monitor",
        "Ambulatory BP Monitor",
        "Spirometer",
        "Peak Flow Meter",
        "Nebulizer",
        "Oxygen Concentrator",
        "CPAP Machine",
        "BiPAP Machine",
        "Sleep Study Equipment",
        "Polysomnography System",
        "Dental Chair",
        "X-Ray Unit",
        "CT Scanner",
        "PET Scanner",
        "SPECT Scanner",
        "Mammography Unit",
        "DEXA Scanner",
        "Fluoroscopy Unit",
        "Angiography System",
        "Cardiac Catheterization Lab",
        "Electrophysiology Lab",
        "Pacing System Analyzer",
        "ICD Tester",
        "External Pacemaker",
        "Intra-aortic Balloon Pump",
        "Ventricular Assist Device",
        "Extracorporeal Membrane Oxygenation",
        "Hemodialysis Machine",
        "Peritoneal Dialysis Machine",
        "CRRT Machine",
        "Plasmapheresis Unit",
        "Centrifuge",
        "Microscope",
        "Hematology Analyzer",
        "Chemistry Analyzer",
        "Immunoassay Analyzer",
        "Coagulation Analyzer",
        "Urinalysis System",
        "Blood Gas Analyzer",
        "Electrolyte Analyzer",
        "Glucose Meter",
        "HbA1c Analyzer",
        "Lipid Profile Analyzer",
        "PCR Machine",
        "Sequencer",
        "Flow Cytometer",
        "Cell Counter",
        "Incubator",
        "Autoclave",
        "Sterilizer",
        "Washer Disinfector",
        "Endoscope Washer",
        "Surgical Instrument Washer",
        "Ultrasonic Cleaner",
        "Glassware Washer",
        "Refrigerator",
        "Freezer",
        "Ultra-low Freezer",
        "LN2 Freezer",
        "CO2 Incubator",
        "Biosafety Cabinet",
        "Laminar Flow Hood",
        "Clean Bench",
        "Fume Hood",
        "Chemical Storage Cabinet",
        "Flammable Storage Cabinet",
        "Acid Storage Cabinet",
        "Base Storage Cabinet",
        "Solvent Storage Cabinet",
        "Gas Cylinder Storage",
        "Compressed Air System",
        "Vacuum System",
        "Medical Air System",
        "Surgical Suction Unit",
        "Smoke Evacuator",
        "Electrosurgical Unit",
        "Argon Plasma Coagulator",
        "Laser System",
        "Cryotherapy Unit",
        "Hyperthermia Unit",
        "Hypothermia Unit",
        "Phototherapy Unit",
        "Radiation Therapy Unit",
        "Linear Accelerator",
        "Brachytherapy Unit",
        "Gamma Knife",
        "CyberKnife",
        "Proton Therapy System",
        "IMRT System",
        "SBRT System",
        "SRS System",
        "Chemotherapy Infusion Chair",
        "Radiology Information System",
        "PACS System",
        "HIS System",
        "LIS System",
        "EMR System",
        "Practice Management System",
        "Telemedicine Cart",
        "Video Conferencing System",
        "Patient Entertainment System",
        "Nurse Call System",
        "Bed Management System",
        "Asset Tracking System",
        "Temperature Monitoring System",
        "Humidity Monitoring System",
        "Air Quality Monitor",
        "Particle Counter",
        "Clean Room Monitor",
        "Water Purification System",
        "Distiller",
        "Reverse Osmosis Unit",
        "Deionizer",
        "UV Sterilizer",
        "Ozone Generator",
        "HEPA Filter System",
        "HVAC System",
        "Backup Generator",
        "UPS System",
        "Power Distribution Unit",
        "Cable Management System",
        "Server Room Cooling",
        "Fire Suppression System",
        "Security System",
        "Access Control System",
        "CCTV System",
        "Alarm System",
        "Emergency Lighting",
        "Exit Sign",
        "First Aid Kit",
        "AED Cabinet",
        "Eye Wash Station",
        "Safety Shower",
        "Spill Kit",
        "Biohazard Container",
        "Sharps Container",
        "Medical Waste Container",
        "Pharmacy Automation",
        "Pill Dispenser",
        "Medication Cart",
        "Automated Medication Dispensing System",
        "Barcode Scanner",
        "RFID Reader",
        "Smart IV Pump",
        "Smart Syringe Pump",
        "Automated External Defibrillator",
        "Portable ECG",
        "Portable Ultrasound",
        "Portable X-Ray",
        "Mobile CT Scanner",
        "Mobile MRI",
        "Ambulance Equipment",
        "Stretcher",
        "Wheelchair",
        "Walker",
        "Cane",
        "Crutch",
        "Prosthetic Device",
        "Orthotic Device",
        "Hearing Aid",
        "Cochlear Implant",
        "Pacemaker",
        "Implantable Cardioverter Defibrillator",
        "Stent",
        "Artificial Valve",
        "Joint Replacement",
        "Spinal Implant",
        "Dental Implant",
        "Breast Implant",
        "Intraocular Lens",
        "Contact Lens",
        "Glasses",
        "Magnifier",
        "White Cane",
        "Service Animal Equipment",
      ];

      const orgIndex = (i + 3) % organizations.length;
      const org = organizations[orgIndex];
      if (!org) return null;

      const orgId = org.id;
      const deviceName = medicalDevices[i % medicalDevices.length];
      if (!deviceName) return null;

      const id = faker.string.uuid();

      return db.device.create({
        data: {
          id,
          organizationId: orgId,
          name: deviceName,
        },
      });
    }).filter(Boolean),
  ]);

  console.log(`✅ Created ${devices.length} devices`);

  // Create patients for each organization
  const patients = await Promise.all([
    // Keep existing patients (use upsert to handle existing data)
    db.patient.upsert({
      where: { id: "patient_mc_001" },
      update: {},
      create: {
        id: "patient_mc_001",
        organizationId: "org_medical_center",
        name: "John Smith",
      },
    }),
    db.patient.upsert({
      where: { id: "patient_mc_002" },
      update: {},
      create: {
        id: "patient_mc_002",
        organizationId: "org_medical_center",
        name: "Maria Garcia",
      },
    }),
    db.patient.upsert({
      where: { id: "patient_mc_003" },
      update: {},
      create: {
        id: "patient_mc_003",
        organizationId: "org_medical_center",
        name: "David Brown",
      },
    }),
    db.patient.upsert({
      where: { id: "patient_mc_004" },
      update: {},
      create: {
        id: "patient_mc_004",
        organizationId: "org_medical_center",
        name: "Jennifer Davis",
      },
    }),
    db.patient.upsert({
      where: { id: "patient_mc_005" },
      update: {},
      create: {
        id: "patient_mc_005",
        organizationId: "org_medical_center",
        name: "Robert Wilson",
      },
    }),
    db.patient.upsert({
      where: { id: "patient_fp_001" },
      update: {},
      create: {
        id: "patient_fp_001",
        organizationId: "org_family_practice",
        name: "Anna Johnson",
      },
    }),
    db.patient.upsert({
      where: { id: "patient_fp_002" },
      update: {},
      create: {
        id: "patient_fp_002",
        organizationId: "org_family_practice",
        name: "Carlos Rodriguez",
      },
    }),
    db.patient.upsert({
      where: { id: "patient_fp_003" },
      update: {},
      create: {
        id: "patient_fp_003",
        organizationId: "org_family_practice",
        name: "Linda Thompson",
      },
    }),
    db.patient.upsert({
      where: { id: "patient_sc_001" },
      update: {},
      create: {
        id: "patient_sc_001",
        organizationId: "org_specialty_clinic",
        name: "Mark Anderson",
      },
    }),
    db.patient.upsert({
      where: { id: "patient_sc_002" },
      update: {},
      create: {
        id: "patient_sc_002",
        organizationId: "org_specialty_clinic",
        name: "Susan Lee",
      },
    }),
    // Add many more patients for stress testing
    ...Array.from({ length: 1990 }, (_, i) => {
      const orgIndex = (i + 3) % organizations.length;
      const org = organizations[orgIndex];
      if (!org) return null;

      const orgId = org.id;
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const name = `${firstName} ${lastName}`;
      const id = faker.string.uuid();

      return db.patient.create({
        data: {
          id,
          organizationId: orgId,
          name,
        },
      });
    }).filter(Boolean),
  ]);

  console.log(`✅ Created ${patients.length} patients`);

  // Create appointments
  const appointments = await Promise.all([
    // Keep existing appointments (use upsert to handle existing data)
    db.appointment.upsert({
      where: { id: "appt_mc_001" },
      update: {},
      create: {
        id: "appt_mc_001",
        organizationId: "org_medical_center",
        doctorId: "doctor_sarah_johnson",
        patientId: "patient_mc_001",
        roomId: "room_mc_101",
        serviceId: "service_general_checkup",
        startAt: new Date("2024-09-15T09:00:00Z"),
        endAt: new Date("2024-09-15T09:30:00Z"),
      },
    }),
    db.appointment.upsert({
      where: { id: "appt_mc_002" },
      update: {},
      create: {
        id: "appt_mc_002",
        organizationId: "org_medical_center",
        doctorId: "doctor_emily_davis",
        patientId: "patient_mc_002",
        roomId: "room_mc_102",
        serviceId: "service_cardiology",
        startAt: new Date("2024-09-15T10:00:00Z"),
        endAt: new Date("2024-09-15T10:45:00Z"),
      },
    }),
    db.appointment.upsert({
      where: { id: "appt_mc_003" },
      update: {},
      create: {
        id: "appt_mc_003",
        organizationId: "org_medical_center",
        doctorId: "doctor_robert_miller",
        patientId: "patient_mc_003",
        roomId: "room_mc_103",
        serviceId: "service_orthopedics",
        startAt: new Date("2024-09-15T14:00:00Z"),
        endAt: new Date("2024-09-15T14:30:00Z"),
      },
    }),
    db.appointment.upsert({
      where: { id: "appt_fp_001" },
      update: {},
      create: {
        id: "appt_fp_001",
        organizationId: "org_family_practice",
        doctorId: "doctor_michael_chen",
        patientId: "patient_fp_001",
        roomId: "room_fp_201",
        serviceId: "service_family_medicine",
        startAt: new Date("2024-09-16T08:30:00Z"),
        endAt: new Date("2024-09-16T09:00:00Z"),
      },
    }),
    db.appointment.upsert({
      where: { id: "appt_fp_002" },
      update: {},
      create: {
        id: "appt_fp_002",
        organizationId: "org_family_practice",
        doctorId: "doctor_lisa_parker",
        patientId: "patient_fp_002",
        roomId: "room_fp_202",
        serviceId: "service_annual_physical",
        startAt: new Date("2024-09-16T11:00:00Z"),
        endAt: new Date("2024-09-16T11:30:00Z"),
      },
    }),
    db.appointment.upsert({
      where: { id: "appt_sc_001" },
      update: {},
      create: {
        id: "appt_sc_001",
        organizationId: "org_specialty_clinic",
        doctorId: "doctor_david_kim",
        patientId: "patient_sc_001",
        roomId: "room_sc_301",
        serviceId: "service_neurology",
        startAt: new Date("2024-09-17T13:00:00Z"),
        endAt: new Date("2024-09-17T14:00:00Z"),
      },
    }),
    // Add many more appointments for stress testing
    ...Array.from({ length: 4994 }, (_, i) => {
      const orgIndex = (i + 3) % organizations.length;
      const org = organizations[orgIndex];
      if (!org) return null;

      const orgId = org.id;

      // Get entities for this organization
      const orgDoctors = doctors.filter(
        (d): d is NonNullable<typeof d> =>
          d !== null && d.organizationId === orgId,
      );
      const orgPatients = patients.filter(
        (p): p is NonNullable<typeof p> =>
          p !== null && p.organizationId === orgId,
      );
      const orgRooms = rooms.filter(
        (r): r is NonNullable<typeof r> =>
          r !== null && r.organizationId === orgId,
      );
      const orgServices = services.filter(
        (s): s is NonNullable<typeof s> =>
          s !== null && s.organizationId === orgId,
      );

      // Skip if organization doesn't have required entities
      if (
        orgDoctors.length === 0 ||
        orgPatients.length === 0 ||
        orgRooms.length === 0 ||
        orgServices.length === 0
      ) {
        return null;
      }

      const doctor = faker.helpers.arrayElement(orgDoctors);
      const patient = faker.helpers.arrayElement(orgPatients);
      const room = faker.helpers.arrayElement(orgRooms);
      const service = faker.helpers.arrayElement(orgServices);

      if (!doctor || !patient || !room || !service) return null;

      // Generate realistic appointment time (business hours, future dates)
      const appointmentDate = faker.date.between({
        from: new Date("2024-09-01T00:00:00Z"),
        to: new Date("2025-12-31T23:59:59Z"),
      });

      // Business hours: 8 AM to 6 PM
      const hour = faker.number.int({ min: 8, max: 17 });
      const minute = faker.helpers.arrayElement([0, 15, 30, 45]); // Quarter-hour slots
      appointmentDate.setHours(hour, minute, 0, 0);

      // Duration based on service type (15-120 minutes)
      const duration = faker.helpers.arrayElement([
        15, 30, 45, 60, 75, 90, 105, 120,
      ]);
      const endDate = new Date(appointmentDate);
      endDate.setMinutes(endDate.getMinutes() + duration);

      const id = faker.string.uuid();

      return db.appointment.create({
        data: {
          id,
          organizationId: orgId,
          doctorId: doctor.id,
          patientId: patient.id,
          roomId: room.id,
          serviceId: service.id,
          startAt: appointmentDate,
          endAt: endDate,
        },
      });
    }).filter(Boolean), // Remove null entries
  ]);

  console.log(`✅ Created ${appointments.length} appointments`);

  // Create appointment-device associations
  const appointmentDevices = await Promise.all([
    // Keep existing appointment-device associations (use upsert to handle existing data)
    db.appointmentDevice.upsert({
      where: { id: "appt_device_mc_001" },
      update: {},
      create: {
        id: "appt_device_mc_001",
        appointmentId: "appt_mc_001",
        deviceId: "device_mc_blood_pressure",
      },
    }),
    db.appointmentDevice.upsert({
      where: { id: "appt_device_mc_002" },
      update: {},
      create: {
        id: "appt_device_mc_002",
        appointmentId: "appt_mc_001",
        deviceId: "device_mc_otoscope",
      },
    }),
    db.appointmentDevice.upsert({
      where: { id: "appt_device_mc_003" },
      update: {},
      create: {
        id: "appt_device_mc_003",
        appointmentId: "appt_mc_002",
        deviceId: "device_mc_ecg",
      },
    }),
    db.appointmentDevice.upsert({
      where: { id: "appt_device_fp_001" },
      update: {},
      create: {
        id: "appt_device_fp_001",
        appointmentId: "appt_fp_001",
        deviceId: "device_fp_bp_monitor",
      },
    }),
    db.appointmentDevice.upsert({
      where: { id: "appt_device_fp_002" },
      update: {},
      create: {
        id: "appt_device_fp_002",
        appointmentId: "appt_fp_002",
        deviceId: "device_fp_thermometer",
      },
    }),
    db.appointmentDevice.upsert({
      where: { id: "appt_device_sc_001" },
      update: {},
      create: {
        id: "appt_device_sc_001",
        appointmentId: "appt_sc_001",
        deviceId: "device_sc_eeg",
      },
    }),
    // Add many more appointment-device associations for stress testing
    ...Array.from({ length: 9994 }, (_, i) => {
      // Randomly select appointments and devices from same organization
      const appointment = faker.helpers.arrayElement(appointments);
      if (!appointment) return null;

      const orgId = appointment.organizationId;
      const orgDevices = devices.filter(
        (d): d is NonNullable<typeof d> =>
          d !== null && d.organizationId === orgId,
      );

      if (orgDevices.length === 0) return null;

      const device = faker.helpers.arrayElement(orgDevices);
      if (!device) return null;

      // Create multiple associations per appointment (1-3 devices per appointment)
      const associationsPerAppointment = faker.number.int({ min: 1, max: 3 });
      const _associationIndex = i % associationsPerAppointment;

      const id = faker.string.uuid();

      return db.appointmentDevice.create({
        data: {
          id,
          appointmentId: appointment.id,
          deviceId: device.id,
        },
      });
    }).filter(Boolean), // Remove null entries
  ]);

  console.log(
    `✅ Created ${appointmentDevices.length} appointment-device associations`,
  );

  // Summary of created data for stress testing
  console.log("\n📊 STRESS TEST DATA SUMMARY:");
  console.log(`🏢 Organizations: ${organizations.length}`);
  console.log(`👨‍⚕️ Doctors: ${doctors.length}`);
  console.log(`🕒 Doctor Working Hours: ${doctorWorkingHours.length}`);
  console.log(`🩺 Services: ${services.length}`);
  console.log(`🏥 Rooms: ${rooms.length}`);
  console.log(`🔧 Devices: ${devices.length}`);
  console.log(`👥 Patients: ${patients.length}`);
  console.log(`📅 Appointments: ${appointments.length}`);
  console.log(
    `🔗 Appointment-Device Associations: ${appointmentDevices.length}`,
  );

  console.log("\n🎯 PERFECT FOR STRESS TESTING:");
  console.log("• Multi-tenant architecture with 40+ organizations");
  console.log("• Complex relationships across all entities");
  console.log("• Large datasets for performance testing");
  console.log("• Realistic appointment scheduling");
  console.log("• Many-to-many relationships stress tested");
  console.log("• Better-auth tables preserved (as requested)");

  console.log("\n🎉 Database seeding completed successfully!");
}

await main().catch(async (e) => {
  console.error("❌ Error seeding database:", e);
  await db.$disconnect();
  process.exit(1);
});

await db.$disconnect();

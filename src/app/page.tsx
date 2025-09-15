"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { useSession } from "~/lib/auth-client";
import { AppointmentsCalendar } from "./_components/appointments-calendar";
import { GlobalTime } from "./_components/global-time";

const HomePage = () => {
  const { data } = useSession();

  return (
    <main className="container mx-auto py-16">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">
          Welcome, {data?.user.name} ({data?.user.email})
        </h1>

        <GlobalTime />

        <section className="flex justify-end">
          <Button asChild>
            <Link href="/appointment/create">Create Appointment</Link>
          </Button>
        </section>

        <AppointmentsCalendar />
      </div>
    </main>
  );
};

export default HomePage;

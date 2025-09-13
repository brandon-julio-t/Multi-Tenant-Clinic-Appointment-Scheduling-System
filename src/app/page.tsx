"use client";

import Link from "next/link";
import { AppointmentsCalendar } from "./_components/appointments-calendar";
import { Button } from "~/components/ui/button";

const HomePage = () => {
  return (
    <main className="container mx-auto py-16">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Home</h1>

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

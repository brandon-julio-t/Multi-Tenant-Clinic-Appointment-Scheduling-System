"use client";

import { AppointmentForm } from "~/components/appointment-form";

const CreateAppointmentPage = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-center">
        <AppointmentForm />
      </div>
    </div>
  );
};

export default CreateAppointmentPage;

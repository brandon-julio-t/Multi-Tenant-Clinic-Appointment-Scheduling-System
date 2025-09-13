"use client";

import { faker } from "@faker-js/faker";
import { endOfMonth, format, set, startOfMonth } from "date-fns";
import { Loader2Icon } from "lucide-react";
import {
  CalendarBody,
  CalendarDate,
  CalendarDatePagination,
  CalendarDatePicker,
  CalendarHeader,
  CalendarItem,
  CalendarMonthPicker,
  CalendarProvider,
  CalendarYearPicker,
  useCalendarMonth,
  useCalendarYear,
  type Feature,
} from "~/components/ui/kibo-ui/calendar";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const earliestYear = 1970;

const latestYear = 3000;

export const AppointmentsCalendar = () => {
  const [month] = useCalendarMonth();
  const [year] = useCalendarYear();

  const anchorDate = set(new Date(), { month, year });

  const appointmentsQuery = api.appointment.getAppointments.useQuery({
    from: startOfMonth(anchorDate),
    to: endOfMonth(anchorDate),
  });

  const appointmentsAsCalendarFeatures =
    appointmentsQuery.data?.map((appointment) => {
      return {
        id: appointment.id,
        name: `${appointment.room.name}: ${appointment.doctor.name} - ${appointment.service.name} (${format(appointment.startAt, "HH:mm")} - ${format(appointment.endAt, "HH:mm")})`,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        status: {
          id: appointment.id,
          name: appointment.room.name,
          color: "#6B7280",
        },
      } as Feature;
    }) ?? [];

  return (
    <>
      <CalendarProvider
        className={cn(
          "relative",
          appointmentsQuery.isLoading && "animate-pulse",
        )}
      >
        {appointmentsQuery.isLoading && (
          <Loader2Icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        )}

        <CalendarDate>
          <CalendarDatePicker>
            <CalendarMonthPicker />
            <CalendarYearPicker end={latestYear} start={earliestYear} />
          </CalendarDatePicker>
          <CalendarDatePagination />
        </CalendarDate>
        <CalendarHeader />
        <CalendarBody features={appointmentsAsCalendarFeatures}>
          {({ feature }) => <CalendarItem feature={feature} key={feature.id} />}
        </CalendarBody>
      </CalendarProvider>
    </>
  );
};

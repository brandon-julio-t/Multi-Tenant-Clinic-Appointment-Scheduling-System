"use client";

import { tz } from "@date-fns/tz";
import type { inferRouterOutputs } from "@trpc/server";
import {
  areIntervalsOverlapping,
  endOfDay,
  endOfMonth,
  format,
  set,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { Loader2Icon } from "lucide-react";
import React from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { useAppTimezone } from "~/hooks/use-timezone";
import { cn } from "~/lib/utils";
import type { AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";

const earliestYear = 1970;

const latestYear = 3000;

export const AppointmentsCalendar = () => {
  const [month] = useCalendarMonth();
  const [year] = useCalendarYear();

  const { timezone } = useAppTimezone();

  const anchorDate = set(new Date(), { month, year }, { in: tz(timezone) });

  const appointmentsQuery = api.appointment.getAppointments.useQuery({
    from: startOfMonth(anchorDate, { in: tz(timezone) }),
    to: endOfMonth(anchorDate, { in: tz(timezone) }),
  });

  const appointments = appointmentsQuery.data ?? [];

  const appointmentsAsCalendarFeatures =
    appointments.map((appointment) => {
      const startTime = format(appointment.startAt, "HH:mm", {
        in: tz(timezone),
      });
      const endTime = format(appointment.endAt, "HH:mm", { in: tz(timezone) });

      return {
        id: appointment.id,
        name: `${appointment.room.name}: ${appointment.doctor.name} - ${appointment.service.name} (${startTime} - ${endTime})`,
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
          {({ feature }) => (
            <React.Fragment key={feature.id}>
              <CalendarItem feature={feature} />

              <div className="absolute right-0 bottom-0 left-0 hidden p-2 last:block">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      disabled={
                        appointments.length <= 0 || appointmentsQuery.isLoading
                      }
                    >
                      {appointmentsQuery.isLoading && (
                        <Loader2Icon className="animate-spin" />
                      )}
                      View More
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="h-svh">
                    <AppointmentsByDaySheetContent
                      date={feature.startAt}
                      appointments={appointments}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </React.Fragment>
          )}
        </CalendarBody>
      </CalendarProvider>
    </>
  );
};

function AppointmentsByDaySheetContent({
  date,
  appointments,
}: {
  date: Date;
  appointments: inferRouterOutputs<AppRouter>["appointment"]["getAppointments"];
}) {
  const { timezone } = useAppTimezone();

  const appointmentsForDay = React.useMemo(() => {
    const from = startOfDay(date, { in: tz(timezone) });
    const to = endOfDay(date, { in: tz(timezone) });

    return appointments.filter((appointment) => {
      return areIntervalsOverlapping(
        { start: appointment.startAt, end: appointment.endAt },
        { start: from, end: to },
      );
    });
  }, [appointments, date, timezone]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>Appointments</SheetTitle>
        <SheetDescription>
          Appointments for the day ({format(date, "PPP", { in: tz(timezone) })})
        </SheetDescription>
      </SheetHeader>

      <Separator />

      <section className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col gap-4 pb-6">
          {appointmentsForDay.length <= 0 ? (
            <p className="text-muted-foreground text-center text-sm">
              No appointments for this day
            </p>
          ) : (
            appointmentsForDay.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader>
                  <CardTitle className="truncate">
                    Room: {appointment.room.name}
                  </CardTitle>
                  <CardDescription className="truncate">
                    Doctor: {appointment.doctor.name}
                  </CardDescription>
                  <CardDescription className="truncate">
                    Service: {appointment.service.name}
                  </CardDescription>
                  <CardDescription className="truncate">
                    Start Time:{" "}
                    {format(appointment.startAt, "pppp", {
                      in: tz(timezone),
                    })}
                  </CardDescription>
                  <CardDescription className="truncate">
                    End Time:{" "}
                    {format(appointment.endAt, "pppp", { in: tz(timezone) })}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </section>
    </>
  );
}

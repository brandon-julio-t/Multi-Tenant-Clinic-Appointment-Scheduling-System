"use client";

import {
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
import { Skeleton } from "~/components/ui/skeleton";
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
                    >
                      View More
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="h-svh">
                    <AppointmentsByDaySheetContent date={feature.startAt} />
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

function AppointmentsByDaySheetContent({ date }: { date: Date }) {
  const from = startOfDay(date);
  const to = endOfDay(date);

  const appointmentsQuery = api.appointment.getAppointments.useQuery({
    from,
    to,
  });

  return (
    <>
      <SheetHeader>
        <SheetTitle>Appointments</SheetTitle>
        <SheetDescription>
          Appointments for the day ({format(date, "PPP")})
        </SheetDescription>
      </SheetHeader>

      <Separator />

      <section className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col gap-4 pb-6">
          {appointmentsQuery.isLoading &&
            Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-42.5 w-full" />
            ))}

          {appointmentsQuery.data?.map((appointment) => (
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
                  Start Time: {format(appointment.startAt, "pppp")}
                </CardDescription>
                <CardDescription className="truncate">
                  End Time: {format(appointment.endAt, "pppp")}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

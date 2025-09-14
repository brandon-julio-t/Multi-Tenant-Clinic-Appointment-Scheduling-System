"use client";

import { tz } from "@date-fns/tz";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addMinutes,
  areIntervalsOverlapping,
  constructNow,
  endOfDay,
  format,
  isBefore,
  set,
  startOfDay,
  startOfToday,
} from "date-fns";
import { CalendarIcon, Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { TRPCClientError } from "@trpc/react-query";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useAppTimezone, useGlobalTime } from "~/hooks/use-timezone";
import { cn } from "~/lib/utils";
import type { AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const appointmentSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  serviceId: z.string().min(1, "Please select a service"),
  roomId: z.string().min(1, "Please select a room"),
  patientId: z.string().min(1, "Please select a patient"),
  deviceIds: z.array(z.string()).min(1, "Please select at least one device"),
  appointmentDate: z.date(),
  startTime: z.string().min(1, "Please select a start time"),
  endTime: z.string().min(1, "Please select an end time"),
  serviceDurationMinutes: z.number(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export function AppointmentForm() {
  const { timezone } = useAppTimezone();
  const { localTime, appTime } = useGlobalTime();

  // Fetch data using tRPC
  const { data: doctors = [] } = api.appointment.getDoctors.useQuery();
  const { data: services = [] } = api.appointment.getServices.useQuery();
  const { data: rooms = [] } = api.appointment.getRooms.useQuery();
  const { data: devices = [] } = api.appointment.getDevices.useQuery();
  const { data: patients = [] } = api.appointment.getPatients.useQuery();

  const form = useForm<AppointmentFormData>({
    mode: "onTouched",
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctorId: "",
      serviceId: "",
      roomId: "",
      patientId: "",
      appointmentDate: new Date(),
      startTime: "",
      endTime: "",
      deviceIds: [],
      // TODO: Get service duration from service, for now we use a fixed value first
      serviceDurationMinutes: 30,
    },
  });

  const doctorId = form.watch("doctorId");
  const roomId = form.watch("roomId");
  const date = form.watch("appointmentDate");

  const { data: bookedAppointments = [] } =
    api.appointment.getAppointmentsByRoomOrDoctorForTimeSlot.useQuery(
      {
        roomId,
        doctorId,
        from: startOfDay(date, { in: tz(timezone) }),
        to: endOfDay(date, { in: tz(timezone) }),
      },
      { enabled: !!roomId && !!doctorId },
    );

  const isTimeSlotBooked = React.useCallback(
    (start: Date, end: Date) => {
      return bookedAppointments.some((appointment) => {
        return areIntervalsOverlapping(
          { start, end },
          { start: appointment.startAt, end: appointment.endAt },
        );
      });
    },
    [bookedAppointments],
  );

  // TODO: Get doctor working hours from doctor, for now we use a fixed value first
  const doctorWorkingHours = React.useMemo(
    () => [
      { startHour: "09:00", endHour: "11:00" }, // 9 AM to 11 AM
      { startHour: "13:00", endHour: "18:00" }, // 1 PM to 6 PM
    ],
    [],
  );

  const serviceDurationMinutes = form.watch("serviceDurationMinutes");

  const availableTimeSlots = React.useMemo(() => {
    const currentTime = new Date();
    const now = startOfToday({ in: tz(timezone) });

    const timeSlots: Array<{
      start: Date;
      end: Date;
      disabled: boolean;
      disabledReason?: string;
    }> = [];

    for (const workingHour of doctorWorkingHours) {
      const [startHour, startMinute] = workingHour.startHour.split(":");
      const [endHour, endMinute] = workingHour.endHour.split(":");

      const end = set(
        now,
        {
          hours: parseInt(endHour ?? "00"),
          minutes: parseInt(endMinute ?? "00"),
          seconds: 0,
          milliseconds: 0,
        },
        { in: tz(timezone) },
      );

      let curr = set(
        now,
        {
          hours: parseInt(startHour ?? "00"),
          minutes: parseInt(startMinute ?? "00"),
          seconds: 0,
          milliseconds: 0,
        },
        { in: tz(timezone) },
      );

      while (isBefore(curr, end)) {
        const start = curr;
        const end = addMinutes(curr, serviceDurationMinutes, {
          in: tz(timezone),
        });

        const isPastTime = isBefore(start, constructNow(currentTime));
        const isBooked = isTimeSlotBooked(start, end);

        const disabledReason = isPastTime
          ? "Past time"
          : isBooked
            ? "Time slot booked"
            : undefined;

        timeSlots.push({
          start: start,
          end: end,
          disabled: isPastTime || isBooked,
          disabledReason,
        });
        curr = addMinutes(curr, serviceDurationMinutes, { in: tz(timezone) });
      }
    }

    return timeSlots;
  }, [doctorWorkingHours, isTimeSlotBooked, serviceDurationMinutes, timezone]);

  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");

  const createAppointment = api.appointment.createAppointment.useMutation();

  const router = useRouter();

  const onSubmit = async (data: AppointmentFormData) => {
    console.log("Form data:", data);
    // TODO: Implement appointment creation logic

    const [startHour, startMinute] = data.startTime.split(":");
    const [endHour, endMinute] = data.endTime.split(":");

    const startAt = set(
      data.appointmentDate,
      {
        hours: parseInt(startHour ?? "00"),
        minutes: parseInt(startMinute ?? "00"),
        seconds: 0,
        milliseconds: 0,
      },
      { in: tz(timezone) },
    );

    const endAt = set(
      data.appointmentDate,
      {
        hours: parseInt(endHour ?? "00"),
        minutes: parseInt(endMinute ?? "00"),
        seconds: 0,
        milliseconds: 0,
      },
      { in: tz(timezone) },
    );

    await toast
      .promise(
        createAppointment.mutateAsync({
          ...data,
          timezone,
          startAt,
          endAt,
        }),
        {
          loading: "Creating appointment...",
          success: "Appointment created successfully",
          error: (err) => {
            console.error(err);

            const trpcErr = err as TRPCClientError<AppRouter>;

            return {
              message: "Failed to create appointment",
              description:
                trpcErr.data?.code === "CONFLICT"
                  ? trpcErr.message
                  : "An unexpected error occurred",
            };
          },
        },
      )
      .unwrap();

    router.push("/");
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Appointment</CardTitle>
        <CardDescription>
          Schedule a new appointment by filling out the form below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Doctor Selector */}
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a doctor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Selector */}
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Room Selector */}
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Patient Selector */}
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Picker */}
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Appointment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { in: tz(timezone) })
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={{ before: new Date() }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Duration Selector */}
              <FormField
                control={form.control}
                name="serviceDurationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Duration</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Devices Multi-Select */}
            <FormField
              control={form.control}
              name="deviceIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Devices</FormLabel>
                    <FormDescription>
                      Select the devices needed for this appointment.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {devices.map((device) => (
                      <FormField
                        key={device.id}
                        control={form.control}
                        name="deviceIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={device.id}
                              className="flex flex-row items-start space-y-0 space-x-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(device.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          device.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== device.id,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {device.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Available Time Slots */}

            <FormItem>
              <FormLabel>Available Time Slots</FormLabel>

              <FormDescription>
                Click on a time slot to set the appointment time
              </FormDescription>

              <FormDescription>Local Time: {localTime}</FormDescription>

              <FormDescription>App Time: {appTime}</FormDescription>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {availableTimeSlots.map((slot, index) => {
                  const startTimeStr = format(slot.start, "HH:mm", {
                    in: tz(timezone),
                  });
                  const endTimeStr = format(slot.end, "HH:mm", {
                    in: tz(timezone),
                  });

                  const isSelected =
                    startTimeStr === startTime && endTimeStr === endTime;

                  return (
                    <Tooltip key={`${startTimeStr}-${endTimeStr}-${index}`}>
                      <TooltipTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={slot.disabled}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="h-fit flex-col py-2 text-xs disabled:pointer-events-auto disabled:cursor-not-allowed"
                            onClick={() => {
                              form.setValue("startTime", startTimeStr, {
                                shouldValidate: true,
                              });
                              form.setValue("endTime", endTimeStr, {
                                shouldValidate: true,
                              });
                            }}
                          >
                            <div className="font-medium">
                              {startTimeStr} &mdash; {endTimeStr}
                            </div>
                          </Button>
                        </FormControl>
                      </TooltipTrigger>
                      {slot.disabledReason && (
                        <TooltipContent>{slot.disabledReason}</TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>

              <FormField
                control={form.control}
                name="startTime"
                render={() => <FormMessage />}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={() => <FormMessage />}
              />
            </FormItem>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2Icon className="animate-spin" />
              ) : null}
              {form.formState.isSubmitting
                ? "Creating appointment..."
                : "Create Appointment"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

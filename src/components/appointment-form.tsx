"use client";

import { tz } from "@date-fns/tz";
import { zodResolver } from "@hookform/resolvers/zod";
import { endOfDay, format, set, startOfDay, startOfToday } from "date-fns";
import { CalendarIcon, Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { TRPCClientError } from "@trpc/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  EmptyDevicesState,
  EmptyDoctorsState,
  EmptyPatientsState,
  EmptyRoomsState,
  EmptyServicesState,
  EmptyTimeSlotsState,
  TimeSlotsDisabledState,
} from "./empty-states";
import {
  CheckboxSkeleton,
  GridSkeleton,
  SelectSkeleton,
} from "./loading-skeletons";
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
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export function AppointmentForm() {
  const { timezone } = useAppTimezone();

  // Fetch data using tRPC
  const getDoctorsQuery = api.appointment.getDoctors.useQuery();
  const getServicesQuery = api.appointment.getServices.useQuery();
  const getRoomsQuery = api.appointment.getRooms.useQuery();
  const getDevicesQuery = api.appointment.getDevices.useQuery();
  const getPatientsQuery = api.appointment.getPatients.useQuery();

  const form = useForm<AppointmentFormData>({
    mode: "onTouched",
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctorId: "",
      serviceId: "",
      roomId: "",
      patientId: "",
      appointmentDate: startOfToday({ in: tz(timezone) }),
      startTime: "",
      endTime: "",
      deviceIds: [],
    },
  });

  const doctorId = form.watch("doctorId");
  const roomId = form.watch("roomId");
  const serviceId = form.watch("serviceId");
  const date = form.watch("appointmentDate");

  const getTimeSlotsQuery =
    api.appointment.getAvailableTimeSlotsForCreateAppointment.useQuery(
      {
        roomId,
        doctorId,
        serviceId,
        from: startOfDay(date, { in: tz(timezone) }),
        to: endOfDay(date, { in: tz(timezone) }),
      },
      { enabled: !!roomId && !!doctorId && !!serviceId },
    );

  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");

  const createAppointment = api.appointment.createAppointment.useMutation();

  const router = useRouter();
  const utils = api.useUtils();

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

    await utils.appointment.getAppointments.invalidate();
    await utils.appointment.getAvailableTimeSlotsForCreateAppointment.invalidate();

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
                    {getDoctorsQuery.isLoading ? (
                      <SelectSkeleton />
                    ) : (getDoctorsQuery.data ?? []).length === 0 ? (
                      <EmptyDoctorsState />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a doctor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(getDoctorsQuery.data ?? []).map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                    {getServicesQuery.isLoading ? (
                      <SelectSkeleton />
                    ) : (getServicesQuery.data ?? []).length === 0 ? (
                      <EmptyServicesState />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(getServicesQuery.data ?? []).map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                    {getRoomsQuery.isLoading ? (
                      <SelectSkeleton />
                    ) : (getRoomsQuery.data ?? []).length === 0 ? (
                      <EmptyRoomsState />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a room" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(getRoomsQuery.data ?? []).map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                    {getPatientsQuery.isLoading ? (
                      <SelectSkeleton />
                    ) : (getPatientsQuery.data ?? []).length === 0 ? (
                      <EmptyPatientsState />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(getPatientsQuery.data ?? []).map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                              format(
                                startOfDay(field.value, {
                                  in: tz(timezone),
                                }),
                                "PPP",
                                { in: tz(timezone) },
                              )
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
                          timeZone={timezone}
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={{
                            before: startOfToday({ in: tz(timezone) }),
                          }}
                        />
                      </PopoverContent>
                    </Popover>
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
                  {getDevicesQuery.isLoading ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <CheckboxSkeleton key={index} />
                      ))}
                    </div>
                  ) : (getDevicesQuery.data ?? []).length === 0 ? (
                    <EmptyDevicesState />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {(getDevicesQuery.data ?? []).map((device) => (
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
                  )}
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

              <GlobalTime />

              {getTimeSlotsQuery.isLoading ? (
                <GridSkeleton
                  rows={3}
                  cols={4}
                  itemHeight="h-12"
                  className="grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
                />
              ) : !doctorId || !serviceId || !roomId ? (
                <TimeSlotsDisabledState
                  selectedDoctor={!!doctorId}
                  selectedService={!!serviceId}
                  selectedRoom={!!roomId}
                />
              ) : (getTimeSlotsQuery.data ?? []).length === 0 ? (
                <EmptyTimeSlotsState />
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {(getTimeSlotsQuery.data ?? []).map((slot, index) => {
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
              )}

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

            <Button
              className="w-full"
              disabled={form.formState.isSubmitting}
              variant="outline"
              asChild
            >
              <Link href="/">Cancel</Link>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function GlobalTime() {
  const { localTime, appTime } = useGlobalTime();

  return (
    <>
      <FormDescription>Local Time: {localTime}</FormDescription>

      <FormDescription>App Time: {appTime}</FormDescription>
    </>
  );
}

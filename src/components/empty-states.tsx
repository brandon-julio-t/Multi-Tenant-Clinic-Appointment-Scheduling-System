import {
  BuildingIcon,
  CalendarDaysIcon,
  ClockIcon,
  StethoscopeIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectTrigger, SelectValue } from "./ui/select";

/**
 * Generic empty state component
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-8 text-center ${className}`}
    >
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="text-foreground mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md text-sm">
        {description}
      </p>
      {action}
    </div>
  );
}

/**
 * Empty state for when data needs to be set up first
 */
interface SetupRequiredStateProps {
  resourceName: string;
  setupInstructions: string;
  setupLink?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function SetupRequiredState({
  resourceName,
  setupInstructions,
  setupLink,
  icon,
  className = "",
}: SetupRequiredStateProps) {
  return (
    <EmptyState
      icon={icon}
      title={`No ${resourceName} Available`}
      description={setupInstructions}
      action={
        setupLink ? (
          <Button variant="outline" size="sm">
            {`Set up ${resourceName}`}
          </Button>
        ) : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for select dropdowns
 */
interface EmptySelectStateProps {
  placeholder: string;
  emptyMessage: string;
  setupInstructions?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptySelectState({
  placeholder,
  emptyMessage,
  setupInstructions,
  icon,
  className = "",
}: EmptySelectStateProps) {
  return (
    <Select disabled>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="p-4">
          <EmptyState
            icon={icon}
            title="No Options Available"
            description={emptyMessage}
            action={
              setupInstructions ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  {setupInstructions}
                </p>
              ) : undefined
            }
          />
        </div>
      </SelectContent>
    </Select>
  );
}

/**
 * Empty state for doctors dropdown
 */
export function EmptyDoctorsState({ className }: { className?: string }) {
  return (
    <EmptySelectState
      placeholder="Select a doctor"
      emptyMessage="No doctors have been added to the system yet."
      setupInstructions="Please contact your administrator to add doctors."
      icon={<StethoscopeIcon className="h-8 w-8" />}
      className={className}
    />
  );
}

/**
 * Empty state for services dropdown
 */
export function EmptyServicesState({ className }: { className?: string }) {
  return (
    <EmptySelectState
      placeholder="Select a service"
      emptyMessage="No services have been configured yet."
      setupInstructions="Please contact your administrator to add services."
      icon={<CalendarDaysIcon className="h-8 w-8" />}
      className={className}
    />
  );
}

/**
 * Empty state for rooms dropdown
 */
export function EmptyRoomsState({ className }: { className?: string }) {
  return (
    <EmptySelectState
      placeholder="Select a room"
      emptyMessage="No rooms have been set up yet."
      setupInstructions="Please contact your administrator to add rooms."
      icon={<BuildingIcon className="h-8 w-8" />}
      className={className}
    />
  );
}

/**
 * Empty state for patients dropdown
 */
export function EmptyPatientsState({ className }: { className?: string }) {
  return (
    <EmptySelectState
      placeholder="Select a patient"
      emptyMessage="No patients have been registered yet."
      setupInstructions="Please contact your administrator to add patients."
      icon={<UsersIcon className="h-8 w-8" />}
      className={className}
    />
  );
}

/**
 * Empty state for devices checkboxes
 */
export function EmptyDevicesState({ className }: { className?: string }) {
  return (
    <div className={`py-6 ${className ?? ""}`}>
      <EmptyState
        icon={<WrenchIcon className="h-8 w-8" />}
        title="No Devices Available"
        description="No devices have been configured in the system yet."
        action={
          <p className="text-muted-foreground text-xs">
            Please contact your administrator to add devices.
          </p>
        }
      />
    </div>
  );
}

/**
 * Empty state for time slots when query is disabled
 */
export function TimeSlotsDisabledState({
  selectedDoctor,
  selectedService,
  selectedRoom,
  className,
}: {
  selectedDoctor: boolean;
  selectedService: boolean;
  selectedRoom: boolean;
  className?: string;
}) {
  const getMissingRequirements = () => {
    const missing = [];
    if (!selectedDoctor) missing.push("doctor");
    if (!selectedService) missing.push("service");
    if (!selectedRoom) missing.push("room");
    return missing;
  };

  const missing = getMissingRequirements();
  const message =
    missing.length > 0
      ? `Please select a ${missing.join(", ")} to view available time slots.`
      : "Please select doctor, service, and room to view available time slots.";

  return (
    <div className={`py-6 ${className ?? ""}`}>
      <EmptyState
        icon={<ClockIcon className="h-8 w-8" />}
        title="Select Requirements First"
        description={message}
      />
    </div>
  );
}

/**
 * Empty state for time slots when query succeeds but no slots available
 */
export function EmptyTimeSlotsState({ className }: { className?: string }) {
  return (
    <div className={`py-6 ${className ?? ""}`}>
      <EmptyState
        icon={<ClockIcon className="h-8 w-8" />}
        title="No Available Time Slots"
        description="There are no available time slots for the selected date, doctor, service, and room combination."
        action={
          <p className="text-muted-foreground text-xs">
            Try selecting a different date or contact your administrator.
          </p>
        }
      />
    </div>
  );
}

/**
 * Empty state for calendar appointments
 */
export function EmptyAppointmentsState({
  className,
  showCreateButton = false,
}: {
  className?: string;
  showCreateButton?: boolean;
}) {
  return (
    <EmptyState
      icon={<CalendarDaysIcon className="h-12 w-12" />}
      title="No Appointments Scheduled"
      description="There are no appointments scheduled for this month."
      action={
        showCreateButton ? (
          <Button variant="outline" size="sm">
            Create First Appointment
          </Button>
        ) : undefined
      }
      className={className}
    />
  );
}

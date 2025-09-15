import { Skeleton } from "./ui/skeleton";

/**
 * Loading skeleton for dropdown/select components
 */
export function SelectSkeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={className} {...props}>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

/**
 * Loading skeleton for form fields with label
 */
export function FormFieldSkeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={className} {...props}>
      <Skeleton className="mb-2 h-5 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

/**
 * Loading skeleton for checkbox items
 */
export function CheckboxSkeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`flex items-center space-x-2 ${className || ""}`}
      {...props}
    >
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

/**
 * Loading skeleton for a grid of items (like time slots)
 */
export function GridSkeleton({
  rows = 3,
  cols = 4,
  itemHeight = "h-12",
  className,
  ...props
}: {
  rows?: number;
  cols?: number;
  itemHeight?: string;
  className?: string;
} & React.ComponentProps<"div">) {
  return (
    <div className={className} {...props}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={`grid grid-cols-${cols} mb-2 gap-2`}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={`${rowIndex}-${colIndex}`}
              className={`${itemHeight} w-full`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for cards
 */
export function CardSkeleton({
  lines = 3,
  className,
  ...props
}: {
  lines?: number;
  className?: string;
} & React.ComponentProps<"div">) {
  return (
    <div className={`rounded-lg border p-4 ${className || ""}`} {...props}>
      <Skeleton className="mb-3 h-6 w-3/4" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`mb-2 h-4 w-full ${index === lines - 1 ? "w-2/3" : ""}`}
        />
      ))}
    </div>
  );
}

/**
 * Loading skeleton for calendar days
 */
export function CalendarDaySkeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={className} {...props}>
      <Skeleton className="mb-2 h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for a list of items
 */
export function ListSkeleton({
  count = 5,
  className,
  ...props
}: {
  count?: number;
  className?: string;
} & React.ComponentProps<"div">) {
  return (
    <div className={`space-y-3 ${className || ""}`} {...props}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

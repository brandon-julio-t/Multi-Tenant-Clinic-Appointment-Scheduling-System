"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { useAppTimezone } from "~/hooks/use-timezone";
import { signOut, useSession } from "~/lib/auth-client";

export const SetupApp = ({ children }: { children: React.ReactNode }) => {
  const [isSetupDone, setIsSetupDone] = React.useState(false);

  const { setTimezone } = useAppTimezone();

  const { data, error, isPending } = useSession();

  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(
    function initApp() {
      void (async () => {
        if (isPending) {
          return;
        }

        if (error) {
          await signOut();
          router.push(`/login?redirect=${pathname}`);
        }

        if (!data) {
          if (pathname !== "/login") {
            router.push(`/login?redirect=${pathname}`);
          }
        }

        // TODO: Get timezone from organization country
        setTimezone("Europe/Berlin");

        setIsSetupDone(true);
      })();
    },
    [data, error, isPending, pathname, router, setTimezone],
  );

  if (!isSetupDone) {
    return (
      <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Setting up your experience...
          </p>
        </div>
      </div>
    );
  }

  return children;
};

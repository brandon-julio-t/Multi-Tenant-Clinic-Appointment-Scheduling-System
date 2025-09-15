"use client";

import { Loader2Icon, Building2Icon, AlertTriangleIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { useAppTimezone } from "~/hooks/use-timezone";
import { authClient, signOut, useSession } from "~/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export const SetupApp = ({ children }: { children: React.ReactNode }) => {
  const [isSetupDone, setIsSetupDone] = React.useState(false);

  const { setTimezone, timezone } = useAppTimezone();

  const sessionQuery = useSession();
  const isLoggedIn = !!sessionQuery.data;

  const activeOrgQuery = authClient.useActiveOrganization();

  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(
    function initApp() {
      void (async () => {
        if (sessionQuery.isPending) {
          return;
        }

        if (sessionQuery.error) {
          await signOut();
          router.push(`/login?redirect=${pathname}`);
        }

        if (!sessionQuery.data) {
          if (pathname !== "/login") {
            router.push(`/login?redirect=${pathname}`);
          }
        }

        const orgMeta = (activeOrgQuery.data?.metadata ?? "{}") as string;
        const orgMetaJson = JSON.parse(orgMeta) as {
          timezone: string;
        };

        setTimezone(orgMetaJson.timezone);

        setIsSetupDone(true);
      })();
    },
    [
      activeOrgQuery.data?.metadata,
      pathname,
      router,
      sessionQuery.data,
      sessionQuery.error,
      sessionQuery.isPending,
      setTimezone,
    ],
  );

  if (!isSetupDone || activeOrgQuery.isPending) {
    return (
      <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Setting up your experience...
          </p>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    if (!activeOrgQuery.data) {
      return <ChooseOrganization />;
    }

    if (!timezone) {
      return (
        <div className="grid h-svh place-items-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mb-4 flex items-center justify-center">
                <AlertTriangleIcon className="text-destructive h-12 w-12" />
              </div>
              <CardTitle className="text-destructive">
                Timezone Configuration Error
              </CardTitle>
              <CardDescription>
                We couldn&apos;t find timezone settings for your organization.
                Please contact your administrator to set up the timezone
                configuration.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }
  }

  return children;
};

function ChooseOrganization() {
  const listOrgQuery = authClient.useListOrganizations();
  const [isSelecting, setIsSelecting] = React.useState<string | null>(null);

  const handleSelectOrganization = async (organizationId: string) => {
    setIsSelecting(organizationId);
    try {
      await authClient.organization.setActive({ organizationId });
      // The activeOrgQuery in the parent component will automatically update
    } catch (error) {
      console.error("Failed to select organization:", error);
    } finally {
      setIsSelecting(null);
    }
  };

  if (listOrgQuery.isPending) {
    return (
      <div className="grid h-svh place-items-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Loading organizations...
          </p>
        </div>
      </div>
    );
  }

  if (listOrgQuery.error) {
    return (
      <div className="grid h-svh place-items-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              Failed to load organizations. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="from-background to-muted/20 flex min-h-svh items-center justify-center bg-gradient-to-br p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Building2Icon className="text-primary h-8 w-8" />
            <h1 className="text-3xl font-bold">Choose Organization</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Select the organization you&apos;d like to work with
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listOrgQuery.data?.map((org) => (
            <Card
              key={org.id}
              className="group cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2Icon className="text-primary h-5 w-5" />
                  {org.name}
                </CardTitle>
                <CardDescription>Organization workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleSelectOrganization(org.id)}
                  disabled={isSelecting === org.id}
                  className="group-hover:bg-primary/90 w-full transition-colors"
                >
                  {isSelecting === org.id ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Selecting...
                    </>
                  ) : (
                    "Select Organization"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!listOrgQuery.data || listOrgQuery.data.length === 0) && (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>No Organizations Found</CardTitle>
              <CardDescription>
                You don&apos;t have access to any organizations yet. Please
                contact your administrator.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}

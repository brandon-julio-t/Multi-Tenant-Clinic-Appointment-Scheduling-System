"use client";

import { GalleryVerticalEnd } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { LoginForm } from "~/components/login-form";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg) {
      setMessage(msg);
      // Clear the message from URL after displaying
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams]);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Acme Inc.
        </a>
        {message && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-600">
            {message}
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
}

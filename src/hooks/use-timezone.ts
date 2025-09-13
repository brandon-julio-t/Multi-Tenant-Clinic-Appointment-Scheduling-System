import { tz } from "@date-fns/tz";
import { format } from "date-fns";
import { atom, useAtom } from "jotai";
import React from "react";

export const appTimezoneAtom = atom<string>("");

export function useAppTimezone() {
  const [timezone, setTimezone] = useAtom(appTimezoneAtom);

  return React.useMemo(() => {
    return { timezone, setTimezone };
  }, [timezone, setTimezone]);
}

export function useGlobalTime() {
  const { timezone } = useAppTimezone();

  const [localTime, setLocalTime] = React.useState("");
  const [appTime, setAppTime] = React.useState("");

  React.useEffect(() => {
    function tick() {
      setLocalTime(format(new Date(), "PPPPpppp"));
      setAppTime(format(new Date(), "PPPPpppp", { in: tz(timezone) }));
    }

    const id = window.setInterval(() => {
      tick();
    }, 1000);

    tick();

    return () => {
      window.clearInterval(id);
    };
  }, [timezone]);

  return React.useMemo(() => {
    return { localTime, appTime };
  }, [localTime, appTime]);
}

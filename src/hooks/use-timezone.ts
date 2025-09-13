import { atom, useAtom } from "jotai";
import React from "react";

export const appTimezoneAtom = atom<string>("");

export function useAppTimezone() {
  const [timezone, setTimezone] = useAtom(appTimezoneAtom);

  return React.useMemo(() => {
    return { timezone, setTimezone };
  }, [timezone, setTimezone]);
}

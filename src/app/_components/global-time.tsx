import { useGlobalTime } from "~/hooks/use-timezone";

export const GlobalTime = () => {
  const { localTime, appTime } = useGlobalTime();

  return (
    <div>
      <div>Local Time: {localTime}</div>
      <div>App Time: {appTime}</div>
    </div>
  );
};

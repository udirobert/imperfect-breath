import { useEffect, useState } from "react";
import {
  applyDayPart,
  dayPartFromHour,
  type DayPart,
} from "@/lib/atmosphere/dayPart";

export function useDayPart(): DayPart {
  const [part, setPart] = useState<DayPart>(() =>
    dayPartFromHour(new Date().getHours()),
  );

  useEffect(() => {
    const sync = () => {
      const next = dayPartFromHour(new Date().getHours());
      setPart(next);
      applyDayPart(next);
    };
    sync();
    const id = window.setInterval(sync, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return part;
}

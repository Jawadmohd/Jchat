import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";

dayjs.extend(calendar);

export const formatChatTime = (date: string): string => {
  return dayjs(date).calendar(null, {
    sameDay: "h:mm A",
    lastDay: "[Yesterday]",
    lastWeek: "dddd",
    sameElse: "DD/MM/YYYY",
  });
};

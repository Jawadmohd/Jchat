import dayjs from "dayjs";

export const formatMessageDateLabel = (date: string): string => {
  const messageDate = dayjs(date).startOf("day");
  const today = dayjs().startOf("day");
  const yesterday = today.subtract(1, "day");

  if (messageDate.isSame(today)) {
    return "Today";
  }

  if (messageDate.isSame(yesterday)) {
    return "Yesterday";
  }

  if (messageDate.isSame(today, "year")) {
    return messageDate.format("D MMMM");
  }

  return messageDate.format("D MMMM YYYY");
};

export const getMessageDateKey = (date: string): string => dayjs(date).format("YYYY-MM-DD");

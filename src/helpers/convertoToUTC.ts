// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const convertToUTC = (date: Date, endOfDay: boolean = false) => {
  const utcOptions = {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
    hour: endOfDay ? 23 : 0,
    minute: endOfDay ? 59 : 0,
    second: endOfDay ? 59 : 0,
    millisecond: endOfDay ? 999 : 0
  };

  return new Date(
    Date.UTC(
      utcOptions.year,
      utcOptions.month,
      utcOptions.day,
      utcOptions.hour,
      utcOptions.minute,
      utcOptions.second,
      utcOptions.millisecond
    )
  );
};

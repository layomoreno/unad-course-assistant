import { format, parseISO, subDays } from 'date-fns';

export function getEventDate(endDateStr: string) {
  return parseISO(endDateStr);
}

export function getReminders(endDateStr: string) {
  const endDate = parseISO(endDateStr);
  return [
    { label: '1 semana antes', date: subDays(endDate, 7) },
    { label: '5 días antes', date: subDays(endDate, 5) },
    { label: '4 días antes', date: subDays(endDate, 4) },
    { label: '3 días antes', date: subDays(endDate, 3) },
  ];
}

export function formatDate(date: Date) {
  return format(date, 'dd/MM/yyyy');
}

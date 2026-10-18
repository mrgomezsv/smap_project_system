/** Zona horaria del negocio (El Salvador, UTC-6 sin horario de verano). */
export const BUSINESS_TIMEZONE =
  process.env.BUSINESS_TIMEZONE || 'America/El_Salvador';

/** Fecha/hora de pared (wall clock) de `date` en `timeZone`, como epoch UTC. */
function wallClockMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
    date.getUTCMilliseconds(),
  );
}

/**
 * Devuelve el instante (UTC) correspondiente a las 23:59:59.999 del día
 * calendario de `date` en la zona `timeZone`. Independiente de la zona
 * horaria del servidor (los contenedores corren en UTC).
 */
export function endOfDayInTimeZone(
  date: Date,
  timeZone: string = BUSINESS_TIMEZONE,
): Date {
  const local = new Date(wallClockMs(date, timeZone));
  const target = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
    23,
    59,
    59,
    999,
  );
  const offset = wallClockMs(new Date(target), timeZone) - target;
  return new Date(target - offset);
}

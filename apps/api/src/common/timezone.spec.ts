import { endOfDayInTimeZone } from './timezone';

describe('endOfDayInTimeZone', () => {
  it('cierra el día a medianoche de El Salvador (05:59:59.999 UTC)', () => {
    // 18 oct 2026, 15:00 en El Salvador = 21:00 UTC
    const now = new Date('2026-10-18T21:00:00Z');
    expect(endOfDayInTimeZone(now, 'America/El_Salvador').toISOString()).toBe(
      '2026-10-19T05:59:59.999Z',
    );
  });

  it('usa el día local aunque en UTC ya sea el día siguiente', () => {
    // 18 oct 2026, 22:30 en El Salvador = 19 oct 04:30 UTC
    const now = new Date('2026-10-19T04:30:00Z');
    expect(endOfDayInTimeZone(now, 'America/El_Salvador').toISOString()).toBe(
      '2026-10-19T05:59:59.999Z',
    );
  });
});

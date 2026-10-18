import { detectContactSpam } from './spam-filter';

const ok = {
  firstName: 'María',
  lastName: 'López',
  reason: 'Quiero cotizar un brincolín para el sábado',
};

describe('detectContactSpam', () => {
  it('deja pasar un mensaje normal', () => {
    expect(detectContactSpam(ok)).toBeNull();
  });

  it('deja pasar nombres reales con mayúsculas (McDonald, DeLaCruz)', () => {
    expect(
      detectContactSpam({ ...ok, firstName: 'McDonald', lastName: 'DeLaCruz' }),
    ).toBeNull();
  });

  it('bloquea el bot observado: nombre aleatorio y mensaje numérico', () => {
    expect(
      detectContactSpam({
        firstName: 'KdnxAcKjincm',
        lastName: 'ywODurkHlOWE',
        reason: '7357172088',
      }),
    ).not.toBeNull();
  });

  it('bloquea nombres aleatorios aunque el mensaje tenga texto', () => {
    expect(
      detectContactSpam({ ...ok, firstName: 'qLWxEczpPKBH' }),
    ).toBe('nombre aleatorio');
  });

  it('bloquea si se llena el campo trampa', () => {
    expect(detectContactSpam({ ...ok, website: 'http://spam' })).toBe(
      'honeypot',
    );
  });

  it('bloquea envíos hechos en menos de 3 segundos', () => {
    expect(
      detectContactSpam({ ...ok, formStartedAt: Date.now() - 500 }),
    ).toBe('enviado demasiado rápido');
  });
});

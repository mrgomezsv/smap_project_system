'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { SignaturePad } from '@/components/public/SignaturePad';

interface RentalContract {
  id: number;
  token: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress: string;
  equipment: string;
  groundType?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  deposit?: number;
  notes?: string;
  status: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
  signedAt?: string;
}

const CHECKLIST_ITEMS = [
  'I have been shown how inflatable is secured.',
  'I have been shown how to turn on/off blower.',
  'In the event of high winds or storms, I have been instructed to get all participants off the unit and unplug the motor and extension cord from the power outlet.',
  'I have been instructed to not allow any horseplay, flips, wrestling or any other unsafe activities both in and around inflatable.',
  'I have been advised of the following: No shoes or sharp objects in or around the inflatable unit(s); No food, drinks or gum; No eyeglasses or jewelry.',
  'I understand that adult (18 years old & up) operators must be provided to watch the games at all times.',
  'I have been advised that children of the same size or age group only may use the unit(s) at any given time, no adults.',
  'I agree to remove any person from the inflatable who is violating posted rules of operation.',
  'I have received written instruction on the safe operation of inflatable and agree to follow all safety rules.',
];

export default function FirmarContratoPage() {
  const params = useParams();
  const token = params.token as string;

  const [contract, setContract] = useState<RentalContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signedSuccess, setSignedSuccess] = useState(false);

  const [signature, setSignature] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    CHECKLIST_ITEMS.forEach((_, i) => (init[`check_${i}`] = false));
    return init;
  });

  useEffect(() => {
    async function fetchContract() {
      try {
        setLoading(true);
        const data = await api.get<RentalContract>(`/api/v2/contracts/public/${token}`);
        setContract(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg('No se pudo cargar la información del contrato.');
        }
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchContract();
  }, [token]);

  function handleChecklistToggle(index: number) {
    setChecklist((prev) => ({
      ...prev,
      [`check_${index}`]: !prev[`check_${index}`],
    }));
  }

  const allChecklistAccepted = CHECKLIST_ITEMS.every(
    (_, index) => checklist[`check_${index}`] === true,
  );

  async function handleSignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allChecklistAccepted) {
      alert('Debes aceptar todos los puntos de seguridad antes de firmar.');
      return;
    }

    if (!signature) {
      alert('Por favor realiza tu firma en el recuadro antes de continuar.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.post(`/api/v2/contracts/public/${token}/sign`, {
        signatureImage: signature,
        safetyChecklist: checklist,
      });

      setSignedSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Error al procesar la firma del contrato.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="card text-center py-12 text-text-muted">Cargando documento de contrato...</div>
      </div>
    );
  }

  if (errorMsg && !contract) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center py-8">
          <div className="text-5xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-danger mb-2">Enlace no válido</h2>
          <p className="text-sm text-text-muted">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  const isAlreadySigned = contract.status === 'SIGNED' || signedSuccess;
  const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v2/contracts/public/${token}/pdf`;

  return (
    <div className="min-h-screen bg-surface py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Encabezado */}
        <header className="card bg-gradient-to-r from-primary to-primary-700 text-white p-6 md:p-8 rounded-3xl shadow-large text-center">
          <span className="inline-block bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Tehuacan Promotions / Kidsfun y Fiestas Infantiles
          </span>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold">
            Rental Agreement & Liability Waiver
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Contrato Oficial de Alquiler de Equipos e Inflables
          </p>
        </header>

        {/* Estado si ya fue firmado */}
        {isAlreadySigned ? (
          <div className="card text-center py-10 space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-success">¡Contrato Firmado Exitosamente!</h2>
            <p className="text-text-muted text-sm max-w-lg mx-auto">
              Muchas gracias, <strong>{contract.clientName}</strong>. Hemos registrado tu firma electrónica e información de auditoría. Se ha enviado una copia firmada en PDF a tu correo (<strong>{contract.clientEmail}</strong>).
            </p>

            <div className="pt-4">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary px-8 py-3 text-base shadow-medium inline-flex items-center gap-2"
              >
                📄 Descargar mi Contrato Firmado (PDF)
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm font-medium">
                {errorMsg}
              </div>
            )}

            {/* Resumen del cliente y reserva */}
            <section className="card space-y-4">
              <h2 className="text-lg font-heading font-bold text-primary border-b border-border pb-2">
                1. Resumen de la Reserva
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted text-xs block">Cliente</span>
                  <strong className="text-text-primary text-base">{contract.clientName}</strong>
                </div>
                <div>
                  <span className="text-text-muted text-xs block">Correo Electrónico</span>
                  <span className="font-medium text-text-primary">{contract.clientEmail}</span>
                </div>
                <div>
                  <span className="text-text-muted text-xs block">Dirección de Entrega</span>
                  <span className="font-medium text-text-primary">{contract.clientAddress}</span>
                </div>
                <div>
                  <span className="text-text-muted text-xs block">Equipo Contratado</span>
                  <strong className="text-brand-yellow font-bold text-base">{contract.equipment}</strong>
                </div>
                {contract.eventDate && (
                  <div>
                    <span className="text-text-muted text-xs block">Fecha del Evento</span>
                    <span className="font-medium">{new Date(contract.eventDate).toLocaleDateString()}</span>
                  </div>
                )}
                {contract.startTime && (
                  <div>
                    <span className="text-text-muted text-xs block">Horario</span>
                    <span className="font-medium">{contract.startTime} - {contract.endTime}</span>
                  </div>
                )}
                {contract.price && (
                  <div className="md:col-span-2 p-3 bg-surface-elevated rounded-xl border border-border flex flex-wrap justify-between gap-4">
                    <div>
                      <span className="text-text-muted text-xs block">Precio Acordado:</span>
                      <strong className="text-text-primary text-base">${Number(contract.price).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted text-xs block">Anticipo Pagado:</span>
                      <strong className="text-success text-base">${Number(contract.deposit || 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted text-xs block">Saldo Restante al Entregar:</span>
                      <strong className="text-primary text-base">${Math.max(0, Number(contract.price) - Number(contract.deposit || 0)).toFixed(2)}</strong>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Reglas de Seguridad */}
            <section className="card space-y-3">
              <h2 className="text-lg font-heading font-bold text-primary border-b border-border pb-2">
                2. Reglas de Seguridad y Responsabilidades (Safety Rules)
              </h2>
              <div className="text-xs text-text-muted space-y-2.5 max-h-72 overflow-y-auto p-4 bg-surface-elevated rounded-xl border border-border leading-relaxed">
                <p>1) No food, drink or chewing gum on or around the Inflatable. This will avoid a choking risk and keep the unit clean. (Please note if the Inflatable is collected in a dirty condition then the person hiring it will incur a cleaning charge)</p>
                <p>2) Shoes, glasses, jewelry, and badges MUST be removed before using the inflatable to avoid injury to peoples using the equipment and harm to the Inflatable.</p>
                <p>3) NO face paints, party poppers, colored streamers or SILLY STRING to be used either on or near the Inflatable. (Please note these products will cause damage to the Inflatable that cannot be repaired)</p>
                <p>4) Only 1 rider allowed at the top of water slide at a time, or 2 riders for double lane slides, 6 riders per bounce house or combo unit.</p>
                <p>5) (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) not responsible for striking or damaging any underground utility lines/devices (included but not limited to: electrical, plumbing, sprinkler, etc.). It is lessee’s responsibility to tell Rental Company where inflatable is to be set up and have any underground utility lines marked prior too.</p>
                <p>6) Climbing, hanging or sitting on walls is dangerous and must not be allowed.</p>
                <p>7) A responsible Adult must supervise the inflatable at all times.</p>
                <p>8) Always ensure that the Inflatable is not overcrowded, and limit numbers according to the age and size of children using it. Try to avoid large and small children from using it at the same time.</p>
                <p>9) Ensure Children are not pushing, colliding, fighting or behaving in a manner likely to injure or cause distress to others.</p>
                <p>10) No pets, toys or sharp instruments on the inflatable at any time.</p>
                <p>11) Do not allow anyone to bounce on the front safety step as this is dangerous.</p>
                <p>12) Do not allow anyone to be on the inflatable equipment during inflation or deflation as this is DANGEROUS.</p>
                <p>13) Please ensure that Children are not attempting somersaults and are clothed appropriately and that nothing can fall out of their pockets.</p>
                <p>14) In the event that the blower stops working, please ensure all users get off the inflatable immediately and calmly. Check the fuses and make sure the blower tube or deflation tube has not come undone or something has not blown onto and is obstructing the blower. In the event that it overheats, or loses power, switch the blower off at the mains, then switch it back on again 1 or 2 minutes later, and it should restart. If it does not, inform us immediately.</p>
                <p className="font-bold text-primary">15) THE MOST IMPORTANT RULE: DO NOT let children play on the inflatable without Adult supervision. Adult supervision is necessary to enforce these rules for safe operation of the Inflatable.</p>
              </div>
            </section>

            {/* Exención de Responsabilidad Legal */}
            <section className="card space-y-3">
              <h2 className="text-lg font-heading font-bold text-primary border-b border-border pb-2">
                3. Exención de Responsabilidad Civil (Liability Disclaimer)
              </h2>
              <div className="text-xs text-text-muted space-y-2.5 max-h-72 overflow-y-auto p-4 bg-surface-elevated rounded-xl border border-border leading-relaxed">
                <p>1) This rental equipment has been received in good condition and will be returned in the same condition (ordinary wear and accepted).</p>
                <p>2) Customer agrees to company right to enter premises of customer at any time to repossess said equipment.</p>
                <p>3) Customer agrees to reimburse (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) for all attorney fees, an amount not less than 50% of all sums due, court cost and expenses incurred by Rental Company to enforce collection or to preserve or enforce rights under this contract.</p>
                <p>4) Customer agrees not to loan, sublet or otherwise depose of equipment or use it at any other location.</p>
                <p>5) Customer agrees to pay in full the replacement cost, including labor, for all damages to rental equipment.</p>
                <p>6) If the inflatable equipment is lost, stolen, or damaged beyond repair the renter agrees to pay up to $3000.00 (Three thousand dollars and 0 cents).</p>
                <p>7) Customer agrees to ensure that all users (and users’ guardians) of the rental go over and read all rules.</p>
                <p>8) THERE ARE NO WARRANTIES OF MERCHANTABILITY OR FITNESS EITHER EXPRESSED OR IMPLIED. The person/s or organization renting this Equipment from (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) will be held responsible and liable for any and all damage or injury occurring for any reason whatsoever. I have read the above agreement and fully understand and accept the conditions as above. I am aware that while in my care I am fully responsible for the inflatable and will pay for any loss or damages that may occur.</p>
                <p>9) Lessee understands and acknowledges that play on an amusement device entails both known and unknown risks including, but not limited to, physical injury from falling, slipping, crashing or colliding, emotional injury, paralysis, distress, damage or death to any participant. Lessee agrees to indemnify and hold (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) harmless from any and all claims, actions, suits, proceedings, costs, expenses, fees, damages and liabilities, including, but not limited to, reasonable attorney’s fees and costs, arising by reason of injury, damage, or death to persons or property, in connection with or resulting from the use of the leased equipment. This includes, but is not limited to, the manufacture, selection, delivery, possession, use, operation, or return of the equipment. Lessee hereby releases and holds harmless (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) from injuries or damages incurred as a result of the use of the leased equipment. (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) cannot, under any circumstances, be held liable for injuries as a result of inappropriate use, God, nature, or other conditions beyond its control or knowledge. Lessee also agrees to indemnify and hold harmless (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) from any loss, damage, theft or destruction of the equipment during the term of the lease and any extensions thereof.</p>
              </div>
            </section>

            {/* Checklist de Verificación */}
            <section className="card space-y-3">
              <h2 className="text-lg font-heading font-bold text-primary border-b border-border pb-2">
                4. Lista de Verificación (Safety Checklist)
              </h2>
              <p className="text-xs text-text-muted">
                Por favor confirma que has leído y aceptas los puntos de seguridad para la operación del equipo:
              </p>

              <div className="space-y-2">
                {CHECKLIST_ITEMS.map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-3 p-2.5 rounded-xl border border-border hover:bg-surface-elevated cursor-pointer transition text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checklist[`check_${idx}`])}
                      onChange={() => handleChecklistToggle(idx)}
                      className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-text-primary font-medium">{item}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Firma Electrónica Táctil */}
            <section className="card space-y-4">
              <h2 className="text-lg font-heading font-bold text-primary border-b border-border pb-2">
                5. Firma Electrónica del Cliente
              </h2>
              <p className="text-xs text-text-muted">
                Al trazar tu firma a continuación, declaras que has leído y aceptas íntegramente los términos y condiciones de este contrato.
              </p>

              <SignaturePad onSignatureChange={(png) => setSignature(png)} />

              <div className="pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={submitting || !signature || !allChecklistAccepted}
                  className="btn btn-primary w-full py-3.5 text-base font-extrabold shadow-large"
                >
                  {submitting ? 'Procesando Firma...' : '✍️ Firmar y Aceptar Contrato'}
                </button>
              </div>
            </section>
          </form>
        )}
      </div>
    </div>
  );
}

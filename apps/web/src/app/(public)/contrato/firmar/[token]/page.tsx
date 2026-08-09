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
  'I have been shown how inflatable is secured safely.',
  'I have been shown how to turn on/off blower.',
  'In high winds or storms, I will remove all participants and unplug motor.',
  'No horseplay, flips, wrestling or unsafe activities permitted.',
  'No shoes, sharp objects, food, drinks, gum, glasses or jewelry in unit.',
  'Adult (18+) operator will supervise the unit at all times.',
  'Children of same size/age group only on unit at any given time (no adults).',
  'I agree to remove any person violating posted operation rules.',
  'I have received instructions and agree to follow all safety rules.',
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
            Kidsfun & Fiestas Infantiles
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
              <div className="text-xs text-text-muted space-y-2 max-h-60 overflow-y-auto p-3 bg-surface-elevated rounded-xl border border-border">
                <p>1) No food, drink or chewing gum on or around the Inflatable.</p>
                <p>2) Shoes, glasses, jewelry, and badges MUST be removed before using the inflatable.</p>
                <p>3) NO face paints, party poppers, colored streamers or SILLY STRING near the Inflatable.</p>
                <p>4) Only 1 rider allowed at top of water slide at a time (2 for double lane), max 6 riders per bounce house.</p>
                <p>5) Rental Company is not responsible for striking underground utility lines.</p>
                <p>6) Climbing, hanging or sitting on walls is dangerous and strictly prohibited.</p>
                <p>7) A responsible Adult (18+) must supervise the inflatable at all times.</p>
                <p>8) Always ensure Inflatable is not overcrowded according to age and size of children.</p>
                <p>9) Ensure children are not pushing, colliding, or fighting.</p>
                <p>10) No pets, toys or sharp instruments on inflatable at any time.</p>
                <p>11) Do not allow anyone to bounce on front safety step.</p>
                <p>12) Do not allow anyone on inflatable during inflation or deflation.</p>
                <p>13) Ensure children are not attempting somersaults and pockets are empty.</p>
                <p>14) In event blower stops, ensure users get off calmly and check power/fuses.</p>
                <p><strong>15) MOST IMPORTANT RULE: DO NOT let children play on inflatable without Adult supervision.</strong></p>
              </div>
            </section>

            {/* Checklist de Verificación */}
            <section className="card space-y-3">
              <h2 className="text-lg font-heading font-bold text-primary border-b border-border pb-2">
                3. Lista de Verificación (Safety Checklist)
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
                4. Firma Electrónica del Cliente
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

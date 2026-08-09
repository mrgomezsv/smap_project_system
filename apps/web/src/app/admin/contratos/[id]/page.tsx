'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import type {
  ContractAdminDetail,
  ContractDocument,
  ContractPayment,
  ContractStatus,
} from '@/lib/types';

type FlashKind = 'success' | 'error' | 'info';
type Flash = { kind: FlashKind; message: string } | null;

function statusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'Pendiente';
    case 'SIGNED':
      return 'Firmado';
    case 'EXPIRED':
      return 'Expirado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status;
  }
}

function statusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'SIGNED':
      return 'bg-success/20 text-success border border-success/30';
    case 'PENDING':
      return 'bg-warning/20 text-warning border border-warning/30';
    case 'EXPIRED':
      return 'bg-text-muted/20 text-text-muted border border-border';
    case 'CANCELLED':
      return 'bg-danger/15 text-danger border border-danger/30';
    default:
      return 'bg-text-muted/15 text-text-muted border border-border';
  }
}

function formatMoney(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `$${n.toFixed(2)}`;
}

function documentKindLabel(kind: string): string {
  switch (kind.toUpperCase()) {
    case 'ISSUED_PDF':
      return 'PDF emitido';
    case 'ELECTRONIC_SIGNED_PDF':
      return 'PDF firmado (electrónico)';
    case 'UPLOADED_SIGNED_PDF':
      return 'PDF firmado (subido)';
    case 'PAYMENT_RECEIPT':
      return 'Recibo de pago';
    case 'OTHER':
      return 'Otro documento';
    default:
      return kind;
  }
}

function paymentTypeLabel(type: string): string {
  switch (type.toUpperCase()) {
    case 'DEPOSIT':
      return 'Anticipo';
    case 'PAYMENT':
      return 'Pago';
    case 'REFUND':
      return 'Reembolso';
    default:
      return type;
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exp = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, exp)).toFixed(exp === 0 ? 0 : 1)} ${units[exp]}`;
}

interface ContractEditForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCityStateZip: string;
  driverLicense: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  equipment: string;
  groundType: string;
  price: string;
  deposit: string;
  notes: string;
}

const TIME_OPTIONS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
  '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM',
];

function toDateInputValue(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function AdminContratoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const id = Number(params?.id);

  const [contract, setContract] = useState<ContractAdminDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash>(null);

  const [editForm, setEditForm] = useState<ContractEditForm | null>(null);
  const [editingSaving, setEditingSaving] = useState(false);

  const [signedPdfFile, setSignedPdfFile] = useState<File | null>(null);
  const [otherPdfFile, setOtherPdfFile] = useState<File | null>(null);
  const [otherKind, setOtherKind] = useState<'PAYMENT_RECEIPT' | 'OTHER'>('PAYMENT_RECEIPT');
  const [receiptPaymentId, setReceiptPaymentId] = useState<string>('');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    type: 'PAYMENT' as 'DEPOSIT' | 'PAYMENT' | 'REFUND',
    amount: '',
    method: 'cash',
    reference: '',
    paidAt: '',
    notes: '',
  });
  const [addingPayment, setAddingPayment] = useState(false);

  const [confirmState, setConfirmState] = useState<
    | null
    | { kind: 'archive' }
    | { kind: 'cancel'; reason: string }
    | { kind: 'hardDelete'; reason: string }
    | { kind: 'deleteDocument'; documentId: number | string; reason: string }
    | { kind: 'deletePayment'; paymentId: number | string; reason: string }
  >(null);

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setLoadError('Identificador de contrato inválido.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError(null);
      const res = await api.get<ContractAdminDetail>(`/api/v2/contracts/${id}`, { getToken });
      setContract(res);
      setEditForm({
        clientName: res.clientName ?? '',
        clientEmail: res.clientEmail ?? '',
        clientPhone: res.clientPhone ?? '',
        clientAddress: res.clientAddress ?? '',
        clientCityStateZip: res.clientCityStateZip ?? '',
        driverLicense: res.driverLicense ?? '',
        eventDate: toDateInputValue(res.eventDate),
        startTime: res.startTime ?? '10:00 AM',
        endTime: res.endTime ?? '06:00 PM',
        equipment: res.equipment ?? '',
        groundType: res.groundType ?? 'Grass',
        price: res.price != null ? String(res.price) : '',
        deposit: res.deposit != null ? String(res.deposit) : '',
        notes: res.notes ?? '',
      });
    } catch (e) {
      if (e instanceof ApiError) {
        setLoadError(e.message);
      } else {
        setLoadError('No se pudo cargar el contrato.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const flashAutoDismiss = useCallback((message: string, kind: FlashKind = 'info') => {
    setFlash({ kind, message });
  }, []);

  useEffect(() => {
    if (!flash) return;
    const handle = setTimeout(() => setFlash(null), 4500);
    return () => clearTimeout(handle);
  }, [flash]);

  function setField<K extends keyof ContractEditForm>(key: K, value: ContractEditForm[K]) {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleResendInvite() {
    if (!contract) return;
    try {
      setActionPending('resend-invite');
      const res = await api.post<{ emailSent: boolean; signUrl: string }>(
        `/api/v2/contracts/${contract.id}/resend-invite`,
        {},
        { getToken }
      );
      flashAutoDismiss(
        res.emailSent
          ? 'Invitación reenviada por email.'
          : 'No se pudo enviar el email. Comparte el enlace manualmente.',
        res.emailSent ? 'success' : 'error'
      );
    } catch (e) {
      flashAutoDismiss(
        e instanceof ApiError ? e.message : 'Error al reenviar la invitación.',
        'error'
      );
    } finally {
      setActionPending(null);
    }
  }

  async function handleResendSigned() {
    if (!contract) return;
    try {
      setActionPending('resend-signed');
      const res = await api.post<{ emailSent: boolean }>(
        `/api/v2/contracts/${contract.id}/resend-signed`,
        {},
        { getToken }
      );
      flashAutoDismiss(
        res.emailSent ? 'Copia firmada reenviada.' : 'No se pudo reenviar la copia firmada.',
        res.emailSent ? 'success' : 'error'
      );
    } catch (e) {
      flashAutoDismiss(
        e instanceof ApiError ? e.message : 'Error al reenviar la copia firmada.',
        'error'
      );
    } finally {
      setActionPending(null);
    }
  }

  async function performCancel(reason: string) {
    if (!contract) return;
    try {
      setActionPending('cancel');
      await api.post(`/api/v2/contracts/${contract.id}/cancel`, { reason }, { getToken });
      flashAutoDismiss('Contrato cancelado.', 'success');
      setConfirmState(null);
      await loadDetail();
    } catch (e) {
      flashAutoDismiss(e instanceof ApiError ? e.message : 'Error al cancelar el contrato.', 'error');
    } finally {
      setActionPending(null);
    }
  }

  async function performArchive() {
    if (!contract) return;
    try {
      setActionPending('archive');
      await api.post(`/api/v2/contracts/${contract.id}/archive`, {}, { getToken });
      flashAutoDismiss('Contrato archivado.', 'success');
      setConfirmState(null);
      await loadDetail();
    } catch (e) {
      flashAutoDismiss(e instanceof ApiError ? e.message : 'Error al archivar el contrato.', 'error');
    } finally {
      setActionPending(null);
    }
  }

  async function performHardDelete(reason: string) {
    if (!contract) return;
    try {
      setActionPending('hardDelete');
      await api.delete(`/api/v2/contracts/${contract.id}`, {
        getToken,
        body: { reason },
      });
      flashAutoDismiss('Contrato eliminado definitivamente.', 'success');
      setConfirmState(null);
      router.push('/admin/contratos');
    } catch (e) {
      flashAutoDismiss(e instanceof ApiError ? e.message : 'Error al eliminar el contrato.', 'error');
    } finally {
      setActionPending(null);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!contract || !editForm) return;
    try {
      setEditingSaving(true);
      const payload = {
        clientName: editForm.clientName,
        clientEmail: editForm.clientEmail,
        clientPhone: editForm.clientPhone || undefined,
        clientAddress: editForm.clientAddress,
        clientCityStateZip: editForm.clientCityStateZip || undefined,
        driverLicense: editForm.driverLicense || undefined,
        eventDate: editForm.eventDate || undefined,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        equipment: editForm.equipment,
        groundType: editForm.groundType,
        price: editForm.price ? Number(editForm.price) : undefined,
        deposit: editForm.deposit ? Number(editForm.deposit) : undefined,
        notes: editForm.notes || undefined,
      };
      await api.patch(`/api/v2/contracts/${contract.id}`, payload, { getToken });
      flashAutoDismiss('Contrato actualizado.', 'success');
      await loadDetail();
    } catch (e) {
      flashAutoDismiss(
        e instanceof ApiError ? e.message : 'No se pudo actualizar el contrato.',
        'error'
      );
    } finally {
      setEditingSaving(false);
    }
  }

  async function handleDownloadDocument(doc: ContractDocument) {
    try {
      setActionPending(`download-${doc.id}`);
      const blob = await api.download(`/api/v2/contracts/${id}/documents/${doc.id}/download`, {
        getToken,
      });
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = doc.originalFilename || `documento-${doc.id}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      flashAutoDismiss(
        e instanceof ApiError ? e.message : 'No se pudo descargar el documento.',
        'error'
      );
    } finally {
      setActionPending(null);
    }
  }

  async function handleDeleteDocument(doc: ContractDocument) {
    setConfirmState({ kind: 'deleteDocument', documentId: doc.id, reason: '' });
  }

  async function performDeleteDocument(reason: string) {
    if (!contract) return;
    const target = confirmState && confirmState.kind === 'deleteDocument' ? confirmState : null;
    if (!target) return;
    try {
      setActionPending(`delete-doc-${target.documentId}`);
      await api.delete(`/api/v2/contracts/${id}/documents/${target.documentId}`, {
        getToken,
        body: { reason },
      });
      flashAutoDismiss('Documento eliminado.', 'success');
      setConfirmState(null);
      await loadDetail();
    } catch (e) {
      flashAutoDismiss(
        e instanceof ApiError ? e.message : 'No se pudo eliminar el documento.',
        'error'
      );
    } finally {
      setActionPending(null);
    }
  }

  async function handleUploadSignedPdf(e: React.FormEvent) {
    e.preventDefault();
    if (!contract || !signedPdfFile) return;
    try {
      setUploadingDoc('signed');
      const fd = new FormData();
      fd.append('file', signedPdfFile);
      fd.append('kind', 'UPLOADED_SIGNED_PDF');
      await api.post<{ id: number | string }>(`/api/v2/contracts/${contract.id}/documents`, fd, {
        getToken,
      });
      flashAutoDismiss('PDF firmado subido correctamente.', 'success');
      setSignedPdfFile(null);
      await loadDetail();
    } catch (e) {
      flashAutoDismiss(
        e instanceof ApiError ? e.message : 'No se pudo subir el PDF firmado.',
        'error'
      );
    } finally {
      setUploadingDoc(null);
    }
  }

  async function handleUploadOther(e: React.FormEvent) {
    e.preventDefault();
    if (!contract || !otherPdfFile) return;
    if (otherKind === 'PAYMENT_RECEIPT' && !receiptPaymentId) {
      flashAutoDismiss('Selecciona el pago al que pertenece el recibo.', 'error');
      return;
    }
    try {
      setUploadingDoc('other');
      const fd = new FormData();
      fd.append('file', otherPdfFile);
      fd.append('kind', otherKind);
      if (otherKind === 'PAYMENT_RECEIPT' && receiptPaymentId) {
        fd.append('paymentId', receiptPaymentId);
      }
      await api.post<{ id: number | string }>(`/api/v2/contracts/${contract.id}/documents`, fd, {
        getToken,
      });
      flashAutoDismiss('Documento subido correctamente.', 'success');
      setOtherPdfFile(null);
      setReceiptPaymentId('');
      await loadDetail();
    } catch (e) {
      flashAutoDismiss(
        e instanceof ApiError ? e.message : 'No se pudo subir el documento.',
        'error'
      );
    } finally {
      setUploadingDoc(null);
    }
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!contract) return;
    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      flashAutoDismiss('Ingresa un monto válido.', 'error');
      return;
    }
    try {
      setAddingPayment(true);
      const payload: Record<string, unknown> = {
        type: paymentForm.type,
        amount,
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      };
      if (paymentForm.paidAt) payload.paidAt = new Date(paymentForm.paidAt).toISOString();
      await api.post(`/api/v2/contracts/${contract.id}/payments`, payload, { getToken });
      flashAutoDismiss('Pago registrado.', 'success');
      setPaymentForm({
        type: 'PAYMENT',
        amount: '',
        method: 'cash',
        reference: '',
        paidAt: '',
        notes: '',
      });
      await loadDetail();
    } catch (e) {
      flashAutoDismiss(
        e instanceof ApiError ? e.message : 'No se pudo registrar el pago.',
        'error'
      );
    } finally {
      setAddingPayment(false);
    }
  }

  async function handleDeletePayment(p: ContractPayment) {
    setConfirmState({ kind: 'deletePayment', paymentId: p.id, reason: '' });
  }

  async function performDeletePayment(reason: string) {
    const target = confirmState && confirmState.kind === 'deletePayment' ? confirmState : null;
    if (!target) return;
    try {
      setActionPending(`delete-payment-${target.paymentId}`);
      await api.delete(`/api/v2/contracts/${id}/payments/${target.paymentId}`, {
        getToken,
        body: { reason },
      });
      flashAutoDismiss('Pago eliminado.', 'success');
      setConfirmState(null);
      await loadDetail();
    } catch (e) {
      flashAutoDismiss(
        e instanceof ApiError ? e.message : 'No se pudo eliminar el pago.',
        'error'
      );
    } finally {
      setActionPending(null);
    }
  }

  if (loading) {
    return <div className="card text-center py-12 text-text-muted">Cargando expediente…</div>;
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="card border border-danger/30 bg-danger/5 text-danger text-sm p-4">
          ⚠ {loadError}
        </div>
        <Link href="/admin/contratos" className="btn btn-secondary text-sm inline-block">
          ← Volver al listado
        </Link>
      </div>
    );
  }

  if (!contract || !editForm) {
    return <div className="card text-center py-12 text-text-muted">Sin datos.</div>;
  }

  const status: ContractStatus | string = contract.status;
  const statusStr = String(status).toUpperCase();
  const isSigned = statusStr === 'SIGNED';
  const isCancelled = statusStr === 'CANCELLED';
  const isArchived = !!contract.archivedAt;
  const editable = !isSigned && !isArchived;

  const totals = contract.totals;
  const remainingPayments: ContractPayment[] = contract.payments;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-xs text-text-muted">
            <Link href="/admin/contratos" className="hover:underline">← Contratos</Link>
            <span className="mx-1">/</span>
            <span className="font-mono">#{contract.id}</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">
            Expediente del contrato #{contract.id}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {contract.clientName} · {contract.equipment}
          </p>
        </div>
        <span
          className={[
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-bold',
            statusBadgeClass(statusStr),
          ].join(' ')}
        >
          {statusLabel(statusStr)}
        </span>
      </header>

      {flash ? (
        <div
          className={[
            'rounded-xl px-3 py-2 text-sm border',
            flash.kind === 'success'
              ? 'bg-success/10 text-success border-success/30'
              : flash.kind === 'error'
                ? 'bg-danger/10 text-danger border-danger/30'
                : 'bg-info/10 text-info border-info/30',
          ].join(' ')}
        >
          {flash.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2 space-y-2">
          <h2 className="font-heading font-bold text-text-primary text-lg">Cliente</h2>
          <Row label="Nombre" value={contract.clientName} />
          <Row label="Email" value={contract.clientEmail} />
          {contract.clientPhone ? <Row label="Teléfono" value={contract.clientPhone} /> : null}
          <Row label="Dirección" value={contract.clientAddress} />
          {contract.clientCityStateZip ? (
            <Row label="Ciudad / Estado / Zip" value={contract.clientCityStateZip} />
          ) : null}
          {contract.driverLicense ? (
            <Row label="Licencia" value={contract.driverLicense} />
          ) : null}
          {contract.client ? (
            <div className="pt-2 mt-2 border-t border-border text-xs text-text-muted">
              Cliente registrado:{' '}
              <Link
                href={`/admin/clientes/${contract.client.id}`}
                className="text-primary hover:underline font-mono"
              >
                #{contract.client.id} — {contract.client.name}
              </Link>
            </div>
          ) : null}
        </div>

        <div className="card space-y-2">
          <h2 className="font-heading font-bold text-text-primary text-lg">Evento</h2>
          <Row label="Equipo" value={contract.equipment} />
          <Row
            label="Fecha"
            value={contract.eventDate ? new Date(contract.eventDate).toLocaleDateString() : '—'}
          />
          <Row label="Horario" value={`${contract.startTime ?? '—'} – ${contract.endTime ?? '—'}`} />
          {contract.groundType ? <Row label="Superficie" value={contract.groundType} /> : null}
          {contract.notes ? (
            <div className="pt-2 mt-2 border-t border-border">
              <div className="text-xs uppercase text-text-muted font-semibold">Notas</div>
              <div className="text-sm whitespace-pre-wrap">{contract.notes}</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="card space-y-2">
        <h2 className="font-heading font-bold text-text-primary text-lg">Totales</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="Precio" value={formatMoney(totals.price)} />
          <Stat label="Anticipo pactado" value={formatMoney(totals.deposit)} />
          <Stat label="Pagado" value={formatMoney(totals.totalPaid)} />
          <Stat label="Saldo" value={formatMoney(totals.balanceDue)} highlight />
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-heading font-bold text-text-primary text-lg">Acciones</h2>
        <div className="flex flex-wrap gap-2">
          {statusStr === 'PENDING' || statusStr === 'EXPIRED' ? (
            <>
              <button
                onClick={handleResendInvite}
                disabled={actionPending !== null}
                className="btn btn-primary text-sm"
              >
                {actionPending === 'resend-invite' ? 'Enviando…' : '📩 Reenviar invitación'}
              </button>
              <button
                onClick={() => {
                  setConfirmState({ kind: 'cancel', reason: '' });
                }}
                disabled={actionPending !== null}
                className="btn btn-secondary text-sm"
              >
                ✕ Cancelar contrato
              </button>
            </>
          ) : null}
          {isSigned ? (
            <button
              onClick={handleResendSigned}
              disabled={actionPending !== null}
              className="btn btn-primary text-sm"
            >
              {actionPending === 'resend-signed' ? 'Enviando…' : '📧 Reenviar copia firmada'}
            </button>
          ) : null}
          {!isArchived ? (
            <button
              onClick={() => setConfirmState({ kind: 'archive' })}
              disabled={actionPending !== null}
              className="btn btn-secondary text-sm"
            >
              🗄 Archivar
            </button>
          ) : null}
          <button
            onClick={() => setConfirmState({ kind: 'hardDelete', reason: '' })}
            disabled={actionPending !== null}
            className="btn bg-danger text-white hover:bg-danger/90 text-sm"
          >
            🗑 Eliminar definitivamente
          </button>
        </div>
        <p className="text-xs text-text-muted">
          La cancelación bloquea el contrato al cliente. Archivar lo oculta del flujo activo.
          Eliminar definitivamente borra todo (documentos, pagos, auditoría) y no se puede deshacer.
        </p>
      </div>

      <section className="card space-y-4">
        <h2 className="font-heading font-bold text-text-primary text-lg">Documentos</h2>
        {contract.documents.length === 0 ? (
          <p className="text-text-muted text-sm">No hay documentos asociados todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-elevated border-b border-border text-xs uppercase text-text-muted">
                <tr>
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3">Archivo</th>
                  <th className="py-2 px-3">Tamaño</th>
                  <th className="py-2 px-3">Subido</th>
                  <th className="py-2 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contract.documents.map((d) => (
                  <tr key={String(d.id)}>
                    <td className="py-2 px-3 font-semibold">{documentKindLabel(d.kind)}</td>
                    <td className="py-2 px-3 font-mono text-xs break-all">
                      {d.originalFilename}
                    </td>
                    <td className="py-2 px-3 text-text-muted">{formatBytes(d.sizeBytes)}</td>
                    <td className="py-2 px-3 text-text-muted">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleDownloadDocument(d)}
                        disabled={actionPending === `download-${d.id}`}
                        className="px-2.5 py-1 bg-surface-elevated border border-border rounded-lg text-xs font-medium hover:bg-surface transition"
                      >
                        ⬇ Descargar
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(d)}
                        disabled={actionPending === `delete-doc-${d.id}`}
                        className="px-2.5 py-1 bg-danger/10 text-danger border border-danger/30 rounded-lg text-xs font-medium hover:bg-danger/20 transition"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isCancelled && !isArchived ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <form onSubmit={handleUploadSignedPdf} className="space-y-2">
              <h3 className="font-semibold text-text-primary">Subir PDF firmado</h3>
              <p className="text-xs text-text-muted">Solo PDF. Cambia el estado a firmado.</p>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setSignedPdfFile(e.target.files?.[0] ?? null)}
                className="input w-full text-sm"
              />
              <button
                type="submit"
                disabled={!signedPdfFile || uploadingDoc !== null}
                className="btn btn-primary text-sm"
              >
                {uploadingDoc === 'signed' ? 'Subiendo…' : 'Subir PDF firmado'}
              </button>
            </form>

            <form onSubmit={handleUploadOther} className="space-y-2">
              <h3 className="font-semibold text-text-primary">Subir recibo u otro documento</h3>
              <p className="text-xs text-text-muted">PDF, PNG o JPEG.</p>
              <select
                value={otherKind}
                onChange={(e) =>
                  setOtherKind(e.target.value === 'OTHER' ? 'OTHER' : 'PAYMENT_RECEIPT')
                }
                className="input w-full text-sm"
              >
                <option value="PAYMENT_RECEIPT">Recibo de pago</option>
                <option value="OTHER">Otro</option>
              </select>
              {otherKind === 'PAYMENT_RECEIPT' ? (
                <select
                  value={receiptPaymentId}
                  onChange={(e) => setReceiptPaymentId(e.target.value)}
                  className="input w-full text-sm"
                >
                  <option value="">Selecciona el pago…</option>
                  {remainingPayments.map((p) => (
                    <option key={String(p.id)} value={String(p.id)}>
                      #{String(p.id).slice(-6)} · {paymentTypeLabel(p.type)} · {formatMoney(p.amount)}
                    </option>
                  ))}
                </select>
              ) : null}
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => setOtherPdfFile(e.target.files?.[0] ?? null)}
                className="input w-full text-sm"
              />
              <button
                type="submit"
                disabled={!otherPdfFile || uploadingDoc !== null}
                className="btn btn-primary text-sm"
              >
                {uploadingDoc === 'other' ? 'Subiendo…' : 'Subir documento'}
              </button>
            </form>
          </div>
        ) : null}
      </section>

      <section className="card space-y-4">
        <h2 className="font-heading font-bold text-text-primary text-lg">Pagos</h2>
        {contract.payments.length === 0 ? (
          <p className="text-text-muted text-sm">Aún no se han registrado pagos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-elevated border-b border-border text-xs uppercase text-text-muted">
                <tr>
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3">Monto</th>
                  <th className="py-2 px-3">Método</th>
                  <th className="py-2 px-3">Referencia</th>
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contract.payments.map((p) => (
                  <tr key={String(p.id)}>
                    <td className="py-2 px-3 font-semibold">{paymentTypeLabel(p.type)}</td>
                    <td className="py-2 px-3 font-mono">{formatMoney(Number(p.amount))}</td>
                    <td className="py-2 px-3 text-text-muted">{p.method}</td>
                    <td className="py-2 px-3 text-text-muted">{p.reference ?? '—'}</td>
                    <td className="py-2 px-3 text-text-muted">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleDeletePayment(p)}
                        disabled={actionPending === `delete-payment-${p.id}`}
                        className="px-2.5 py-1 bg-danger/10 text-danger border border-danger/30 rounded-lg text-xs font-medium hover:bg-danger/20 transition"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isArchived ? (
          <form onSubmit={handleAddPayment} className="pt-4 border-t border-border space-y-3">
            <h3 className="font-semibold text-text-primary">Registrar pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Tipo</label>
                <select
                  value={paymentForm.type}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      type: e.target.value as 'DEPOSIT' | 'PAYMENT' | 'REFUND',
                    }))
                  }
                  className="input w-full text-sm"
                >
                  <option value="DEPOSIT">Anticipo</option>
                  <option value="PAYMENT">Pago</option>
                  <option value="REFUND">Reembolso</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Método *</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}
                  className="input w-full text-sm"
                >
                  <option value="cash">Efectivo</option>
                  <option value="zelle">Zelle</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="check">Cheque</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Referencia</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))
                  }
                  className="input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Fecha de pago</label>
                <input
                  type="date"
                  value={paymentForm.paidAt}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, paidAt: e.target.value }))}
                  className="input w-full text-sm"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold mb-1">Notas</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="input w-full text-sm"
                />
              </div>
            </div>
            <button type="submit" disabled={addingPayment} className="btn btn-primary text-sm">
              {addingPayment ? 'Registrando…' : 'Registrar pago'}
            </button>
          </form>
        ) : null}
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-text-primary text-lg">Edición del contrato</h2>
          {!editable ? (
            <span className="text-xs text-text-muted">
              {isSigned
                ? 'Edición bloqueada: contrato firmado.'
                : isArchived
                  ? 'Edición bloqueada: contrato archivado.'
                  : 'Edición no disponible.'}
            </span>
          ) : null}
        </div>
        <form onSubmit={handleSaveEdit} className="space-y-3 text-sm">
          <fieldset disabled={!editable} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Nombre" value={editForm.clientName} onChange={(v) => setField('clientName', v)} required />
              <Input label="Email" type="email" value={editForm.clientEmail} onChange={(v) => setField('clientEmail', v)} required />
              <Input label="Teléfono" value={editForm.clientPhone} onChange={(v) => setField('clientPhone', v)} />
              <Input label="Licencia" value={editForm.driverLicense} onChange={(v) => setField('driverLicense', v)} />
              <Input
                className="md:col-span-2"
                label="Dirección"
                value={editForm.clientAddress}
                onChange={(v) => setField('clientAddress', v)}
                required
              />
              <Input
                label="Ciudad / Estado / Zip"
                value={editForm.clientCityStateZip}
                onChange={(v) => setField('clientCityStateZip', v)}
              />
              <Input label="Fecha evento" type="date" value={editForm.eventDate} onChange={(v) => setField('eventDate', v)} />
              <Select
                label="Hora inicio"
                value={editForm.startTime}
                onChange={(v) => setField('startTime', v)}
                options={TIME_OPTIONS}
              />
              <Select
                label="Hora fin"
                value={editForm.endTime}
                onChange={(v) => setField('endTime', v)}
                options={TIME_OPTIONS}
              />
              <Input
                className="md:col-span-2"
                label="Equipo"
                value={editForm.equipment}
                onChange={(v) => setField('equipment', v)}
                required
              />
              <Input label="Superficie" value={editForm.groundType} onChange={(v) => setField('groundType', v)} />
              <Input
                label="Precio"
                type="number"
                step="0.01"
                value={editForm.price}
                onChange={(v) => setField('price', v)}
              />
              <Input
                label="Anticipo"
                type="number"
                step="0.01"
                value={editForm.deposit}
                onChange={(v) => setField('deposit', v)}
              />
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">Notas</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
          </fieldset>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!editable || editingSaving}
              className="btn btn-primary text-sm"
            >
              {editingSaving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>

      <ConfirmModal
        open={confirmState?.kind === 'archive'}
        title="¿Archivar este contrato?"
        description="El contrato se ocultará del flujo activo pero se conserva con todos sus documentos y pagos."
        confirmLabel="Sí, archivar"
        variant="primary"
        onConfirm={performArchive}
        onCancel={() => setConfirmState(null)}
      />

      {confirmState?.kind === 'cancel' ? (
        <CancelDialog
          initial={confirmState.reason}
          onCancel={() => setConfirmState(null)}
          onConfirm={(reason) => performCancel(reason)}
          pending={actionPending === 'cancel'}
        />
      ) : null}

      {confirmState?.kind === 'hardDelete' ? (
        <HardDeleteDialog
          initial={confirmState.reason}
          onCancel={() => setConfirmState(null)}
          onConfirm={(reason) => performHardDelete(reason)}
          pending={actionPending === 'hardDelete'}
        />
      ) : null}

      {confirmState?.kind === 'deleteDocument' ? (
        <ReasonDialog
          title="Eliminar documento"
          description="Esta acción no se puede deshacer. Se registrará en la auditoría el motivo que indiques."
          confirmLabel="Eliminar"
          variant="danger"
          initial={confirmState.reason}
          pending={actionPending === `delete-doc-${confirmState.documentId}`}
          onCancel={() => setConfirmState(null)}
          onConfirm={(reason) => performDeleteDocument(reason)}
        />
      ) : null}

      {confirmState?.kind === 'deletePayment' ? (
        <ReasonDialog
          title="Eliminar pago"
          description="El pago se borrará y los totales se recalcularán. Indica un motivo para la auditoría."
          confirmLabel="Eliminar"
          variant="danger"
          initial={confirmState.reason}
          pending={actionPending === `delete-payment-${confirmState.paymentId}`}
          onCancel={() => setConfirmState(null)}
          onConfirm={(reason) => performDeletePayment(reason)}
        />
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-sm">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider sm:w-40 shrink-0">
        {label}
      </span>
      <span className="text-text-primary break-words">{value || '—'}</span>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={[
        'p-3 rounded-xl border text-center',
        highlight
          ? 'bg-primary/5 border-primary/30'
          : 'bg-surface-elevated border-border',
      ].join(' ')}
    >
      <div className="text-xs uppercase text-text-muted font-semibold">{label}</div>
      <div className="text-lg font-extrabold text-text-primary">{value}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required,
  className = '',
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
  step?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold mb-1">{label}</label>
      <input
        type={type}
        step={step}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-full text-sm"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input w-full text-sm">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function CancelDialog({
  initial,
  onCancel,
  onConfirm,
  pending,
}: {
  initial: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  pending: boolean;
}) {
  const [reason, setReason] = useState(initial);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-large max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-heading font-bold text-text-primary mb-2">
          ¿Cancelar este contrato?
        </h3>
        <p className="text-sm text-text-muted mb-4">
          Esta acción cambia el estado a CANCELLED y bloquea el enlace de firma. Proporciona un motivo.
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input w-full text-sm"
          placeholder="Motivo de cancelación"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="btn btn-ghost">
            Volver
          </button>
          <button
            onClick={() => onConfirm(reason.trim() || 'Sin motivo especificado')}
            disabled={pending}
            className="btn btn-primary"
          >
            {pending ? 'Cancelando…' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function HardDeleteDialog({
  initial,
  onCancel,
  onConfirm,
  pending,
}: {
  initial: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  pending: boolean;
}) {
  const [reason, setReason] = useState(initial);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-large max-w-md w-full p-6 border-2 border-danger/40"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-heading font-bold text-danger mb-2">
          Eliminar definitivamente
        </h3>
        <p className="text-sm text-text-muted mb-4">
          Esta acción borra el contrato, sus documentos y pagos. Quedará un registro de auditoría con el motivo.
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input w-full text-sm"
          placeholder="Motivo de eliminación (obligatorio)"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="btn btn-ghost">
            Volver
          </button>
          <button
            onClick={() => {
              const v = reason.trim();
              if (!v) return;
              onConfirm(v);
            }}
            disabled={pending || !reason.trim()}
            className="btn bg-danger text-white hover:bg-danger/90"
          >
            {pending ? 'Eliminando…' : 'Eliminar definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReasonDialog({
  title,
  description,
  confirmLabel,
  variant = 'primary',
  initial,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: 'primary' | 'danger';
  initial: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState(initial);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
    >
      <div
        className={[
          'bg-white rounded-2xl shadow-large max-w-md w-full p-6',
          variant === 'danger' ? 'border-2 border-danger/40' : '',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className={[
            'text-lg font-heading font-bold mb-2',
            variant === 'danger' ? 'text-danger' : 'text-text-primary',
          ].join(' ')}
        >
          {title}
        </h3>
        <p className="text-sm text-text-muted mb-4">{description}</p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input w-full text-sm"
          placeholder="Motivo (obligatorio)"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="btn btn-ghost">
            Cancelar
          </button>
          <button
            onClick={() => {
              const v = reason.trim();
              if (!v) return;
              onConfirm(v);
            }}
            disabled={pending || !reason.trim()}
            className={variant === 'danger' ? 'btn bg-danger text-white hover:bg-danger/90' : 'btn btn-primary'}
          >
            {pending ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, PUBLIC_API_URL } from '@/lib/api';
import type { Waiver } from '@/lib/types';
import Link from 'next/link';

export default function VerifyWaiverPage() {
  const params = useParams();
  const qr = (params?.qr as string)?.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [waiver, setWaiver] = useState<Waiver | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qr) return;

    async function checkWaiver() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<{ waiver: Waiver; isValid: boolean }>(`/api/v2/waiver/verify/${qr}`);
        setWaiver(res.waiver);
        setIsValid(res.isValid);
      } catch (err: any) {
        setError(err.message || 'No se encontró el waiver o el código QR es inválido.');
      } finally {
        setLoading(false);
      }
    }

    checkWaiver();
  }, [qr]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Verificando estado del waiver...</p>
        </div>
      </div>
    );
  }

  if (error || !waiver) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
            ❌
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Código QR No Encontrado</h1>
            <p className="text-sm text-slate-500 mt-2">{error || 'El código QR consultado no existe o no se pudo cargar.'}</p>
          </div>
          <Link
            href="/"
            className="inline-block w-full py-3 px-6 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex justify-center items-start sm:items-center">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Banner Superior Estado */}
        <div className={`p-6 text-center text-white ${isValid ? 'bg-gradient-to-br from-emerald-500 to-teal-700' : 'bg-gradient-to-br from-amber-500 to-orange-700'}`}>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto text-3xl mb-3 shadow-inner">
            {isValid ? '✅' : '⚠️'}
          </div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider rounded-full mb-2">
            {isValid ? 'Waiver Vigente y Valido' : 'Waiver Expirado / Inactivo'}
          </span>
          <h1 className="text-2xl font-black">{isValid ? '¡Acceso Autorizado!' : 'Waiver Fuera de Vigor'}</h1>
          <p className="text-xs opacity-90 mt-1 font-mono">Código QR: {waiver.qrCode}</p>
        </div>

        {/* Cuerpo Datos del Titular y Acompañantes */}
        <div className="p-6 space-y-6">
          {/* Titular */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos del Titular</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-lg">
                👤
              </div>
              <div>
                <p className="font-bold text-slate-900 text-base">{waiver.userName}</p>
                <p className="text-xs text-slate-500">{waiver.userEmail}</p>
                {waiver.userPhone && <p className="text-xs text-slate-400 mt-0.5">📞 {waiver.userPhone}</p>}
              </div>
            </div>
          </div>

          {/* Personas / Acompañantes Registrados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Personas Registradas ({waiver.relatives?.length || 0})
              </h3>
            </div>

            {waiver.relatives && waiver.relatives.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {waiver.relatives.map((rel: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white border border-slate-200/70 rounded-xl hover:border-primary/30 transition shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 text-sm">{rel.relativeName}</span>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                      {rel.relativeAge} {rel.relativeAge === 1 ? 'año' : 'años'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">Sin acompañantes registrados.</p>
            )}
          </div>

          {/* Fechas de Registro y Expiración */}
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 space-y-2">
            <div className="flex justify-between items-center">
              <span>Fecha de emisión:</span>
              <span className="font-semibold text-slate-700">
                {new Date(waiver.createdAt).toLocaleString('es-ES', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>

            {!isValid && waiver.expiresAt && (
              <div className="flex justify-between items-center text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                <span className="font-bold flex items-center gap-1">⏰ Expiró el:</span>
                <span className="font-extrabold font-mono">
                  {new Date(waiver.expiresAt).toLocaleString('es-ES', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Acciones: Descargar PDF y Renovar/Crear Nuevo Waiver */}
          <div className="pt-2 space-y-3">
            <a
              href={`${PUBLIC_API_URL}/api/v2/waiver/download/${waiver.qrCode}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
            >
              <span>📄</span> Descargar Documento PDF
            </a>

            {!isValid && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-center space-y-3">
                <div>
                  <p className="font-extrabold text-amber-900 text-sm">¿Necesitas renovar tu permiso de acceso?</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Este documento ha vencido. Genera un nuevo waiver en 1 minuto para entrar al evento sin demoras.
                  </p>
                </div>
                <Link
                  href="/checkout/waiver"
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  <span>📝</span> Generar Nuevo Waiver
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

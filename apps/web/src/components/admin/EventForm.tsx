'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, ApiError } from '@/lib/api';
import { compressImage } from '@/lib/image-compress';
import { getPartnerDisplay, type Event, type EventPartner } from '@/lib/types';

interface EventFormProps {
  initial?: Event;
  mode: 'create' | 'edit';
}

interface FormData {
  title: string;
  description: string;
  location: string;
  startDatetime: string;
  ticketPrice: string;
  partners: EventPartner;
  published: boolean;
  image: string;
}

const EMPTY: FormData = {
  title: '',
  description: '',
  location: '',
  startDatetime: '',
  ticketPrice: '0',
  partners: 'Kidsfun',
  published: false,
  image: '',
};

const DEFAULT_ORGANIZERS = ['Kidsfun', 'Tecun Productions', 'Otros'];

function normalizePartnerName(val: string): string {
  if (!val) return 'Kidsfun';
  if (val === 'partner1' || val.toLowerCase() === 'kidsfun') return 'Kidsfun';
  if (val === 'partner2' || val.toLowerCase() === 'tecun productions') return 'Tecun Productions';
  if (val === 'partner3' || val.toLowerCase() === 'otros') return 'Otros';
  return val;
}

function getEventImageUrl(imgPath: string): string {
  if (!imgPath) return '';
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
  if (imgPath.startsWith('/media/')) return imgPath;
  if (imgPath.startsWith('/')) return imgPath;
  return `/media/${imgPath}`;
}

export function EventForm({ initial, mode }: EventFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const tPh = useTranslations('placeholders');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const organizerDropdownRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<FormData>(EMPTY);
  const [organizersList, setOrganizersList] = useState<string[]>(DEFAULT_ORGANIZERS);
  const [isOrganizerDropdownOpen, setIsOrganizerDropdownOpen] = useState(false);
  const [showNewOrganizer, setShowNewOrganizer] = useState(false);
  const [newOrganizerName, setNewOrganizerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Click outside listener para cerrar el dropdown de organizadores
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        organizerDropdownRef.current &&
        !organizerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsOrganizerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function fetchOrganizers() {
      try {
        const orgs = await api.get<string[]>('/api/events/organizers');
        if (orgs && orgs.length > 0) {
          const normalized = orgs.map(normalizePartnerName);
          setOrganizersList((prev) => Array.from(new Set([...prev, ...normalized])));
        }
      } catch (e) {
        console.error('Error al cargar organizadores:', e);
      }
    }
    fetchOrganizers();
  }, []);

  useEffect(() => {
    if (initial) {
      const initialPartner = normalizePartnerName(initial.partners || 'Kidsfun');
      setData({
        title: initial.title,
        description: initial.description,
        location: initial.location,
        startDatetime: initial.startDatetime ? initial.startDatetime.slice(0, 16) : '',
        ticketPrice: initial.ticketPrice.toString(),
        partners: initialPartner,
        published: initial.published,
        image: initial.image ?? '',
      });

      setOrganizersList((prev) => {
        if (!prev.includes(initialPartner)) {
          return [...prev, initialPartner];
        }
        return prev;
      });
    }
  }, [initial]);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddNewOrganizer() {
    const trimmed = newOrganizerName.trim();
    if (!trimmed) return;

    if (!organizersList.includes(trimmed)) {
      setOrganizersList((prev) => [...prev, trimmed]);
    }
    update('partners', trimmed);
    setNewOrganizerName('');
    setShowNewOrganizer(false);
    setIsOrganizerDropdownOpen(false);
  }

  async function processAndUploadFile(file: File) {
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const compressed = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
      });

      const formData = new FormData();
      formData.append('file', compressed);
      if (data.title.trim()) {
        formData.append('title', data.title.trim());
      }

      const res = await api.post<{
        path: string;
        filename?: string;
        localPath?: string;
      }>('/api/upload/event-image', formData, {
        getToken,
        timeoutMs: 30_000,
      });

      if (res?.path || res?.filename || res?.localPath) {
        const uploadedPath = res.path || res.filename || res.localPath || '';
        update('image', uploadedPath);
      }
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Error al subir la imagen del evento.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processAndUploadFile(file);
    }
  }

  function handleRemoveImage() {
    update('image', '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const payload = {
      title: data.title,
      description: data.description,
      location: data.location,
      startDatetime: new Date(data.startDatetime).toISOString(),
      ticketPrice: Number(data.ticketPrice),
      partners: data.partners,
      published: data.published,
      image: data.image || undefined,
    };

    try {
      if (mode === 'create') {
        await api.post('/api/events', payload, { getToken });
      } else if (initial) {
        await api.patch(`/api/events/${initial.id}`, payload, { getToken });
      }
      router.push('/admin/eventos');
      router.refresh();
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : 'Error al guardar el evento');
    } finally {
      setSaving(false);
    }
  }

  const hasImage = Boolean(data.image && !data.image.includes('default_event'));
  const currentPartnerDisplay = getPartnerDisplay(data.partners);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
          ⚠ {errorMsg}
        </div>
      )}

      {/* SECCIÓN INFORMACIÓN DEL EVENTO */}
      <div className="card space-y-4">
        <h2 className="text-lg font-heading font-bold text-text-primary">Información del evento</h2>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Título <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="input"
            value={data.title}
            onChange={(e) => update('title', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Descripción <span className="text-danger">*</span>
          </label>
          <textarea
            rows={5}
            className="input resize-none"
            value={data.description}
            onChange={(e) => update('description', e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Ubicación <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="input"
              value={data.location}
              onChange={(e) => update('location', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Fecha y hora <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              className="input"
              value={data.startDatetime}
              onChange={(e) => update('startDatetime', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Precio entrada ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={data.ticketPrice}
              onChange={(e) => update('ticketPrice', e.target.value)}
            />
          </div>

          {/* ORGANIZADOR PERSONALIZADO Y OPTIMIZADO PARA MÓVIL */}
          <div className="relative" ref={organizerDropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-text-primary">
                Organizador
              </label>
              {!showNewOrganizer && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNewOrganizer(true);
                    setIsOrganizerDropdownOpen(false);
                  }}
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 py-0.5"
                >
                  <span>➕</span> Nuevo organizador
                </button>
              )}
            </div>

            {showNewOrganizer ? (
              <div className="p-3 bg-surface-elevated rounded-xl border-2 border-primary/40 space-y-2.5 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">
                    Agregar nuevo organizador
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewOrganizer(false);
                      setNewOrganizerName('');
                    }}
                    className="text-xs text-text-muted hover:text-danger"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    className="input text-sm flex-1"
                    placeholder="Ej. Fiesta Park, Magic Shows..."
                    value={newOrganizerName}
                    onChange={(e) => setNewOrganizerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewOrganizer();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={handleAddNewOrganizer}
                      disabled={!newOrganizerName.trim()}
                      className="btn btn-primary text-xs px-4 py-2 flex-1 sm:flex-initial"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewOrganizer(false);
                        setNewOrganizerName('');
                      }}
                      className="btn btn-ghost text-xs px-3 py-2"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Botón selector que emula input nativo con diseño uniforme */}
                <button
                  type="button"
                  onClick={() => setIsOrganizerDropdownOpen(!isOrganizerDropdownOpen)}
                  className="input w-full flex items-center justify-between text-left cursor-pointer bg-white dark:bg-surface py-2.5 px-3.5 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  <span className="flex items-center gap-2 text-text-primary text-sm font-medium truncate">
                    <span>{currentPartnerDisplay.emoji}</span>
                    <span>{currentPartnerDisplay.label}</span>
                  </span>
                  <span className={`text-xs text-text-muted transition-transform duration-200 ${isOrganizerDropdownOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {/* Dropdown Menu estilizado */}
                {isOrganizerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-surface border border-border rounded-xl shadow-large z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="max-h-60 overflow-y-auto divide-y divide-border/50">
                      {organizersList.map((orgKey) => {
                        const display = getPartnerDisplay(orgKey);
                        const isSelected = normalizePartnerName(data.partners) === normalizePartnerName(orgKey);
                        return (
                          <button
                            key={orgKey}
                            type="button"
                            onClick={() => {
                              update('partners', orgKey);
                              setIsOrganizerDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors ${
                              isSelected
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-text-primary hover:bg-surface-elevated active:bg-primary/5'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 truncate">
                              <span className="text-base">{display.emoji}</span>
                              <span className="truncate">{display.label}</span>
                            </span>
                            {isSelected && (
                              <span className="text-primary font-extrabold text-sm ml-2">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t border-border bg-surface-elevated/50">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewOrganizer(true);
                          setIsOrganizerDropdownOpen(false);
                        }}
                        className="w-full btn btn-ghost border border-dashed border-primary/40 text-primary hover:bg-primary/10 text-xs py-2 px-3 flex items-center justify-center gap-1.5 font-semibold rounded-lg"
                      >
                        <span>✨</span>
                        <span>+ Agregar nuevo organizador...</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN IMAGEN DEL EVENTO (CON EXPLORADOR DE ARCHIVOS Y PREVIEW) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-sm font-bold text-text-primary">
                Imagen del evento
              </label>
              <p className="text-xs text-text-muted">
                Selecciona una imagen desde tu dispositivo para promocionar el evento.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-xs text-primary hover:underline"
            >
              {showManualInput ? 'Ocultar entrada manual' : 'Ruta manual / URL'}
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            disabled={uploading}
            className="hidden"
          />

          {/* Image Preview or Upload Dropzone */}
          {hasImage ? (
            <div className="relative rounded-2xl border-2 border-border overflow-hidden bg-gray-50 shadow-xs">
              <div className="aspect-[16/9] max-h-72 w-full overflow-hidden relative bg-gradient-to-br from-brand-yellow/20 to-party-pink/20 flex items-center justify-center">
                <img
                  src={getEventImageUrl(data.image)}
                  alt="Vista previa del evento"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-xs">
                  🖼️ Imagen actual
                </span>
              </div>
              <div className="p-3 bg-surface flex flex-wrap items-center justify-between gap-2 border-t border-border">
                <p className="text-xs text-text-muted truncate max-w-xs sm:max-w-md" title={data.image}>
                  <span className="font-semibold text-text-primary">Archivo:</span> {data.image}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn btn-ghost text-xs py-1.5 px-3 border border-border hover:bg-surface-elevated"
                  >
                    {uploading ? '⏳ Subiendo…' : '🔄 Cambiar imagen'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    className="btn text-xs py-1.5 px-3 bg-danger/10 text-danger hover:bg-danger/20"
                  >
                    🗑️ Quitar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border hover:border-primary/60 hover:bg-surface-elevated bg-surface'
              }`}
            >
              <div className="text-5xl mb-3">{uploading ? '⏳' : '🖼️'}</div>
              <h3 className="text-sm font-bold text-text-primary mb-1">
                {uploading
                  ? 'Comprimiendo y subiendo imagen…'
                  : 'Haz clic para explorar en tu dispositivo o arrastra una imagen'}
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Formato recomendado: JPG, PNG o WebP (Resolución sugerida: 1200x675 o 16:9)
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={uploading}
                className="btn btn-primary text-xs px-4 py-2"
              >
                {uploading ? 'Subiendo imagen…' : '📁 Explorar archivos del dispositivo'}
              </button>
            </div>
          )}

          {/* Campo manual opcional */}
          {showManualInput && (
            <div className="mt-3 p-3 bg-surface-elevated rounded-xl border border-border space-y-1">
              <label className="block text-xs font-semibold text-text-muted">
                Ruta del archivo o URL
              </label>
              <input
                type="text"
                className="input text-sm"
                placeholder={tPh('eventImageFilename')}
                value={data.image}
                onChange={(e) => update('image', e.target.value)}
              />
              <p className="text-[11px] text-text-muted">
                Puedes escribir el nombre directo o una URL externa si no deseas subir desde el dispositivo.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
          <div>
            <p className="font-medium text-text-primary">Publicado</p>
            <p className="text-xs text-text-muted">Visible en el sitio público</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={data.published}
              onChange={(e) => update('published', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-checked:bg-success rounded-full transition relative">
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-ghost"
          disabled={saving || uploading}
        >
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary px-6" disabled={saving || uploading}>
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear evento' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

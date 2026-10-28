'use client';
import React from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  Rocket,
  Wrench,
  Clock,
  Layers,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { PLATFORM_UPDATES, ReleaseUpdate, UpdateItem } from '@/data/updatesData';

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdatesModal = ({ isOpen, onClose }: UpdatesModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop oscuro translúcido */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[80] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Central */}
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-3 sm:p-5 pointer-events-none">
        <div
          className="pointer-events-auto bg-card border border-line rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Cabecera del Modal */}
          <div className="p-4 sm:p-5 border-b border-line bg-bg2/70 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
                <Sparkles size={18} />
              </span>
              <div>
                <h3 className="font-display font-semibold text-[17px] text-text">
                  Novedades & Actualizaciones
                </h3>
                <p className="text-[12px] text-dim">
                  Historial de mejoras, nuevas funciones y notas de versión de FinDash
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-dim hover:text-text p-1.5 rounded-lg hover:bg-bg border border-transparent hover:border-line transition-colors"
              aria-label="Cerrar modal de actualizaciones"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cuerpo con Scroll Suave (Timeline de Versiones) */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {PLATFORM_UPDATES.map((release, rIdx) => (
              <div key={release.version} className="relative pl-6 sm:pl-8">
                {/* Línea vertical de la cronología */}
                {rIdx !== PLATFORM_UPDATES.length - 1 && (
                  <div className="absolute left-2.5 sm:left-3 top-7 bottom-0 w-px bg-line" />
                )}

                {/* Punto o nodo del timeline */}
                <div
                  className={`absolute left-1 sm:left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                    release.isLatest
                      ? 'border-gold bg-bg ring-4 ring-gold/20'
                      : 'border-line bg-card'
                  }`}
                />

                {/* Encabezado de la versión */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`font-mono font-semibold text-[13px] px-2 py-0.5 rounded-md ${
                      release.isLatest
                        ? 'bg-gold text-bg font-bold'
                        : 'bg-bg2 border border-line text-text'
                    }`}
                  >
                    {release.version}
                  </span>
                  {release.isLatest && (
                    <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-teal/15 text-teal border border-teal/30">
                      Última versión
                    </span>
                  )}
                  <span className="text-[11.5px] text-dim font-mono flex items-center gap-1">
                    <Clock size={11} />
                    {release.date}
                  </span>
                </div>

                <h4 className="text-[15px] font-semibold text-text mt-1">
                  {release.title}
                </h4>

                <p className="text-[12px] text-dim/90 italic mt-0.5 mb-3">
                  &ldquo;{release.highlight}&rdquo;
                </p>

                {/* Lista de cambios de esta versión */}
                <div className="space-y-2">
                  {release.items.map((item, iIdx) => {
                    const isNew = item.type === 'nuevo';
                    const isImprovement = item.type === 'mejora';
                    return (
                      <div
                        key={iIdx}
                        className="p-3 rounded-xl bg-bg2/80 border border-line hover:border-line/90 transition-all text-[12px]"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[9.5px] font-mono uppercase font-semibold px-2 py-0.5 rounded border ${
                              isNew
                                ? 'bg-teal/15 text-teal border-teal/30'
                                : isImprovement
                                ? 'bg-gold/15 text-gold border-gold/30'
                                : 'bg-blue-400/15 text-blue-400 border-blue-400/30'
                            }`}
                          >
                            {item.type}
                          </span>
                          <span className="font-semibold text-text text-[12.5px]">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-dim text-[12px] leading-relaxed pl-0.5">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pie del Modal */}
          <div className="p-3.5 sm:px-6 bg-bg2/80 border-t border-line text-[11.5px] text-dim flex items-center justify-between flex-shrink-0">
            <span className="flex items-center gap-1.5">
              <Rocket size={13} className="text-gold" />
              <span>FinDash evoluciona constantemente</span>
            </span>
            <span className="font-mono text-[10.5px]">v2.4 Live</span>
          </div>
        </div>
      </div>
    </>
  );
};

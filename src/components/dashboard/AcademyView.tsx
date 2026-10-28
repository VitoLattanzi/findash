'use client';
import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Lightbulb,
  Search,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Flame,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  ACADEMY_MODULES,
  RISK_TEST_QUESTIONS,
  PROFILE_RECOMMENDATIONS,
  AcademyModule,
  ProfileRecommendation,
} from '@/data/academyData';
import { UpdatesModal } from '@/components/common/UpdatesModal';

export const AcademyView = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);

  // Estado del Test de Perfil de Riesgo
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [testCompleted, setTestCompleted] = useState<boolean>(false);

  // Filtrado de módulos educativos
  const filteredModules = useMemo(() => {
    return ACADEMY_MODULES.filter((m) => {
      const matchesCategory =
        activeCategory === 'Todas' || m.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.analogy.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Lógica del Test de Riesgo
  const handleSelectOption = (points: number) => {
    const nextAnswers = [...selectedAnswers, points];
    setSelectedAnswers(nextAnswers);

    if (currentQuestionIdx + 1 < RISK_TEST_QUESTIONS.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      setTestCompleted(true);
    }
  };

  const resetTest = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswers([]);
    setTestCompleted(false);
  };

  // Cálculo del perfil según puntaje total
  const totalScore = selectedAnswers.reduce((acc, curr) => acc + curr, 0);
  const profileResult: ProfileRecommendation = useMemo(() => {
    if (totalScore <= 4) return PROFILE_RECOMMENDATIONS.conservador;
    if (totalScore <= 7) return PROFILE_RECOMMENDATIONS.moderado;
    return PROFILE_RECOMMENDATIONS.agresivo;
  }, [totalScore]);

  const categories = ['Todas', 'Básicos', 'Métricas & Balances', 'Mercado Argentino', 'Test de Perfil'];

  return (
    <main className="flex-1 p-3.5 sm:p-5 md:p-6 overflow-y-auto max-w-7xl mx-auto space-y-6">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30">
              <GraduationCap size={20} />
            </span>
            <h1 className="text-[22px] sm:text-[26px] font-display font-semibold text-text tracking-tight">
              FinDash Academy
            </h1>
          </div>
          <p className="text-[13px] text-dim max-w-2xl">
            Aprende a interpretar mercados, balances y métricas clave sin tecnicismos innecesarios.
            Conceptos en criollo con analogías de la vida real.
          </p>
        </div>

        {/* Buscador de conceptos y botón de novedades */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => setShowUpdatesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card hover:bg-bg2 border border-line hover:border-gold/50 text-[12px] font-medium text-dim hover:text-text transition-colors shadow-sm whitespace-nowrap"
            title="Ver últimas novedades y notas de versión de FinDash"
          >
            <Sparkles size={13} className="text-gold" />
            <span>Novedades v2.4</span>
          </button>

          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar concepto (ej: CEDEAR, PER)..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-card border border-line text-[13px] text-text placeholder-dim/60 focus:outline-none focus:border-gold transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim hover:text-text text-[11px]"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTROS POR CATEGORÍA */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-gold text-bg border-gold font-semibold shadow-sm'
                  : 'bg-card text-dim hover:text-text border-line hover:border-line/80'
              }`}
            >
              {cat === 'Test de Perfil' ? '🎯 Test de Perfil' : cat}
            </button>
          );
        })}
      </div>

      {/* SECCIÓN INTERACTIVA: TEST DE PERFIL DE RIESGO */}
      {(activeCategory === 'Todas' || activeCategory === 'Test de Perfil') && (
        <section className="bg-card border border-line rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal/15 text-teal border border-teal/30">
                <ShieldCheck size={18} />
              </span>
              <div>
                <h2 className="text-[17px] font-display font-semibold text-text">
                  Descubre tu Perfil de Inversor
                </h2>
                <p className="text-[12px] text-dim">
                  Responde 3 preguntas rápidas para orientar tu seguimiento analítico de instrumentos.
                </p>
              </div>
            </div>

            {testCompleted && (
              <button
                onClick={resetTest}
                className="inline-flex items-center gap-1 text-[11.5px] text-dim hover:text-gold px-2.5 py-1 rounded-md bg-bg border border-line transition-colors"
              >
                <RotateCcw size={12} />
                <span>Reiniciar</span>
              </button>
            )}
          </div>

          {/* Recordatorio de plataforma informativa */}
          <div className="mb-4 p-2.5 rounded-lg bg-bg2/90 border border-line text-[11.5px] text-dim flex items-center gap-2">
            <Info size={14} className="text-gold flex-shrink-0" />
            <span>
              <strong className="text-text font-medium">FinDash es 100% informativa:</strong> Es
              una herramienta analítica y de consulta; no es un broker, no custodia dinero ni
              permite comprar, vender o transferir fondos.
            </span>
          </div>

          {!testCompleted ? (
            /* PREGUNTAS SECUENCIALES */
            <div className="space-y-4">
              {/* Barra de progreso */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIdx + 1) / RISK_TEST_QUESTIONS.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono text-dim">
                  Pregunta {currentQuestionIdx + 1} de {RISK_TEST_QUESTIONS.length}
                </span>
              </div>

              {/* Pregunta actual */}
              <div className="bg-bg2/80 border border-line p-4 rounded-xl">
                <h3 className="text-[14.5px] font-medium text-text mb-3">
                  {RISK_TEST_QUESTIONS[currentQuestionIdx].question}
                </h3>

                <div className="space-y-2">
                  {RISK_TEST_QUESTIONS[currentQuestionIdx].options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(opt.points)}
                      className="w-full text-left p-3 rounded-lg bg-card hover:bg-card/90 border border-line hover:border-gold/60 text-[13px] text-dim hover:text-text transition-all flex items-center justify-between group"
                    >
                      <span>{opt.text}</span>
                      <ArrowRight
                        size={14}
                        className="text-dim/40 group-hover:text-gold group-hover:translate-x-1 transition-all flex-shrink-0 ml-2"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* TARJETA DE RESULTADO */
            <div className="bg-bg2/90 border border-line rounded-xl p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-dim block">
                    Tu Resultado (Puntaje: {totalScore}/9)
                  </span>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span
                      className={`text-[20px] font-display font-semibold ${profileResult.color}`}
                    >
                      {profileResult.name}
                    </span>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${profileResult.badgeBg}`}
                    >
                      {profileResult.type}
                    </span>
                  </div>
                </div>

                <div className="text-[12px] text-dim max-w-md">
                  {profileResult.description}
                </div>
              </div>

              {/* Instrumentos sugeridos en FinDash */}
              <div>
                <h4 className="text-[12px] font-semibold text-text uppercase tracking-wider font-mono mb-2.5 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-gold" />
                  <span>Instrumentos Recomendados para tu Perfil</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {profileResult.suggestedAssets.map((group, gIdx) => (
                    <div key={gIdx} className="p-3 rounded-lg bg-card border border-line">
                      <span className="text-[11.5px] font-semibold text-gold block mb-1">
                        {group.category}
                      </span>
                      <ul className="space-y-1">
                        {group.items.map((item, iIdx) => (
                          <li
                            key={iIdx}
                            className="text-[11.5px] text-dim flex items-start gap-1.5"
                          >
                            <span className="text-teal font-bold leading-none mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip operativo */}
              <div className="p-3 rounded-lg bg-bg border border-line/80 text-[12px] text-dim flex items-center gap-2">
                <Lightbulb size={16} className="text-gold flex-shrink-0" />
                <span>
                  <strong className="text-text">Consejo para FinDash:</strong> {profileResult.tips}
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* GRILLA DE TARJETAS EDUCATIVAS */}
      {activeCategory !== 'Test de Perfil' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-display font-semibold text-text flex items-center gap-2">
              <BookOpen size={18} className="text-gold" />
              <span>Conceptos Financieros en Criollo</span>
            </h2>
            <span className="text-[11.5px] font-mono text-dim">
              {filteredModules.length} guía{filteredModules.length !== 1 ? 's' : ''} disponible{filteredModules.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredModules.length === 0 ? (
            <div className="p-10 text-center text-dim bg-card border border-line rounded-2xl">
              <p className="text-[14px] text-text font-medium mb-1">
                No se encontraron conceptos para &quot;{searchQuery}&quot;
              </p>
              <p className="text-[12px]">Prueba con palabras como CEDEAR, PER, Bono o Acción.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModules.map((item) => {
                const isExpanded = !!expandedCards[item.id];
                return (
                  <article
                    key={item.id}
                    className="bg-card border border-line rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-between hover:border-gold/40 transition-all space-y-3"
                  >
                    <div>
                      {/* Categoría y tiempo de lectura */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-dim mb-2">
                        <span className="px-2 py-0.5 rounded bg-bg2 border border-line text-gold">
                          {item.category}
                        </span>
                        {item.readTime && (
                          <span className="flex items-center gap-1 text-dim/80">
                            <Clock size={11} /> {item.readTime}
                          </span>
                        )}
                      </div>

                      {/* Título y descripción breve */}
                      <h3 className="text-[17px] font-display font-semibold text-text mb-1">
                        {item.title}
                      </h3>
                      <p className="text-[12.5px] text-dim mb-3">{item.description}</p>

                      {/* BLOQUE DE ANALOGÍA DESTACADA (Fondo --bg y borde --teal) */}
                      <div className="bg-bg border-l-4 border-teal rounded-r-lg p-3 my-2.5 shadow-sm">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-teal font-semibold flex items-center gap-1 mb-1">
                          <Lightbulb size={11} />
                          Analogía de la vida real
                        </span>
                        <p className="text-[12px] text-text/90 italic leading-relaxed">
                          &ldquo;{item.analogy}&rdquo;
                        </p>
                      </div>

                      {/* Contenido Teórico Explicado Simple */}
                      <div className="mt-3 text-[12.5px] text-dim leading-relaxed space-y-2">
                        {item.content.split('\n\n').map((paragraph, pIdx) => {
                          // Renderizado básico de negritas en el texto
                          const formatted = paragraph.split('**').map((chunk, cIdx) =>
                            cIdx % 2 === 1 ? (
                              <strong key={cIdx} className="text-text font-medium">
                                {chunk}
                              </strong>
                            ) : (
                              chunk
                            )
                          );
                          return <p key={pIdx}>{formatted}</p>;
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-line/40 text-[11px] text-dim/70 font-mono flex items-center justify-between">
                      <span>FinDash Academy</span>
                      <span className="text-gold">✦ Carga 0ms local</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* AVISO LEGAL Y DESLINDE DE RESPONSABILIDAD */}
      <footer className="p-4 sm:p-5 rounded-2xl bg-bg2/80 border border-line text-[12px] text-dim space-y-2 mt-6">
        <div className="flex items-center gap-2 text-text font-semibold text-[13px]">
          <AlertTriangle size={15} className="text-gold flex-shrink-0" />
          <span>Aviso Legal, Reserva de Derechos y Exactitud de la Información</span>
        </div>
        <p className="leading-relaxed">
          La información, cotizaciones, balances, ratios y contenidos educativos provistos en{' '}
          <strong className="text-text font-medium">FinDash</strong> tienen fines puramente
          informativos e ilustrativos, y no representan asesoramiento financiero, recomendación de
          inversión ni oferta de compra o venta de ningún activo financiero.
        </p>
        <p className="leading-relaxed">
          Los datos de mercado son obtenidos de fuentes públicas y APIs de terceros sujetas a
          posibles demoras, fluctuaciones o inexactitudes técnicas.{' '}
          <strong className="text-text font-medium">
            FinDash no garantiza la exactitud, integridad o vigencia absoluta de la información
          </strong>{' '}
          y no asume responsabilidad alguna por decisiones comerciales o financieras tomadas en
          base a estos datos.
        </p>
        <div className="pt-2 border-t border-line/40 flex items-center justify-between text-[11px] font-mono text-dim/70 flex-wrap gap-2">
          <span>© {new Date().getFullYear()} FinDash — Todos los derechos reservados.</span>
          <span>El rendimiento pasado no garantiza resultados futuros.</span>
        </div>
      </footer>

      <UpdatesModal
        isOpen={showUpdatesModal}
        onClose={() => setShowUpdatesModal(false)}
      />
    </main>
  );
};

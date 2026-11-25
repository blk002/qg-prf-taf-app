import { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Circle,
  Dumbbell,
  Play,
  X,
} from 'lucide-react';
import heroTrackImg from '../assets/images/hero_taf_track_1795625269724.jpg';
import {
  ActionButton,
  EditorialRule,
  MediaBanner,
  MetadataLine,
  PerformanceArcGauge,
  SectionKicker,
  SegmentedControl,
} from '../components/UiKit';
import { analyzeNextPointGain, READINESS_OPTIONS } from '../domain/tafCoachEngine';
import type {
  PlannedDaySlot,
  ReadinessLevel,
  RunWorkout,
  TafAppState,
  WeeklySplitPreset,
  WorkoutTemplate,
} from '../domain/types';
import { WEEKLY_SPLIT_OPTIONS } from '../domain/weeklyPlannerEngine';

const TIME_SLOTS: [number, string][] = [
  [360, '06:00'],
  [390, '06:30'],
  [450, '07:30'],
  [720, '12:00'],
  [1050, '17:30'],
  [1110, '18:30'],
  [1170, '19:30'],
];

function badgeForSlot(slot: PlannedDaySlot): string {
  switch (slot.type) {
    case 'CORRIDA_Q1':
      return 'Q1';
    case 'CORRIDA_Q2':
      return 'Q2';
    case 'CORRIDA_Q3':
      return 'Q3';
    case 'FORCA_BARRA':
      return 'BR';
    case 'FORT_CORRIDA':
      return 'FR';
    case 'ESPECIFICO_TAF':
      return 'TF';
    default:
      return 'OFF';
  }
}

function formatStartMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function HojeScreen({
  state,
  isDoneToday,
  todayDayKey,
  todayReadiness,
  weeklyPlan,
  onToggleDoneToday,
  onSelectReadiness,
  onSelectSplitPreset,
  onSelectTrainingStartMin,
  onStartGuidedRun,
  onOpenRunWorkout,
  onStartStrengthWorkout,
  onNavigateToRun,
  onNavigateToTaf,
}: {
  state: TafAppState;
  isDoneToday: boolean;
  todayDayKey: string;
  todayReadiness: ReadinessLevel;
  weeklyPlan: PlannedDaySlot[];
  onToggleDoneToday: () => void;
  onSelectReadiness: (level: ReadinessLevel) => void;
  onSelectSplitPreset: (preset: WeeklySplitPreset) => void;
  onSelectTrainingStartMin: (startMin: number) => void;
  onStartGuidedRun: (workout: RunWorkout) => void;
  onOpenRunWorkout: (workout: RunWorkout) => void;
  onStartStrengthWorkout: (tpl: WorkoutTemplate) => void;
  onNavigateToRun: () => void;
  onNavigateToTaf: () => void;
}) {
  const [selectedDayKey, setSelectedDayKey] = useState(todayDayKey);
  const [showSplitModal, setShowSplitModal] = useState(false);

  const selectedSlot = weeklyPlan.find((s) => s.dayKey === selectedDayKey) ?? weeklyPlan[0];
  const totalRuns = Math.max(1, state.runWorkouts.length);
  const completedRuns = state.runWorkouts.filter(
    (r) => r.status === 'FEITO' || r.status === 'PARCIAL'
  ).length;
  const runProgress = completedRuns / totalRuns;

  const bestScore = state.tafHistory.reduce((max, s) => Math.max(max, s.totalPts), 0);
  const tafProgress = bestScore / 25;
  const tafArcColor =
    state.tafHistory.length === 0 ? '#8A93A5' : bestScore >= 12 ? '#22C55E' : '#EF4444';
  const gapInsight = analyzeNextPointGain(state.tafHistory);
  const currentSplitLabel =
    WEEKLY_SPLIT_OPTIONS.find((o) => o.key === state.weeklySplitPreset)?.label ?? 'Seg / Qua / Sex';
  const readinessInfo =
    READINESS_OPTIONS.find((r) => r.level === todayReadiness) ?? READINESS_OPTIONS[1];

  const linkedRun = selectedSlot?.linkedRunId
    ? state.runWorkouts.find((r) => r.id === selectedSlot.linkedRunId) ?? null
    : null;
  const linkedTemplate = selectedSlot?.linkedTemplateId
    ? state.strengthTemplates.find((t) => t.id === selectedSlot.linkedTemplateId) ?? null
    : null;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Title & Weekly Split Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <SectionKicker>Preparação física PRF</SectionKicker>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#F5F7FA] leading-none mt-1 text-balance">
            Treino de Hoje
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowSplitModal(true)}
          className="self-start sm:self-auto min-h-[44px] px-4 py-2 rounded-xl bg-[#12151B] border border-white/[0.08] hover:bg-[#1A1E26] text-xs font-semibold text-[#F5F7FA] inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
        >
          <CalendarClock className="w-4 h-4 text-[#F5B700]" />
          <span>{currentSplitLabel}</span>
          <span className="text-[#525B6B]" aria-hidden="true">
            ·
          </span>
          <span className="font-mono text-[#9CA3B2]">
            {formatStartMin(state.preferredTrainingStartMin)}
          </span>
        </button>
      </div>

      {/* Main 12-Col Responsive Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Primary Column (7 cols): Schedule + Featured Session Focal Anchor */}
        <div className="lg:col-span-7 space-y-6">
          {/* 7-Day Interactive Strip */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weeklyPlan.map((slot) => {
              const isSelected = slot.dayKey === selectedSlot?.dayKey;
              const isToday = slot.dayKey === todayDayKey;
              return (
                <button
                  key={slot.dayKey}
                  type="button"
                  onClick={() => setSelectedDayKey(slot.dayKey)}
                  className={`min-h-[68px] py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#F5B700] border-[#F5B700] text-[#090B0E]'
                      : 'bg-[#12151B] border-white/[0.08] text-[#9CA3B2] hover:bg-[#1A1E26] hover:text-[#F5F7FA]'
                  }`}
                >
                  <span
                    className={`text-[11px] font-semibold ${
                      isSelected ? 'text-[#090B0E]/80' : 'text-[#8A93A5]'
                    }`}
                  >
                    {slot.shortLabel}
                  </span>
                  <span className="font-mono text-xs font-bold tabular-nums">
                    {badgeForSlot(slot)}
                  </span>
                  <span
                    className={`text-[9px] font-bold leading-none ${
                      isToday
                        ? isSelected
                          ? 'text-[#090B0E]'
                          : 'text-[#F5B700]'
                        : 'text-transparent'
                    }`}
                  >
                    Hoje
                  </span>
                </button>
              );
            })}
          </div>

          {/* Focal Anchor: Featured Session Hero with Editorial Track Backdrop */}
          {selectedSlot && (
            <MediaBanner
              src={heroTrackImg}
              alt="Pista de atletismo ao amanhecer para treino do TAF PRF"
            >
              <div className="p-5 sm:p-7 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <MetadataLine
                    items={[
                      selectedSlot.shortLabel,
                      selectedSlot.estimatedMin > 0
                        ? `~${selectedSlot.estimatedMin} min`
                        : 'Descanso ativo',
                      linkedRun ? `VDOT ${state.vdot}` : null,
                    ]}
                    className="text-[#E2E8F0]"
                  />

                  <button
                    type="button"
                    onClick={onToggleDoneToday}
                    className={`min-h-[40px] px-3.5 rounded-xl border inline-flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isDoneToday
                        ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#86EFAC]'
                        : 'bg-[#090B0E]/70 border-white/[0.12] text-[#F5F7FA] hover:bg-[#1A1E26]'
                    }`}
                  >
                    {isDoneToday ? (
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#8A93A5]" />
                    )}
                    <span>{isDoneToday ? 'Concluído hoje' : 'Marcar check-in'}</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-w-2xl">
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F7FA] leading-tight text-balance">
                    {selectedSlot.title}
                  </h2>
                  <p className="text-sm sm:text-base text-[#D1D5DB] leading-relaxed">
                    {selectedSlot.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm text-[#9CA3B2] leading-relaxed pt-1">
                    {selectedSlot.coachReason}
                  </p>
                </div>

                {/* Primary Session Action */}
                <div className="pt-2">
                  {linkedRun ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <ActionButton
                        text="Iniciar com Voz"
                        icon={<Play className="w-4 h-4 fill-[#090B0E]" />}
                        onClick={() => onStartGuidedRun(linkedRun)}
                        className="sm:flex-1"
                      />
                      <ActionButton
                        text="Registrar manualmente"
                        variant="secondary"
                        onClick={() => onOpenRunWorkout(linkedRun)}
                        className="sm:w-auto sm:px-6"
                      />
                    </div>
                  ) : linkedTemplate ? (
                    <ActionButton
                      text="Iniciar Treino de Força"
                      icon={<Dumbbell className="w-4 h-4" />}
                      onClick={() => onStartStrengthWorkout(linkedTemplate)}
                    />
                  ) : (
                    <p className="text-sm font-medium text-[#9CA3B2] pt-1">
                      Dia reservado para recuperação ativa, mobilidade articular e soltura leve sem carga alta.
                    </p>
                  )}
                </div>
              </div>
            </MediaBanner>
          )}
        </div>

        {/* Right Secondary Column (5 cols): Telemetry Gauges + Readiness + Gap Radar */}
        <div className="lg:col-span-5 space-y-6">
          {/* Dual Performance Gauges */}
          <div className="rounded-2xl bg-[#12151B] border border-white/[0.08] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#F5F7FA]">Resumo de prontidão</h3>
              <span className="text-xs font-mono text-[#8A93A5] tabular-nums">
                Corte 12.0 pts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 justify-items-center">
              <PerformanceArcGauge
                progress={tafProgress}
                valueText={bestScore.toFixed(1)}
                unitText="de 25 pts"
                label="TAF PRF"
                arcColor={tafArcColor}
                size={146}
                onClick={onNavigateToTaf}
              />
              <PerformanceArcGauge
                progress={runProgress}
                valueText={`${Math.round(runProgress * 100)}%`}
                unitText={`${completedRuns}/${totalRuns} · V${state.vdot}`}
                label="Corrida"
                arcColor="#F5B700"
                size={146}
                onClick={onNavigateToRun}
              />
            </div>
          </div>

          {/* Energia de Hoje */}
          <div className="rounded-2xl bg-[#12151B] border border-white/[0.08] p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#F5F7FA]">Energia de hoje</h3>
              <p className="text-xs text-[#8A93A5]">
                Ajuste a intensidade conforme sua recuperação diária.
              </p>
            </div>

            <SegmentedControl
              options={READINESS_OPTIONS.map((r) => ({ key: r.level, label: r.label }))}
              selectedKey={todayReadiness}
              onSelect={(k) => onSelectReadiness(k as ReadinessLevel)}
            />

            <p className="text-xs sm:text-sm text-[#9CA3B2] leading-relaxed">
              {readinessInfo.shortTip}
            </p>

            {gapInsight && (
              <>
                <EditorialRule />
                <button
                  type="button"
                  onClick={onNavigateToTaf}
                  className="w-full text-left flex items-start justify-between gap-3 group cursor-pointer"
                >
                  <div className="space-y-1">
                    <MetadataLine
                      items={['Radar de pontos', gapInsight.testName]}
                      className="text-[#F5B700]"
                    />
                    <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
                      {gapInsight.actionTip}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8A93A5] group-hover:text-[#F5F7FA] shrink-0 mt-1 transition-colors" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Divisão Semanal + Horário Rotina de Vida */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#12151B] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-5 safe-bottom max-h-[88dvh] overflow-y-auto">
            <div className="sm:hidden w-10 h-1.5 rounded-full bg-white/15 mx-auto -mt-1 mb-2" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionKicker>Planejamento semanal</SectionKicker>
                <h3 className="font-display text-2xl font-bold text-[#F5F7FA] mt-0.5">
                  Dias de Corrida
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSplitModal(false)}
                aria-label="Fechar"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[#1A1E26] border border-white/[0.08] flex items-center justify-center text-[#9CA3B2] hover:text-[#F5F7FA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#9CA3B2] leading-relaxed">
              Os treinos de força e específicos do TAF são distribuídos automaticamente nos demais dias.
            </p>

            <div className="space-y-2">
              {WEEKLY_SPLIT_OPTIONS.map((opt) => {
                const selected = opt.key === state.weeklySplitPreset;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      onSelectSplitPreset(opt.key);
                      setShowSplitModal(false);
                    }}
                    className={`w-full min-h-[48px] px-4 py-3 rounded-xl flex items-center justify-between text-sm font-semibold border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#F5B700] border-[#F5B700] text-[#090B0E]'
                        : 'bg-[#1A1E26] border-white/[0.08] text-[#F5F7FA] hover:bg-[#232833]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>

            <EditorialRule />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#F5F7FA]">
                Horário na Rotina de Vida do QG
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(([min, label]) => {
                  const selected = state.preferredTrainingStartMin === min;
                  return (
                    <button
                      key={min}
                      type="button"
                      onClick={() => onSelectTrainingStartMin(min)}
                      className={`min-h-[44px] rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer tabular-nums ${
                        selected
                          ? 'bg-[#F5B700] border-[#F5B700] text-[#090B0E]'
                          : 'bg-[#1A1E26] border-white/[0.08] text-[#F5F7FA] hover:bg-[#232833]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#8A93A5] leading-relaxed">
                Os tempos planejados e concluídos sincronizam automaticamente com a aba Rotina de Vida no QG.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  Dumbbell,
  Play,
  X,
} from 'lucide-react';
import trackHeroImg from '../assets/images/prf_track_hero_1795657967063.jpg';
import {
  ActionButton,
  LinearProgressBar,
  MetadataLine,
  SegmentedControl,
} from '../components/UiKit';
import { parseRunWorkoutSteps } from '../domain/runStepParser';
import { analyzeNextPointGain, READINESS_OPTIONS } from '../domain/tafCoachEngine';
import type {
  PlannedDaySlot,
  ReadinessLevel,
  RunWorkout,
  TafAppState,
  WeeklySplitPreset,
  WorkoutTemplate,
} from '../domain/types';
import { pacesForVdot } from '../domain/vdotCalculator';
import { formatLocalIsoDate, WEEKLY_SPLIT_OPTIONS } from '../domain/weeklyPlannerEngine';

const TIME_SLOTS: [number, string][] = [
  [360, '06:00'],
  [390, '06:30'],
  [450, '07:30'],
  [720, '12:00'],
  [1050, '17:30'],
  [1110, '18:30'],
  [1170, '19:30'],
];

function slotTag(slot: PlannedDaySlot): string {
  switch (slot.type) {
    case 'CORRIDA_Q1':
      return 'Q1';
    case 'CORRIDA_Q2':
      return 'Q2';
    case 'CORRIDA_Q3':
      return 'Q3';
    case 'CORRIDA_REAGENDADA':
      return 'ADIADO';
    case 'FORCA_BARRA':
      return 'FORÇA';
    case 'FORT_CORRIDA':
      return 'BASE';
    case 'ESPECIFICO_TAF':
      return 'TAF';
    default:
      return 'OFF';
  }
}

function formatStartMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatStepDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (s === 0) return `${m} min`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatIsoShortBr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  return `${match[3]}/${match[2]}`;
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
  const todaySlot = weeklyPlan.find((s) => s.dayKey === todayDayKey) ?? weeklyPlan[0];

  const totalRuns = Math.max(1, state.runWorkouts.length);
  const completedRuns = state.runWorkouts.filter(
    (r) => r.status === 'FEITO' || r.status === 'PARCIAL'
  ).length;
  const runPct = Math.round((completedRuns / totalRuns) * 100);

  const bestScore = state.tafHistory.reduce((max, s) => Math.max(max, s.totalPts), 0);
  const paces = useMemo(() => pacesForVdot(state.vdot), [state.vdot]);
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

  const todayLinkedRun = todaySlot?.linkedRunId
    ? state.runWorkouts.find((r) => r.id === todaySlot.linkedRunId) ?? null
    : null;
  const todayLinkedTemplate = todaySlot?.linkedTemplateId
    ? state.strengthTemplates.find((t) => t.id === todaySlot.linkedTemplateId) ?? null
    : null;

  const todayIso = useMemo(() => formatLocalIsoDate(new Date()), []);
  const runCompletedToday = useMemo(
    () =>
      state.runWorkouts.find(
        (r) => (r.status === 'FEITO' || r.status === 'PARCIAL') && r.completedDate === todayIso
      ) ?? null,
    [state.runWorkouts, todayIso]
  );
  const editableTodayRun = todayLinkedRun ?? runCompletedToday;

  const todayRunDone = Boolean(
    todayLinkedRun &&
      (todayLinkedRun.status === 'FEITO' || todayLinkedRun.status === 'PARCIAL')
  );
  const isTodayMissionDone = todayLinkedRun ? todayRunDone : isDoneToday;
  const nextPendingRun = useMemo(
    () => state.runWorkouts.find((r) => r.status === 'PENDENTE') ?? null,
    [state.runWorkouts]
  );

  const parsedSteps = useMemo(
    () => (linkedRun ? parseRunWorkoutSteps(linkedRun, paces) : []),
    [linkedRun, paces]
  );

  const isSelectedRunDone = Boolean(
    linkedRun && (linkedRun.status === 'FEITO' || linkedRun.status === 'PARCIAL')
  );

  return (
    <div className="space-y-6">
      {/* Editorial Photographic Hero Stage: Today's Mission + Live Scoreboard */}
      <section className="relative rounded-[6px] overflow-hidden bg-[#0E0E12] border border-[#26262E] text-[#F5F4EF]">
        <img
          src={trackHeroImg}
          alt="Pista oficial de atletismo ao amanhecer"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-55"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C]/95 via-[#0A0A0C]/80 to-[#0A0A0C]/45"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/90 via-transparent to-[#0A0A0C]/30"
        />

        <div className="relative z-10 p-5 space-y-5">
          {/* Today's Primary Session Headline & Direct Action */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MetadataLine
                items={
                  isTodayMissionDone
                    ? [
                        'TREINO CONCLUÍDO',
                        todaySlot?.shortLabel ?? 'HOJE',
                        todayLinkedRun?.status === 'PARCIAL' ? 'PARCIAL' : 'OK',
                      ]
                    : [
                        'MISSÃO DE HOJE',
                        todaySlot?.shortLabel ?? 'HOJE',
                        todaySlot?.isRescheduled ? 'SEQUÊNCIA PRESERVADA' : slotTag(todaySlot),
                        todaySlot && todaySlot.estimatedMin > 0
                          ? `~${todaySlot.estimatedMin} MIN`
                          : 'RECUPERAÇÃO',
                      ]
                }
                tone={isTodayMissionDone ? 'light' : 'gold'}
                className={isTodayMissionDone ? '!text-[#22C55E]' : ''}
              />
              <button
                type="button"
                onClick={() => setShowSplitModal(true)}
                className="min-h-[34px] px-2.5 rounded-[4px] bg-black/50 hover:bg-black/75 border border-white/15 text-[11px] font-mono text-[#F5F4EF] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
              >
                <CalendarClock className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>{currentSplitLabel}</span>
                <span className="opacity-40">/</span>
                <span>{formatStartMin(state.preferredTrainingStartMin)}</span>
              </button>
            </div>

            {isTodayMissionDone ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3px] bg-[#15803D]/25 border border-[#22C55E]/50 text-[11px] font-mono font-bold uppercase tracking-[0.06em] text-[#86EFAC]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>
                    {todayLinkedRun?.status === 'PARCIAL'
                      ? 'Treino parcial registrado hoje'
                      : 'Missão de hoje cumprida'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h1 className="font-display text-4xl font-extrabold uppercase tracking-[0.01em] text-[#F5F4EF] leading-[0.95] text-balance">
                    {todaySlot?.title ?? 'Treino Concluído'}
                  </h1>
                  <p className="text-sm text-[#C4C4CC] leading-relaxed">
                    Treino já concluído e registrado. Recupere bem para a próxima sessão da sequência.
                  </p>
                </div>

                {nextPendingRun && nextPendingRun.id !== todayLinkedRun?.id && (
                  <button
                    type="button"
                    onClick={() => onOpenRunWorkout(nextPendingRun)}
                    className="w-full text-left rounded-[4px] bg-black/55 hover:bg-black/75 border border-white/15 p-3 space-y-1 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.08em] text-[#EAB308]">
                      <span>
                        Próxima na sequência · Sem {nextPendingRun.week} · {nextPendingRun.code}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs text-[#E4E4EC] line-clamp-1">
                      {nextPendingRun.prescription}
                    </p>
                  </button>
                )}

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onToggleDoneToday}
                    className="min-h-[44px] px-4 rounded-[4px] border bg-[#15803D]/25 border-[#22C55E]/60 text-[#86EFAC] text-xs font-mono font-bold uppercase tracking-[0.06em] inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                    <span>Concluído Hoje</span>
                  </button>

                  {editableTodayRun ? (
                    <button
                      type="button"
                      onClick={() => onOpenRunWorkout(editableTodayRun)}
                      className="min-h-[44px] px-4 rounded-[4px] bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-[#F5F4EF] inline-flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Editar registro</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onNavigateToRun}
                      className="min-h-[44px] px-4 rounded-[4px] bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-[#F5F4EF] inline-flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Ver plano</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <h1 className="font-display text-4xl font-extrabold uppercase tracking-[0.01em] text-[#F5F4EF] leading-[0.95] text-balance">
                    {todaySlot?.title ?? 'Central de Treino Semanal'}
                  </h1>
                  <p className="text-sm text-[#D4D4DC] leading-relaxed">
                    {todaySlot?.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {todayLinkedRun ? (
                    <>
                      <ActionButton
                        text="Iniciar Corrida Guiada"
                        icon={<Play className="w-4 h-4 fill-current" />}
                        onClick={() => onStartGuidedRun(todayLinkedRun)}
                      />
                      <button
                        type="button"
                        onClick={() => onOpenRunWorkout(todayLinkedRun)}
                        className="min-h-[44px] px-4 rounded-[4px] bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-[#F5F4EF] inline-flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span>Ver prescrição no plano</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : todayLinkedTemplate ? (
                    <ActionButton
                      text="Iniciar Treino de Força"
                      icon={<Dumbbell className="w-4 h-4" />}
                      onClick={() => onStartStrengthWorkout(todayLinkedTemplate)}
                    />
                  ) : (
                    <ActionButton
                      text="Abrir Plano de Corrida"
                      icon={<ArrowUpRight className="w-4 h-4" />}
                      onClick={onNavigateToRun}
                    />
                  )}

                  <button
                    type="button"
                    onClick={onToggleDoneToday}
                    className="min-h-[44px] px-4 rounded-[4px] border bg-black/45 hover:bg-black/70 border-white/20 text-[#F5F4EF] text-xs font-mono font-bold uppercase tracking-[0.06em] inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Circle className="w-4 h-4 text-[#A1A1AA]" />
                    <span>Marcar Dia Feito</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Monumental Scoreboard Telemetry Panel */}
          <div className="rounded-[4px] bg-[#0A0A0C]/85 backdrop-blur-md border border-white/15 p-4 space-y-3.5">
            <button
              type="button"
              onClick={onNavigateToTaf}
              className="w-full text-left group cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.08em] text-[#A1A1AA]">
                <span>Recorde TAF</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#EAB308] opacity-75 group-hover:opacity-100" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl sm:text-5xl font-extrabold text-[#F5F4EF] leading-none tabular-nums">
                  {bestScore.toFixed(1)}
                </span>
                <span className="font-mono text-xs text-[#8A8A96]">/ 25</span>
              </div>
              <LinearProgressBar
                value={bestScore}
                max={25}
                cutoff={12}
                barColor={bestScore >= 12 ? '#22C55E' : '#EAB308'}
                heightClass="h-1"
                onDarkSurface
              />
            </button>

            <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={onNavigateToRun}
                className="text-left cursor-pointer space-y-1"
              >
                <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#A1A1AA] block">
                  Limiar (T)
                </span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-[#EAB308] tabular-nums block">
                  {paces.thresholdKm}
                </span>
                <span className="text-[11px] font-mono text-[#8A8A96]">VDOT {state.vdot}</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToRun}
                className="text-left cursor-pointer space-y-1"
              >
                <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#A1A1AA] block">
                  Ciclo Corrida
                </span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-[#F5F4EF] tabular-nums block">
                  {runPct}%
                </span>
                <span className="text-[11px] font-mono text-[#8A8A96] tabular-nums">
                  {completedRuns}/{totalRuns} treinos
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal 7-Day Track-Lane Selector Strip (Breaks away from vertical SaaS sidebar lists) */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <MetadataLine items={['ROTEIRO DA SEMANA', 'SEQUÊNCIA Q1 → Q2 → Q3']} />
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.02em] text-[#111114] dark:text-[#F5F4EF] mt-0.5">
              Pista Semanal de Treinos
            </h2>
          </div>
          <span className="font-mono text-xs text-[#6B6B76] dark:text-[#8A8A96] hidden sm:inline">
            Selecione um dia para inspecionar os blocos
          </span>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-1 snap-x snap-mandatory">
          {weeklyPlan.map((slot) => {
            const isSelected = slot.dayKey === selectedSlot?.dayKey;
            const isToday = slot.dayKey === todayDayKey;
            const isDone = slot.runStatus === 'FEITO' || slot.runStatus === 'PARCIAL';
            return (
              <button
                key={slot.dayKey}
                type="button"
                onClick={() => setSelectedDayKey(slot.dayKey)}
                className={`relative snap-start shrink-0 w-[132px] text-left p-3 rounded-[4px] border transition-colors cursor-pointer flex flex-col justify-between min-h-[100px] ${
                  isSelected
                    ? 'bg-[#111114] dark:bg-[#1A1A20] text-[#F5F4EF] border-[#EAB308]'
                    : 'bg-white dark:bg-[#121216] border-[#D6D2C7] dark:border-[#26262E] hover:border-[#111114]/40 dark:hover:border-[#444452] text-[#111114] dark:text-[#F5F4EF]'
                }`}
              >
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 inset-x-0 h-[3px] bg-[#EAB308]"
                  />
                )}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-display text-xl font-extrabold uppercase leading-none ${
                      isSelected
                        ? 'text-[#EAB308]'
                        : isToday
                          ? 'text-[#CA8A04] dark:text-[#EAB308]'
                          : 'text-[#111114] dark:text-[#F5F4EF]'
                    }`}
                  >
                    {slot.shortLabel}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold tracking-[0.06em] ${
                      isDone
                        ? 'text-[#22C55E]'
                        : slot.type === 'CORRIDA_REAGENDADA'
                          ? 'text-[#EAB308]'
                          : isSelected
                            ? 'text-[#C4C4CC]'
                            : 'text-[#6B6B76] dark:text-[#8A8A96]'
                    }`}
                  >
                    {slotTag(slot)}
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold leading-snug line-clamp-2">{slot.title}</p>
                  <p
                    className={`font-mono text-[10px] tabular-nums truncate ${
                      isSelected ? 'text-[#A1A1AA]' : 'text-[#6B6B76] dark:text-[#8A8A96]'
                    }`}
                  >
                    {slot.type === 'CORRIDA_REAGENDADA'
                      ? slot.rescheduledTargetDayKey
                        ? `→ ${
                            weeklyPlan.find((s) => s.dayKey === slot.rescheduledTargetDayKey)
                              ?.shortLabel ?? 'próx.'
                          }`
                        : 'Reagendado'
                      : slot.estimatedMin > 0
                        ? `~${slot.estimatedMin}m`
                        : 'Descanso'}
                    {isToday ? ' · HOJE' : ''}
                    {slot.runStatus === 'FEITO' ? ' · OK' : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Mobile Stacked Dossier + Readiness & Priority Coach */}
      <div className="space-y-5">
        {/* Selected Day Dossier */}
        {selectedSlot && (
          <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-5 space-y-4">
            <div className="space-y-3 border-b border-[#E4E0D7] dark:border-[#26262E] pb-4">
              <div className="space-y-1.5">
                <MetadataLine
                  items={[
                    selectedSlot.shortLabel,
                    selectedSlot.type === 'CORRIDA_REAGENDADA'
                      ? 'TREINO REAGENDADO'
                      : selectedSlot.estimatedMin > 0
                        ? `~${selectedSlot.estimatedMin} MIN`
                        : 'RECUPERAÇÃO ATIVA',
                    selectedSlot.dayKey === todayDayKey ? 'SESSÃO DE HOJE' : null,
                    selectedSlot.isRescheduled ? 'SEQUÊNCIA PRESERVADA' : null,
                    selectedSlot.runStatus === 'FEITO'
                      ? 'CONCLUÍDO'
                      : selectedSlot.runStatus === 'PARCIAL'
                        ? 'PARCIAL'
                        : selectedSlot.runStatus === 'PULADO'
                          ? 'PULADO'
                          : null,
                  ]}
                />
                <h3 className="font-display text-3xl font-extrabold uppercase tracking-[0.01em] text-[#111114] dark:text-[#F5F4EF] leading-tight">
                  {selectedSlot.title}
                </h3>
                <p className="text-sm text-[#47474F] dark:text-[#C4C4CC] leading-relaxed">
                  {selectedSlot.subtitle}
                </p>
                <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] leading-relaxed">
                  {selectedSlot.coachReason}
                </p>
              </div>
            </div>

            {linkedRun && parsedSteps.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="uppercase tracking-[0.06em] font-semibold text-[#111114] dark:text-[#F5F4EF]">
                    Estrutura da sessão ({parsedSteps.length} blocos)
                  </span>
                  <span className="text-[#CA8A04] dark:text-[#EAB308]">VDOT {state.vdot}</span>
                </div>
                <div className="divide-y divide-[#E4E0D7] dark:divide-[#202028] max-h-60 overflow-y-auto pr-1">
                  {parsedSteps.slice(0, 8).map((step) => (
                    <div
                      key={step.index}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-[#8A8A96] mr-2">
                          {String(step.index + 1).padStart(2, '0')}
                        </span>
                        <span className="font-semibold text-[#111114] dark:text-[#F5F4EF]">
                          {step.title}
                        </span>
                        <span className="text-[#6B6B76] dark:text-[#8A8A96] ml-2">
                          {step.targetLabel}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-[#47474F] dark:text-[#C4C4CC] shrink-0 tabular-nums">
                        {formatStepDuration(step.durationSeconds)}
                      </span>
                    </div>
                  ))}
                  {parsedSteps.length > 8 && (
                    <p className="pt-2.5 text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96]">
                      + {parsedSteps.length - 8} blocos adicionais no modo guiado por voz.
                    </p>
                  )}
                </div>
              </div>
            )}

            {linkedTemplate && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="uppercase tracking-[0.06em] font-semibold text-[#111114] dark:text-[#F5F4EF]">
                    Exercícios planejados ({linkedTemplate.exercises.length})
                  </span>
                  <span className="text-[#6B6B76] dark:text-[#8A8A96]">
                    {linkedTemplate.targetTest}
                  </span>
                </div>
                <div className="divide-y divide-[#E4E0D7] dark:divide-[#202028]">
                  {linkedTemplate.exercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-medium text-[#111114] dark:text-[#F5F4EF] truncate">
                        <span className="font-mono text-[#8A8A96] mr-2">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        {ex.name}
                      </span>
                      <span className="font-mono text-[#47474F] dark:text-[#C4C4CC] shrink-0 tabular-nums">
                        {ex.sets}× {ex.targetRepsOrTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#E4E0D7] dark:border-[#26262E] flex flex-col gap-2.5">
              {linkedRun ? (
                isSelectedRunDone ? (
                  <div className="space-y-2.5">
                    <div className="rounded-[4px] bg-[#F0FDF4] dark:bg-[#22C55E]/10 border border-[#BBF7D0] dark:border-[#22C55E]/30 px-3.5 py-2.5 flex items-center gap-2 text-xs font-mono font-bold text-[#15803D] dark:text-[#86EFAC]">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D] dark:text-[#22C55E]" />
                      <span>
                        Treino registrado
                        {formatIsoShortBr(linkedRun.completedDate)
                          ? ` em ${formatIsoShortBr(linkedRun.completedDate)}`
                          : ''}{' '}
                        ({linkedRun.status === 'PARCIAL' ? 'Parcial' : 'Feito'})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <ActionButton
                        text="Editar registro"
                        variant="secondary"
                        onClick={() => onOpenRunWorkout(linkedRun)}
                        className="w-full"
                      />
                      <ActionButton
                        text="Refazer com Voz"
                        variant="secondary"
                        icon={<Play className="w-3.5 h-3.5 fill-current" />}
                        onClick={() => onStartGuidedRun(linkedRun)}
                        className="w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <ActionButton
                      text="Iniciar Corrida Guiada por Voz"
                      icon={<Play className="w-4 h-4 fill-current" />}
                      onClick={() => onStartGuidedRun(linkedRun)}
                      className="w-full"
                    />
                    <ActionButton
                      text="Abrir no plano"
                      variant="secondary"
                      onClick={() => onOpenRunWorkout(linkedRun)}
                      className="w-full"
                    />
                  </div>
                )
              ) : linkedTemplate ? (
                <ActionButton
                  text="Iniciar Treino de Força"
                  icon={<Dumbbell className="w-4 h-4" />}
                  onClick={() => onStartStrengthWorkout(linkedTemplate)}
                  className="w-full"
                />
              ) : selectedSlot.type === 'CORRIDA_REAGENDADA' &&
                selectedSlot.rescheduledTargetDayKey ? (
                <ActionButton
                  text={`Ver treino em ${
                    weeklyPlan.find((s) => s.dayKey === selectedSlot.rescheduledTargetDayKey)
                      ?.shortLabel ?? 'próximo dia'
                  }`}
                  variant="secondary"
                  onClick={() => setSelectedDayKey(selectedSlot.rescheduledTargetDayKey!)}
                  className="w-full"
                />
              ) : (
                <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96]">
                  Dia livre de carga alta. Foque em hidratação, sono e mobilidade articular leve.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Readiness Dial + Priority Gap Dossier */}
        <aside className="space-y-5">
          <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-5 space-y-4">
            <div className="space-y-1">
              <MetadataLine items={['PRONTIDÃO DIÁRIA']} />
              <h3 className="font-display text-2xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF]">
                Nível de Energia Hoje
              </h3>
              <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] leading-relaxed">
                {readinessInfo.shortTip}
              </p>
            </div>
            <SegmentedControl
              options={READINESS_OPTIONS.map((r) => ({ key: r.level, label: r.label }))}
              selectedKey={todayReadiness}
              onSelect={(k) => onSelectReadiness(k as ReadinessLevel)}
            />
          </section>

          {gapInsight && (
            <section className="rounded-[4px] bg-[#111114] dark:bg-[#16161C] border border-[#26262E] text-[#F5F4EF] p-6 space-y-3">
              <MetadataLine
                items={['PRIORIDADE DE PONTUAÇÃO', gapInsight.testName]}
                className="text-[#EAB308]"
              />
              <p className="text-sm text-[#D4D4DC] leading-relaxed">{gapInsight.actionTip}</p>
              <button
                type="button"
                onClick={onNavigateToTaf}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-[0.06em] text-[#EAB308] hover:underline pt-1 cursor-pointer"
              >
                <span>Abrir boletim TAF</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </section>
          )}
        </aside>
      </div>

      {/* Modal Divisão Semanal + Horário */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] rounded-t-[6px] sm:rounded-[6px] p-5 sm:p-6 space-y-5 safe-bottom max-h-[88dvh] overflow-y-auto shadow-2xl">
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#D6D2C7] dark:bg-[#2E2E38] mx-auto -mt-1 mb-1" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <MetadataLine items={['CONFIGURAÇÃO SEMANAL']} />
                <h3 className="font-display text-3xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-1">
                  Dias de Corrida e Horário
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSplitModal(false)}
                aria-label="Fechar"
                className="min-w-[44px] min-h-[44px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-[#F3F1EC] dark:bg-[#1A1A20] flex items-center justify-center text-[#6B6B76] dark:text-[#8A8A96] hover:text-[#111114] dark:hover:text-[#F5F4EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                    className={`w-full min-h-[46px] px-4 rounded-[4px] flex items-center justify-between text-sm font-semibold border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#EAB308] border-[#CA8A04] text-[#0A0A0C]'
                        : 'bg-[#F3F1EC] dark:bg-[#1A1A20] border-[#D6D2C7] dark:border-[#26262E] text-[#111114] dark:text-[#F5F4EF] hover:border-[#111114]/40 dark:hover:border-[#444452]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <CheckCircle2 className="w-4 h-4 text-[#0A0A0C]" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#E4E0D7] dark:border-[#26262E] space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-[0.06em] font-bold text-[#111114] dark:text-[#F5F4EF]">
                Horário preferencial de treino
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(([min, label]) => {
                  const selected = state.preferredTrainingStartMin === min;
                  return (
                    <button
                      key={min}
                      type="button"
                      onClick={() => onSelectTrainingStartMin(min)}
                      className={`min-h-[42px] rounded-[4px] text-xs font-mono font-bold border transition-colors cursor-pointer tabular-nums ${
                        selected
                          ? 'bg-[#111114] dark:bg-[#EAB308] border-[#111114] dark:border-[#EAB308] text-[#F5F4EF] dark:text-[#0A0A0C]'
                          : 'bg-[#F3F1EC] dark:bg-[#1A1A20] border-[#D6D2C7] dark:border-[#26262E] text-[#111114] dark:text-[#F5F4EF] hover:border-[#111114]/40'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

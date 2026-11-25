import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Cloud,
  Dumbbell,
  Loader2,
  Play,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import {
  EditorialRule,
  EditorialTabRow,
  MicroKicker,
  MonochromePillButton,
  StatusDotPill,
  WhoopArcGauge,
} from '../components/UiKit';
import type { SyncUiState } from '../data/useTafStore';
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
      return '—';
  }
}

export function HojeScreen({
  state,
  isLoggedIn,
  syncState,
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
  onOpenAccountModal,
}: {
  state: TafAppState;
  isLoggedIn: boolean;
  syncState: SyncUiState;
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
  onOpenAccountModal: () => void;
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
    state.tafHistory.length === 0 ? '#A4A4AE' : bestScore >= 12 ? '#00F19F' : '#FF4D57';
  const gapInsight = analyzeNextPointGain(state.tafHistory);
  const currentSplitLabel =
    WEEKLY_SPLIT_OPTIONS.find((o) => o.key === state.weeklySplitPreset)?.label ?? 'Seg / Qua / Sex';
  const readinessInfo =
    READINESS_OPTIONS.find((r) => r.level === todayReadiness) ?? READINESS_OPTIONS[1];

  return (
    <div className="px-5 pt-4 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <MicroKicker>QG DA PRF · TAF</MicroKicker>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">Hoje</h1>
        </div>
        <button
          type="button"
          onClick={onOpenAccountModal}
          aria-label="Conta e sincronização"
          className="w-10 h-10 rounded-full bg-[#101012] border border-[#232329] flex items-center justify-center cursor-pointer hover:border-[#3A3A44]"
        >
          {syncState.isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : isLoggedIn ? (
            <Cloud className="w-4 h-4 text-[#00F19F]" />
          ) : (
            <User className="w-4 h-4 text-[#A4A4AE]" />
          )}
        </button>
      </div>

      {/* Dual WHOOP Arc Gauges */}
      <div className="flex items-center justify-evenly py-1">
        <WhoopArcGauge
          progress={tafProgress}
          valueText={bestScore.toFixed(1)}
          unitText="de 25 pts"
          label="TAF PRF"
          arcColor={tafArcColor}
          size={142}
          onClick={onNavigateToTaf}
        />
        <WhoopArcGauge
          progress={runProgress}
          valueText={`${Math.round(runProgress * 100)}%`}
          unitText={`${completedRuns}/${totalRuns} · V${state.vdot}`}
          label="CORRIDA"
          arcColor="#FFFFFF"
          size={142}
          onClick={onNavigateToRun}
        />
      </div>

      <EditorialRule />

      {/* Agenda Semanal */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <MicroKicker>AGENDA DA SEMANA</MicroKicker>
          <button
            type="button"
            onClick={() => setShowSplitModal(true)}
            className="text-xs font-medium text-[#A4A4AE] hover:text-white px-2 py-0.5 rounded-lg cursor-pointer"
          >
            {currentSplitLabel} ▾
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeklyPlan.map((slot) => {
            const isSelected = slot.dayKey === selectedSlot?.dayKey;
            const isToday = slot.dayKey === todayDayKey;
            return (
              <button
                key={slot.dayKey}
                type="button"
                onClick={() => setSelectedDayKey(slot.dayKey)}
                className="flex flex-col items-center gap-1.5 py-1 rounded-2xl cursor-pointer"
              >
                <span
                  className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-[#6D6D76]'}`}
                >
                  {slot.shortLabel.slice(0, 1).toUpperCase()}
                </span>
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                    isSelected ? 'bg-white text-black' : 'text-[#A4A4AE]'
                  }`}
                >
                  {badgeForSlot(slot)}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isToday ? 'bg-[#00F19F]' : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel do dia selecionado */}
      {selectedSlot && (
        <div className="rounded-[22px] bg-[#101012] border border-[#232329] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <StatusDotPill
              text={
                selectedSlot.estimatedMin > 0
                  ? `${selectedSlot.shortLabel.toUpperCase()} · ~${selectedSlot.estimatedMin} MIN`
                  : `${selectedSlot.shortLabel.toUpperCase()} · OFF`
              }
              color={
                selectedSlot.linkedRunId
                  ? '#FFFFFF'
                  : selectedSlot.type === 'DESCANSO'
                    ? '#6D6D76'
                    : '#00F19F'
              }
            />
            <button
              type="button"
              onClick={onToggleDoneToday}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer"
            >
              {isDoneToday ? (
                <CheckCircle2 className="w-4 h-4 text-[#00F19F]" />
              ) : (
                <Circle className="w-4 h-4 text-[#6D6D76]" />
              )}
              <span
                className={`text-xs font-semibold ${isDoneToday ? 'text-[#00F19F]' : 'text-[#A4A4AE]'}`}
              >
                {isDoneToday ? 'Concluído' : 'Check-in'}
              </span>
            </button>
          </div>

          <h2 className="text-lg font-bold text-white leading-snug">{selectedSlot.title}</h2>
          <p className="text-sm text-[#A4A4AE] leading-relaxed">{selectedSlot.subtitle}</p>
          <p className="text-xs text-[#6D6D76] leading-relaxed">{selectedSlot.coachReason}</p>

          {selectedSlot.linkedRunId ? (
            (() => {
              const run = state.runWorkouts.find((r) => r.id === selectedSlot.linkedRunId);
              if (!run) return null;
              return (
                <div className="pt-1 space-y-1.5">
                  <MonochromePillButton
                    text="Iniciar com Voz"
                    icon={<Play className="w-4 h-4 fill-black" />}
                    onClick={() => onStartGuidedRun(run)}
                  />
                  <button
                    type="button"
                    onClick={() => onOpenRunWorkout(run)}
                    className="w-full py-1.5 text-xs font-semibold text-[#A4A4AE] hover:text-white cursor-pointer"
                  >
                    Registrar manualmente
                  </button>
                </div>
              );
            })()
          ) : selectedSlot.linkedTemplateId ? (
            (() => {
              const tpl = state.strengthTemplates.find(
                (t) => t.id === selectedSlot.linkedTemplateId
              );
              if (!tpl) return null;
              return (
                <div className="pt-1">
                  <MonochromePillButton
                    text="Iniciar Treino"
                    icon={<Dumbbell className="w-4 h-4" />}
                    onClick={() => onStartStrengthWorkout(tpl)}
                  />
                </div>
              );
            })()
          ) : (
            <div className="flex items-center gap-2 pt-1 text-[#6D6D76] text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Recuperação ativa sem carga alta.</span>
            </div>
          )}
        </div>
      )}

      <EditorialRule />

      {/* Energia & Radar */}
      <div className="space-y-3">
        <MicroKicker>ENERGIA DE HOJE</MicroKicker>
        <EditorialTabRow
          options={READINESS_OPTIONS.map((r) => ({ key: r.level, label: r.label }))}
          selectedKey={todayReadiness}
          onSelect={(k) => onSelectReadiness(k as ReadinessLevel)}
        />
        <p className="text-[13px] text-[#A4A4AE] leading-relaxed">{readinessInfo.shortTip}</p>

        {gapInsight && (
          <div className="flex items-center gap-2.5 pt-1">
            <StatusDotPill text={gapInsight.testName} color="#FFBE2E" />
            <p className="text-xs text-[#A4A4AE] flex-1 leading-snug">{gapInsight.actionTip}</p>
          </div>
        )}
      </div>

      {/* Modal Divisão Semanal + Horário Rotina de Vida */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#101012] border border-[#232329] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 safe-bottom max-h-[88dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Dias de Corrida</h3>
              <button
                type="button"
                onClick={() => setShowSplitModal(false)}
                className="w-8 h-8 rounded-full bg-[#1C1C21] flex items-center justify-center text-[#A4A4AE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#6D6D76]">
              Os treinos de força e específicos são encaixados automaticamente nos demais dias.
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
                    className={`w-full px-4 py-3.5 rounded-2xl flex items-center justify-between text-sm font-bold cursor-pointer ${
                      selected ? 'bg-white text-black' : 'bg-[#1C1C21] text-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 space-y-2.5 border-t border-[#232329]">
              <h4 className="text-sm font-bold text-white">Horário na Rotina de Vida do QG</h4>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(([min, label]) => {
                  const selected = state.preferredTrainingStartMin === min;
                  return (
                    <button
                      key={min}
                      type="button"
                      onClick={() => onSelectTrainingStartMin(min)}
                      className={`py-2.5 rounded-xl text-xs font-bold font-mono cursor-pointer ${
                        selected ? 'bg-white text-black' : 'bg-[#1C1C21] text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#6D6D76] leading-relaxed">
                Os tempos planejados e concluídos sincronizam automaticamente com a aba Rotina de Vida no QG.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

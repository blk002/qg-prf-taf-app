import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Play, Search, SlidersHorizontal, X } from 'lucide-react';
import { ActionButton, MetadataLine, SegmentedControl } from '../components/UiKit';
import { estimateRunDurationMinutes } from '../domain/jackDanielsPlan';
import { parseRunWorkoutSteps } from '../domain/runStepParser';
import type { RunStatus, RunWorkout, TafAppState } from '../domain/types';
import { pacesForVdot } from '../domain/vdotCalculator';
import { formatLocalIsoDate } from '../domain/weeklyPlannerEngine';

const PHASE_OPTIONS = [
  { key: 'II', label: 'Fase II' },
  { key: 'III', label: 'Fase III' },
  { key: 'IV', label: 'Fase IV' },
];

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Todos' },
  { key: 'PENDENTE', label: 'Pendentes' },
  { key: 'DONE', label: 'Concluídos' },
];

const STATUS_OPTIONS: { status: RunStatus; label: string; colorClass: string }[] = [
  { status: 'PENDENTE', label: 'Pendente', colorClass: 'text-[#6B6B76] dark:text-[#8A8A96]' },
  { status: 'FEITO', label: 'Feito', colorClass: 'text-[#15803D] dark:text-[#22C55E]' },
  { status: 'PARCIAL', label: 'Parcial', colorClass: 'text-[#CA8A04] dark:text-[#EAB308]' },
  { status: 'PULADO', label: 'Pulado', colorClass: 'text-[#DC2626] dark:text-[#EF4444]' },
];

function formatDurationSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, '0')}`;
}

function formatIsoShortBr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  return `${match[3]}/${match[2]}`;
}

export function CorridaScreen({
  state,
  selectedWorkoutForEdit,
  onSelectWorkout,
  onStartGuidedRun,
  onSaveWorkout,
  onUpdateVdot,
  onCalculateVdotFromTest,
}: {
  state: TafAppState;
  selectedWorkoutForEdit: RunWorkout | null;
  onSelectWorkout: (w: RunWorkout | null) => void;
  onStartGuidedRun: (w: RunWorkout) => void;
  onSaveWorkout: (
    id: string,
    status: RunStatus,
    notes: string,
    durationMin?: number,
    completedDate?: string
  ) => void;
  onUpdateVdot: (vdot: number) => void;
  onCalculateVdotFromTest: (distanceMeters: number, timeSeconds: number) => number;
}) {
  const [phase, setPhase] = useState('II');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVdotModal, setShowVdotModal] = useState(false);
  const [testDist, setTestDist] = useState('3050');
  const [testMin, setTestMin] = useState('16');
  const [testSec, setTestSec] = useState('22');

  const [inspectedId, setInspectedId] = useState<string | null>(
    selectedWorkoutForEdit?.id ?? null
  );
  const [sheetOpen, setSheetOpen] = useState(Boolean(selectedWorkoutForEdit));

  const todayIso = useMemo(() => formatLocalIsoDate(new Date()), []);
  const yesterdayIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatLocalIsoDate(d);
  }, []);

  const [editStatus, setEditStatus] = useState<RunStatus>('FEITO');
  const [editDate, setEditDate] = useState(todayIso);
  const [editDuration, setEditDuration] = useState('45');
  const [editNotes, setEditNotes] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const paces = useMemo(() => pacesForVdot(state.vdot), [state.vdot]);

  useEffect(() => {
    if (selectedWorkoutForEdit) {
      setPhase(selectedWorkoutForEdit.phase);
      setInspectedId(selectedWorkoutForEdit.id);
      setSheetOpen(true);
    }
  }, [selectedWorkoutForEdit]);

  const filteredRuns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.runWorkouts.filter((r) => {
      if (r.phase !== phase) return false;
      if (statusFilter === 'PENDENTE' && r.status !== 'PENDENTE') return false;
      if (statusFilter === 'DONE' && r.status !== 'FEITO' && r.status !== 'PARCIAL') return false;
      if (q) {
        const hay = `sem ${r.week} semana ${r.week} ${r.code} ${r.prescription} ${r.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [state.runWorkouts, phase, statusFilter, searchQuery]);

  const activeRun = useMemo(() => {
    if (!inspectedId) return null;
    return state.runWorkouts.find((r) => r.id === inspectedId) ?? null;
  }, [state.runWorkouts, inspectedId]);

  useEffect(() => {
    if (activeRun) {
      setEditStatus(activeRun.status === 'PENDENTE' ? 'FEITO' : activeRun.status);
      setEditDate(activeRun.completedDate || todayIso);
      setEditDuration(
        String(activeRun.durationMin ?? estimateRunDurationMinutes(activeRun.prescription))
      );
      setEditNotes(activeRun.notes === '---' ? '' : activeRun.notes);
      setSavedFeedback(false);
    }
  }, [
    activeRun?.id,
    activeRun?.status,
    activeRun?.completedDate,
    activeRun?.durationMin,
    activeRun?.notes,
    todayIso,
  ]);

  const activeSteps = useMemo(
    () => (activeRun ? parseRunWorkoutSteps(activeRun, paces) : []),
    [activeRun, paces]
  );

  const closeSheet = () => {
    setSheetOpen(false);
    onSelectWorkout(null);
  };

  const handleSaveCurrent = () => {
    if (!activeRun) return;
    const isCompletedStatus = editStatus === 'FEITO' || editStatus === 'PARCIAL';
    onSaveWorkout(
      activeRun.id,
      editStatus,
      editNotes,
      Number(editDuration) || undefined,
      isCompletedStatus ? editDate || todayIso : undefined
    );
    setSavedFeedback(true);
    window.setTimeout(() => {
      setSavedFeedback(false);
      closeSheet();
    }, 320);
  };

  return (
    <div className="space-y-5">
      {/* Precision Track-Pace Matrix Header (Mobile-First) */}
      <section className="rounded-[4px] bg-[#111114] dark:bg-[#121216] border border-[#26262E] text-[#F5F4EF] overflow-hidden">
        <div className="p-4 space-y-3.5 border-b border-white/10">
          <div>
            <MetadataLine
              items={['JACK DANIELS', 'SEMANAS 7–24', 'TABELA 5.2']}
              tone="gold"
            />
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-[0.02em] text-[#F5F4EF] mt-1 leading-none">
              Matriz de Ritmos
            </h1>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center rounded-[4px] border border-white/15 bg-[#0A0A0C] overflow-hidden">
              <button
                type="button"
                onClick={() => onUpdateVdot(state.vdot - 1)}
                aria-label="Diminuir VDOT"
                className="w-10 h-10 font-mono text-base font-bold text-[#F5F4EF] hover:bg-white/10 cursor-pointer"
              >
                −
              </button>
              <span className="px-3 font-mono text-xs font-bold text-[#EAB308] tabular-nums">
                VDOT {state.vdot}
              </span>
              <button
                type="button"
                onClick={() => onUpdateVdot(state.vdot + 1)}
                aria-label="Aumentar VDOT"
                className="w-10 h-10 font-mono text-base font-bold text-[#F5F4EF] hover:bg-white/10 cursor-pointer"
              >
                +
              </button>
            </div>

            <ActionButton
              text="Por teste"
              icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              onClick={() => setShowVdotModal(true)}
              className="px-3.5"
            />
          </div>
        </div>

        {/* Mobile Pace Strip (Limiar Highlight + 2x2 Zones) */}
        <div className="grid grid-cols-2 divide-y divide-x divide-white/10">
          <div className="col-span-2 px-4 py-3 flex items-center justify-between bg-[#0A0A0C]/60">
            <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#A1A1AA]">
              Limiar (T / km)
            </span>
            <span className="font-mono text-lg font-bold text-[#EAB308] tabular-nums">
              {paces.thresholdKm}
            </span>
          </div>
          {[
            { label: 'Leve (E)', value: paces.easyRange },
            { label: 'Moderado (M)', value: paces.moderateRange },
            { label: 'Intervalo 800m', value: paces.interval800 },
            { label: 'Tiro 400m (R)', value: paces.rep400 },
          ].map((zone) => (
            <div key={zone.label} className="px-4 py-3 space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#8A8A96] block">
                {zone.label}
              </span>
              <span className="font-mono text-sm font-bold text-[#F5F4EF] tabular-nums block">
                {zone.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Filter & Search Stack */}
      <div className="space-y-2.5">
        <SegmentedControl options={PHASE_OPTIONS} selectedKey={phase} onSelect={setPhase} />
        <SegmentedControl
          options={STATUS_FILTERS}
          selectedKey={statusFilter}
          onSelect={setStatusFilter}
        />
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#8A8A96] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar semana, Q1, 400m..."
            className="w-full h-10 rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] pl-9 pr-3 text-xs text-[#111114] dark:text-[#F5F4EF] placeholder:text-[#8A8A96] outline-none focus:border-[#EAB308]"
          />
        </div>
      </div>

      {/* Mobile Run Schedule List */}
      <div className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#EAE7DF] dark:bg-[#1A1A20] border-b border-[#D6D2C7] dark:border-[#26262E] flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.08em] font-semibold text-[#6B6B76] dark:text-[#8A8A96]">
          <span>Toque no treino para registrar</span>
          <span className="tabular-nums">{filteredRuns.length} sessões</span>
        </div>

        {filteredRuns.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B6B76] dark:text-[#8A8A96]">
            Nenhum treino encontrado para este filtro.
          </div>
        ) : (
          <div className="divide-y divide-[#E4E0D7] dark:divide-[#202028]">
            {filteredRuns.map((run) => {
              const statusMeta =
                STATUS_OPTIONS.find((s) => s.status === run.status) ?? STATUS_OPTIONS[0];
              const est = run.durationMin ?? estimateRunDurationMinutes(run.prescription);
              const selected = activeRun?.id === run.id && sheetOpen;
              return (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => {
                    setInspectedId(run.id);
                    setSheetOpen(true);
                  }}
                  className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#111114] dark:bg-[#1E1E26] text-[#F5F4EF]'
                      : 'active:bg-[#F3F1EC] dark:active:bg-[#1A1A20] text-[#111114] dark:text-[#F5F4EF]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span
                          className={`font-semibold tabular-nums ${
                            selected ? 'text-[#A1A1AA]' : 'text-[#6B6B76] dark:text-[#8A8A96]'
                          }`}
                        >
                          Sem {run.week}
                        </span>
                        <span className="opacity-35">/</span>
                        <span
                          className={`font-bold ${
                            selected ? 'text-[#EAB308]' : 'text-[#CA8A04] dark:text-[#EAB308]'
                          }`}
                        >
                          {run.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[11px] font-bold uppercase ${statusMeta.colorClass}`}
                        >
                          {statusMeta.label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-45" />
                      </div>
                    </div>
                    <p className="text-[13px] font-medium leading-snug line-clamp-2">
                      {run.prescription}
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span
                        className={`tabular-nums ${
                          selected ? 'text-[#A1A1AA]' : 'text-[#6B6B76] dark:text-[#8A8A96]'
                        }`}
                      >
                        ~{est} min
                        {formatIsoShortBr(run.completedDate)
                          ? ` · ${formatIsoShortBr(run.completedDate)}`
                          : ''}
                      </span>
                      {run.notes && run.notes !== '---' && (
                        <span
                          className={`truncate max-w-[68%] ${
                            selected ? 'text-[#A1A1AA]' : 'text-[#6B6B76] dark:text-[#8A8A96]'
                          }`}
                        >
                          {run.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Viewport-Fixed Mobile Bottom Sheet Inspector (Always Anchored, Sticky Save Bar) */}
      {sheetOpen && activeRun && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheet();
          }}
        >
          <div className="animate-sheet-up w-full max-w-[460px] max-h-[86dvh] flex flex-col bg-white dark:bg-[#121216] border-t sm:border-x border-[#D6D2C7] dark:border-[#26262E] rounded-t-[10px] shadow-2xl overflow-hidden">
            {/* Sticky Sheet Header */}
            <div className="shrink-0 px-5 pt-3 pb-3.5 border-b border-[#E4E0D7] dark:border-[#26262E] space-y-2.5">
              <div className="w-10 h-1 rounded-full bg-[#D6D2C7] dark:bg-[#2E2E38] mx-auto" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <MetadataLine
                    items={[
                      `FASE ${activeRun.phase}`,
                      `SEM ${activeRun.week}`,
                      activeRun.code,
                      `~${activeRun.durationMin ?? estimateRunDurationMinutes(activeRun.prescription)} MIN`,
                    ]}
                  />
                  <h2 className="font-display text-2xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] leading-tight">
                    {activeRun.prescription}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeSheet}
                  aria-label="Fechar detalhes"
                  className="min-w-[40px] min-h-[40px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-[#F3F1EC] dark:bg-[#1A1A20] flex items-center justify-center text-[#6B6B76] dark:text-[#8A8A96] shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body: Registration First (Immediate Access), Blocks Below */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Quick Registration Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-mono uppercase tracking-[0.08em] font-bold text-[#111114] dark:text-[#F5F4EF]">
                    Registro rápido
                  </h3>
                  {savedFeedback && (
                    <span className="text-xs font-mono font-bold text-[#15803D] dark:text-[#22C55E]">
                      SALVO
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {STATUS_OPTIONS.map((opt) => {
                    const active = editStatus === opt.status;
                    return (
                      <button
                        key={opt.status}
                        type="button"
                        onClick={() => setEditStatus(opt.status)}
                        className={`min-h-[42px] rounded-[4px] text-xs font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#111114] dark:bg-[#EAB308] text-[#F5F4EF] dark:text-[#0A0A0C] border-[#111114] dark:border-[#EAB308]'
                            : 'bg-[#F3F1EC] dark:bg-[#1A1A20] text-[#47474F] dark:text-[#C4C4CC] border-[#D6D2C7] dark:border-[#26262E]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {(editStatus === 'FEITO' || editStatus === 'PARCIAL') && (
                  <div>
                    <label
                      htmlFor="run-edit-date"
                      className="text-[10px] font-mono uppercase tracking-[0.06em] font-semibold text-[#6B6B76] dark:text-[#8A8A96] block mb-1"
                    >
                      Data do treino
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        id="run-edit-date"
                        type="date"
                        value={editDate}
                        max={todayIso}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="flex-1 min-w-0 h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                      />
                      <button
                        type="button"
                        onClick={() => setEditDate(yesterdayIso)}
                        className={`h-11 px-3 rounded-[4px] text-xs font-mono font-bold uppercase border transition-colors shrink-0 cursor-pointer ${
                          editDate === yesterdayIso
                            ? 'bg-[#111114] dark:bg-[#EAB308] text-[#F5F4EF] dark:text-[#0A0A0C] border-[#111114] dark:border-[#EAB308]'
                            : 'bg-[#F3F1EC] dark:bg-[#1A1A20] text-[#47474F] dark:text-[#C4C4CC] border-[#D6D2C7] dark:border-[#26262E]'
                        }`}
                      >
                        Ontem
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditDate(todayIso)}
                        className={`h-11 px-3 rounded-[4px] text-xs font-mono font-bold uppercase border transition-colors shrink-0 cursor-pointer ${
                          editDate === todayIso
                            ? 'bg-[#111114] dark:bg-[#EAB308] text-[#F5F4EF] dark:text-[#0A0A0C] border-[#111114] dark:border-[#EAB308]'
                            : 'bg-[#F3F1EC] dark:bg-[#1A1A20] text-[#47474F] dark:text-[#C4C4CC] border-[#D6D2C7] dark:border-[#26262E]'
                        }`}
                      >
                        Hoje
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-[0.06em] font-semibold text-[#6B6B76] dark:text-[#8A8A96] block mb-1">
                      Minutos
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.06em] font-semibold text-[#6B6B76] dark:text-[#8A8A96] block mb-1">
                      Observações
                    </label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Ritmo cravado, sensação..."
                      className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm text-[#111114] dark:text-[#F5F4EF] placeholder:text-[#8A8A96] outline-none focus:border-[#EAB308]"
                    />
                  </div>
                </div>
              </div>

              {/* Parsed Interval Blocks */}
              <div className="border-t border-[#E4E0D7] dark:border-[#26262E] pt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="uppercase tracking-[0.06em] font-semibold text-[#111114] dark:text-[#F5F4EF]">
                    Blocos e ritmos ({activeSteps.length})
                  </span>
                  <span className="text-[#CA8A04] dark:text-[#EAB308]">VDOT {state.vdot}</span>
                </div>
                <div className="divide-y divide-[#E4E0D7] dark:divide-[#202028]">
                  {activeSteps.map((step) => (
                    <div
                      key={step.index}
                      className="py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#111114] dark:text-[#F5F4EF] truncate">
                          {step.title}
                        </p>
                        <p className="text-[11px] font-mono text-[#6B6B76] dark:text-[#8A8A96] truncate">
                          {step.targetLabel}
                        </p>
                      </div>
                      <span className="font-mono font-semibold text-[#47474F] dark:text-[#C4C4CC] shrink-0 tabular-nums">
                        {formatDurationSec(step.durationSeconds)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Action Bar (Save + Voice Coach Always Visible Without Scrolling) */}
            <div className="shrink-0 px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-[#E4E0D7] dark:border-[#26262E] bg-[#F3F1EC] dark:bg-[#0E0E12] grid grid-cols-2 gap-2.5">
              <ActionButton
                text="Com Voz"
                variant="secondary"
                icon={<Play className="w-3.5 h-3.5 fill-current" />}
                onClick={() => {
                  closeSheet();
                  onStartGuidedRun(activeRun);
                }}
                className="w-full"
              />
              <ActionButton
                text={savedFeedback ? 'Salvo!' : 'Salvar Registro'}
                variant="primary"
                icon={<Check className="w-4 h-4" />}
                onClick={handleSaveCurrent}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Calcular VDOT por Teste */}
      {showVdotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVdotModal(false);
          }}
        >
          <div className="animate-sheet-up w-full max-w-[460px] bg-white dark:bg-[#121216] border-t sm:border-x border-[#D6D2C7] dark:border-[#26262E] rounded-t-[10px] p-5 space-y-5 safe-bottom shadow-2xl">
            <div className="w-10 h-1 rounded-full bg-[#D6D2C7] dark:bg-[#2E2E38] mx-auto -mt-1" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <MetadataLine items={['TABELA 5.2 JACK DANIELS']} />
                <h3 className="font-display text-3xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-1">
                  Calcular VDOT por Teste
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVdotModal(false)}
                aria-label="Fechar"
                className="min-w-[44px] min-h-[44px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-[#F3F1EC] dark:bg-[#1A1A20] flex items-center justify-center text-[#6B6B76] dark:text-[#8A8A96] hover:text-[#111114] dark:hover:text-[#F5F4EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                  Distância (m)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={testDist}
                  onChange={(e) => setTestDist(e.target.value)}
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                  Minutos
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={testMin}
                  onChange={(e) => setTestMin(e.target.value)}
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                  Segundos
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={testSec}
                  onChange={(e) => setTestSec(e.target.value)}
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
            </div>

            <ActionButton
              text="Calcular e Aplicar VDOT"
              onClick={() => {
                const d = Number(testDist) || 3050;
                const s = (Number(testMin) || 16) * 60 + (Number(testSec) || 0);
                onCalculateVdotFromTest(d, s);
                setShowVdotModal(false);
              }}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

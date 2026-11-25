import { useEffect, useState } from 'react';
import { Check, Edit3, Play, SlidersHorizontal, X } from 'lucide-react';
import heroTrackImg from '../assets/images/hero_taf_track_1795625269724.jpg';
import {
  ActionButton,
  EditorialRule,
  MediaBanner,
  MetadataLine,
  SectionKicker,
  SegmentedControl,
} from '../components/UiKit';
import { estimateRunDurationMinutes } from '../domain/jackDanielsPlan';
import type { RunStatus, RunWorkout, TafAppState } from '../domain/types';
import { pacesForVdot } from '../domain/vdotCalculator';

const PHASE_OPTIONS = [
  { key: 'II', label: 'Fase II' },
  { key: 'III', label: 'Fase III' },
  { key: 'IV', label: 'Fase IV' },
];

const STATUS_OPTIONS: { status: RunStatus; label: string; textColor: string }[] = [
  { status: 'PENDENTE', label: 'Pendente', textColor: 'text-[#8A93A5]' },
  { status: 'FEITO', label: 'Feito', textColor: 'text-[#22C55E]' },
  { status: 'PARCIAL', label: 'Parcial', textColor: 'text-[#F5B700]' },
  { status: 'PULADO', label: 'Pulado', textColor: 'text-[#EF4444]' },
];

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
  onSaveWorkout: (id: string, status: RunStatus, notes: string, durationMin?: number) => void;
  onUpdateVdot: (vdot: number) => void;
  onCalculateVdotFromTest: (distanceMeters: number, timeSeconds: number) => number;
}) {
  const [phase, setPhase] = useState('II');
  const [showVdotModal, setShowVdotModal] = useState(false);
  const [testDist, setTestDist] = useState('3050');
  const [testMin, setTestMin] = useState('16');
  const [testSec, setTestSec] = useState('22');

  const [editStatus, setEditStatus] = useState<RunStatus>('FEITO');
  const [editDuration, setEditDuration] = useState('45');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (selectedWorkoutForEdit) {
      setEditStatus(
        selectedWorkoutForEdit.status === 'PENDENTE' ? 'FEITO' : selectedWorkoutForEdit.status
      );
      setEditDuration(
        String(
          selectedWorkoutForEdit.durationMin ??
            estimateRunDurationMinutes(selectedWorkoutForEdit.prescription)
        )
      );
      setEditNotes(selectedWorkoutForEdit.notes === '---' ? '' : selectedWorkoutForEdit.notes);
    }
  }, [selectedWorkoutForEdit]);

  const paces = pacesForVdot(state.vdot);
  const filteredRuns = state.runWorkouts.filter((r) => r.phase === phase);
  const completedInPhase = filteredRuns.filter(
    (r) => r.status === 'FEITO' || r.status === 'PARCIAL'
  ).length;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Hero Banner with VDOT Pace Strip */}
      <MediaBanner
        src={heroTrackImg}
        alt="Pista oficial de corrida para ciclos Jack Daniels"
      >
        <div className="p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <MetadataLine
                items={['Método Jack Daniels', 'Semanas 7 a 24', `VDOT ${state.vdot}`]}
                className="text-[#D1D5DB]"
              />
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#F5F7FA] leading-none mt-2 text-balance">
                Plano de Corrida
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setShowVdotModal(true)}
              className="self-start sm:self-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F5B700] hover:bg-[#FFCA2C] text-[#090B0E] font-bold text-xs inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="font-mono">Ajustar VDOT {state.vdot}</span>
            </button>
          </div>

          <EditorialRule className="bg-white/[0.12]" />

          {/* Full-Width 4-Column Pace Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <span className="text-xs font-medium text-[#9CA3B2] block">Ritmo Leve (E)</span>
              <span className="font-mono text-base sm:text-lg font-bold text-[#F5F7FA] mt-1 block tabular-nums">
                {paces.easyRange}
              </span>
            </div>
            <div>
              <span className="text-xs font-medium text-[#9CA3B2] block">Limiar (T)</span>
              <span className="font-mono text-base sm:text-lg font-bold text-[#F5B700] mt-1 block tabular-nums">
                {paces.thresholdKm}
              </span>
            </div>
            <div>
              <span className="text-xs font-medium text-[#9CA3B2] block">Tiro 400m (R)</span>
              <span className="font-mono text-base sm:text-lg font-bold text-[#F5F7FA] mt-1 block tabular-nums">
                {paces.rep400}
              </span>
            </div>
            <div>
              <span className="text-xs font-medium text-[#9CA3B2] block">Intervalo 800m (I)</span>
              <span className="font-mono text-base sm:text-lg font-bold text-[#F5F7FA] mt-1 block tabular-nums">
                {paces.interval800}
              </span>
            </div>
          </div>
        </div>
      </MediaBanner>

      {/* Phase Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:max-w-sm">
          <SegmentedControl options={PHASE_OPTIONS} selectedKey={phase} onSelect={setPhase} />
        </div>
        <p className="text-xs font-mono text-[#8A93A5] tabular-nums">
          {completedInPhase} de {filteredRuns.length} treinos concluídos na Fase {phase}
        </p>
      </div>

      {/* 2-Column Responsive Run Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        {filteredRuns.map((run) => {
          const statusMeta =
            STATUS_OPTIONS.find((s) => s.status === run.status) ?? STATUS_OPTIONS[0];
          const est = run.durationMin ?? estimateRunDurationMinutes(run.prescription);
          return (
            <div
              key={run.id}
              className="rounded-2xl bg-[#12151B] border border-white/[0.08] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <MetadataLine
                    items={[`Semana ${run.week}`, run.code, `~${est} min`]}
                  />
                  <span className={`text-xs font-semibold whitespace-nowrap ${statusMeta.textColor}`}>
                    {statusMeta.label}
                  </span>
                </div>

                <p className="text-sm sm:text-[15px] text-[#F5F7FA] leading-relaxed font-medium">
                  {run.prescription}
                </p>

                {run.notes && run.notes !== '---' && (
                  <p className="text-xs text-[#8A93A5] leading-relaxed">{run.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => onStartGuidedRun(run)}
                  className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#F5B700] hover:bg-[#FFCA2C] text-[#090B0E] text-xs font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-[#090B0E]" />
                  <span>Iniciar com Voz</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectWorkout(run)}
                  className="min-h-[44px] px-4 rounded-xl bg-[#1A1E26] border border-white/[0.08] hover:bg-[#232833] text-xs font-semibold text-[#F5F7FA] inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#9CA3B2]" />
                  <span>Registrar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal VDOT */}
      {showVdotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#12151B] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-5 safe-bottom">
            <div className="sm:hidden w-10 h-1.5 rounded-full bg-white/15 mx-auto -mt-1 mb-2" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionKicker>Tabela 5.2 Jack Daniels</SectionKicker>
                <h3 className="font-display text-2xl font-bold text-[#F5F7FA] mt-0.5">
                  Calculadora VDOT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVdotModal(false)}
                aria-label="Fechar"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[#1A1E26] border border-white/[0.08] flex items-center justify-center text-[#9CA3B2] hover:text-[#F5F7FA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#090B0E] border border-white/[0.08] rounded-xl p-4">
              <span className="text-sm font-semibold text-[#9CA3B2]">VDOT Atual</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateVdot(state.vdot - 1)}
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-[#1A1E26] border border-white/[0.08] text-lg font-bold text-[#F5F7FA] hover:bg-[#232833] cursor-pointer"
                >
                  −
                </button>
                <span className="font-display text-3xl font-bold text-[#F5B700] w-10 text-center tabular-nums">
                  {state.vdot}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateVdot(state.vdot + 1)}
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-[#1A1E26] border border-white/[0.08] text-lg font-bold text-[#F5F7FA] hover:bg-[#232833] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <SectionKicker>Calcular por teste recente</SectionKicker>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs text-[#9CA3B2] block mb-1.5">Distância (m)</label>
                  <input
                    type="number"
                    value={testDist}
                    onChange={(e) => setTestDist(e.target.value)}
                    className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3 text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9CA3B2] block mb-1.5">Minutos</label>
                  <input
                    type="number"
                    value={testMin}
                    onChange={(e) => setTestMin(e.target.value)}
                    className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3 text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9CA3B2] block mb-1.5">Segundos</label>
                  <input
                    type="number"
                    value={testSec}
                    onChange={(e) => setTestSec(e.target.value)}
                    className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3 text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
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
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Treino */}
      {selectedWorkoutForEdit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#12151B] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-5 safe-bottom max-h-[90dvh] overflow-y-auto">
            <div className="sm:hidden w-10 h-1.5 rounded-full bg-white/15 mx-auto -mt-1 mb-2" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <MetadataLine
                  items={[`Semana ${selectedWorkoutForEdit.week}`, selectedWorkoutForEdit.code]}
                />
                <h3 className="font-display text-2xl font-bold text-[#F5F7FA] mt-0.5">
                  Registrar Corrida
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectWorkout(null)}
                aria-label="Fechar"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[#1A1E26] border border-white/[0.08] flex items-center justify-center text-[#9CA3B2] hover:text-[#F5F7FA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#9CA3B2] leading-relaxed">
              {selectedWorkoutForEdit.prescription}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const active = editStatus === opt.status;
                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => setEditStatus(opt.status)}
                    className={`min-h-[44px] rounded-xl text-xs font-bold cursor-pointer border transition-colors ${
                      active
                        ? 'bg-[#F5B700] text-[#090B0E] border-[#F5B700]'
                        : 'bg-[#1A1E26] text-[#F5F7FA] border-white/[0.08] hover:bg-[#232833]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9CA3B2] block">
                Duração real (minutos)
              </label>
              <input
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="w-full h-12 rounded-xl bg-[#090B0E] border border-white/[0.1] px-4 text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9CA3B2] block">Observações</label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Ex.: ritmos cravados, sensação leve..."
                className="w-full h-12 rounded-xl bg-[#090B0E] border border-white/[0.1] px-4 text-sm text-[#F5F7FA] placeholder:text-[#525B6B] outline-none focus:border-[#F5B700]"
              />
            </div>

            <ActionButton
              text="Salvar na Rotina e Sincronizar"
              icon={<Check className="w-4 h-4" />}
              onClick={() => {
                onSaveWorkout(
                  selectedWorkoutForEdit.id,
                  editStatus,
                  editNotes,
                  Number(editDuration) || undefined
                );
                onSelectWorkout(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

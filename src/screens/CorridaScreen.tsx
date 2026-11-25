import { useEffect, useState } from 'react';
import { Check, Edit3, Play, SlidersHorizontal, X } from 'lucide-react';
import {
  EditorialRule,
  EditorialTabRow,
  MicroKicker,
  MonochromePillButton,
  StatusDotPill,
} from '../components/UiKit';
import { estimateRunDurationMinutes } from '../domain/jackDanielsPlan';
import type { RunStatus, RunWorkout, TafAppState } from '../domain/types';
import { pacesForVdot } from '../domain/vdotCalculator';

const PHASE_OPTIONS = [
  { key: 'II', label: 'Fase II' },
  { key: 'III', label: 'Fase III' },
  { key: 'IV', label: 'Fase IV' },
];

const STATUS_OPTIONS: { status: RunStatus; label: string; color: string }[] = [
  { status: 'PENDENTE', label: 'Pendente', color: '#A4A4AE' },
  { status: 'FEITO', label: 'Feito', color: '#00F19F' },
  { status: 'PARCIAL', label: 'Parcial', color: '#FFBE2E' },
  { status: 'PULADO', label: 'Pulado', color: '#FF4D57' },
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

  return (
    <div className="px-5 pt-4 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <MicroKicker>JACK DANIELS · SEMANAS 7–24</MicroKicker>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">Corrida</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowVdotModal(true)}
          className="px-3.5 py-2 rounded-full bg-[#101012] border border-[#232329] inline-flex items-center gap-1.5 text-xs font-bold text-white cursor-pointer hover:border-[#3A3A44]"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#00F19F]" />
          <span className="font-mono">VDOT {state.vdot}</span>
        </button>
      </div>

      {/* Ritmos-alvo */}
      <div className="rounded-2xl bg-[#101012] border border-[#232329] p-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#6D6D76] block">
            Leve (E)
          </span>
          <span className="text-xs font-mono font-bold text-white mt-0.5 block">
            {paces.easyRange}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#6D6D76] block">
            Limiar (T)
          </span>
          <span className="text-xs font-mono font-bold text-[#00F19F] mt-0.5 block">
            {paces.thresholdKm}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#6D6D76] block">
            400m / 800m
          </span>
          <span className="text-xs font-mono font-bold text-white mt-0.5 block">
            {paces.rep400} / {paces.interval800}
          </span>
        </div>
      </div>

      {/* Filtro de Fase */}
      <EditorialTabRow options={PHASE_OPTIONS} selectedKey={phase} onSelect={setPhase} />

      <EditorialRule />

      {/* Lista de treinos */}
      <div className="space-y-3">
        {filteredRuns.map((run) => {
          const statusMeta =
            STATUS_OPTIONS.find((s) => s.status === run.status) ?? STATUS_OPTIONS[0];
          const est = run.durationMin ?? estimateRunDurationMinutes(run.prescription);
          return (
            <div
              key={run.id}
              className="rounded-2xl bg-[#101012] border border-[#232329] p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <StatusDotPill
                  text={`SEM ${run.week} · ${run.code} · ~${est} MIN`}
                  color={statusMeta.color}
                />
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: statusMeta.color }}
                >
                  {statusMeta.label}
                </span>
              </div>

              <p className="text-sm text-white leading-relaxed">{run.prescription}</p>

              {run.notes && run.notes !== '---' && (
                <p className="text-xs text-[#6D6D76] leading-snug">{run.notes}</p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onStartGuidedRun(run)}
                  className="flex-1 h-9 rounded-full bg-white text-black text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#E5E5EA]"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Iniciar com Voz</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectWorkout(run)}
                  className="h-9 px-3.5 rounded-full bg-[#1C1C21] border border-[#232329] text-xs font-semibold text-[#A4A4AE] hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Registrar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal VDOT */}
      {showVdotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#101012] border border-[#232329] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 safe-bottom">
            <div className="flex items-center justify-between">
              <div>
                <MicroKicker>TABELA 5.2 JACK DANIELS</MicroKicker>
                <h3 className="text-lg font-bold text-white">Calculadora VDOT</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVdotModal(false)}
                className="w-8 h-8 rounded-full bg-[#1C1C21] flex items-center justify-center text-[#A4A4AE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-black border border-[#232329] rounded-2xl p-3.5">
              <span className="text-xs font-bold text-[#A4A4AE]">VDOT Atual</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateVdot(state.vdot - 1)}
                  className="w-8 h-8 rounded-full bg-[#1C1C21] text-white font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono text-xl font-extrabold text-[#00F19F] w-8 text-center">
                  {state.vdot}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateVdot(state.vdot + 1)}
                  className="w-8 h-8 rounded-full bg-[#1C1C21] text-white font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <MicroKicker>CALCULAR POR TESTE RECENTE</MicroKicker>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-[#6D6D76] block mb-1">Distância (m)</label>
                  <input
                    type="number"
                    value={testDist}
                    onChange={(e) => setTestDist(e.target.value)}
                    className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#6D6D76] block mb-1">Minutos</label>
                  <input
                    type="number"
                    value={testMin}
                    onChange={(e) => setTestMin(e.target.value)}
                    className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#6D6D76] block mb-1">Segundos</label>
                  <input
                    type="number"
                    value={testSec}
                    onChange={(e) => setTestSec(e.target.value)}
                    className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-sm font-mono text-white"
                  />
                </div>
              </div>
              <MonochromePillButton
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#101012] border border-[#232329] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 safe-bottom">
            <div className="flex items-center justify-between">
              <div>
                <MicroKicker>
                  SEMANA {selectedWorkoutForEdit.week} · {selectedWorkoutForEdit.code}
                </MicroKicker>
                <h3 className="text-base font-bold text-white mt-0.5">Registrar Corrida</h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectWorkout(null)}
                className="w-8 h-8 rounded-full bg-[#1C1C21] flex items-center justify-center text-[#A4A4AE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#A4A4AE]">{selectedWorkoutForEdit.prescription}</p>

            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const active = editStatus === opt.status;
                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => setEditStatus(opt.status)}
                    className={`h-10 rounded-xl text-xs font-bold cursor-pointer border ${
                      active
                        ? 'bg-white text-black border-white'
                        : 'bg-[#1C1C21] text-white border-[#232329]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#A4A4AE] block mb-1">
                Duração real (minutos)
              </label>
              <input
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="w-full h-11 rounded-xl bg-black border border-[#232329] px-3.5 text-sm font-mono text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#A4A4AE] block mb-1">
                Observações
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Ex.: ritmos cravados, sensação leve..."
                className="w-full h-11 rounded-xl bg-black border border-[#232329] px-3.5 text-sm text-white"
              />
            </div>

            <MonochromePillButton
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

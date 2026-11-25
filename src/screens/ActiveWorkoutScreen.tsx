import { Check, PlayCircle, Plus, Timer, X } from 'lucide-react';
import { ActionButton, MetadataLine } from '../components/UiKit';
import type { ActiveWorkoutState } from '../data/useTafStore';
import { ExerciseGuides } from '../domain/exerciseGuides';
import type { ExerciseGuide } from '../domain/types';

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ActiveWorkoutScreen({
  activeWorkout,
  onUpdateSet,
  onToggleSetDone,
  onAddSet,
  onAdjustRest,
  onSkipRest,
  onOpenExerciseGuide,
  onDiscard,
  onFinish,
}: {
  activeWorkout: ActiveWorkoutState;
  onUpdateSet: (exerciseId: string, setNumber: number, weightText: string, repsText: string) => void;
  onToggleSetDone: (exerciseId: string, setNumber: number) => void;
  onAddSet: (exerciseId: string) => void;
  onAdjustRest: (deltaSeconds: number) => void;
  onSkipRest: () => void;
  onOpenExerciseGuide: (guide: ExerciseGuide) => void;
  onDiscard: () => void;
  onFinish: () => void;
}) {
  const totalSets = activeWorkout.exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const doneSets = activeWorkout.exercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <div className="min-h-dvh bg-[#090B0E] text-[#F5F7FA] flex flex-col safe-top safe-bottom">
      {/* Compact Sticky Top Bar */}
      <header className="sticky top-0 z-20 bg-[#090B0E]/92 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <MetadataLine
              items={[
                activeWorkout.template.category,
                `${formatElapsed(activeWorkout.elapsedSeconds)}`,
                `${doneSets}/${totalSets} séries`,
              ]}
            />
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7FA] truncate leading-tight">
              {activeWorkout.template.title}
            </h1>
          </div>
          <button
            type="button"
            onClick={onDiscard}
            aria-label="Descartar treino"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#12151B] border border-white/[0.08] flex items-center justify-center text-[#9CA3B2] hover:text-[#EF4444] cursor-pointer shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Logger Body */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-5 pb-28">
        {/* Rest Timer Banner */}
        {activeWorkout.isRestRunning && (
          <div className="rounded-2xl bg-[#12151B] border border-[#F5B700]/45 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5B700]/15 flex items-center justify-center text-[#F5B700]">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-[#9CA3B2] block">Descanso ativo</span>
                <span className="font-mono text-2xl font-bold text-[#F5B700] tabular-nums">
                  {formatElapsed(activeWorkout.restRemainingSeconds)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAdjustRest(-15)}
                className="min-h-[40px] px-3 rounded-xl bg-[#1A1E26] border border-white/[0.08] text-xs font-mono font-bold text-[#F5F7FA] hover:bg-[#232833] cursor-pointer"
              >
                -15s
              </button>
              <button
                type="button"
                onClick={() => onAdjustRest(15)}
                className="min-h-[40px] px-3 rounded-xl bg-[#1A1E26] border border-white/[0.08] text-xs font-mono font-bold text-[#F5F7FA] hover:bg-[#232833] cursor-pointer"
              >
                +15s
              </button>
              <button
                type="button"
                onClick={onSkipRest}
                className="min-h-[40px] px-4 rounded-xl bg-[#F5B700] text-[#090B0E] text-xs font-bold hover:bg-[#FFCA2C] cursor-pointer"
              >
                Pular
              </button>
            </div>
          </div>
        )}

        {/* Exercises */}
        {activeWorkout.exercises.map((ex) => (
          <div
            key={ex.exerciseId}
            className="rounded-2xl bg-[#12151B] border border-white/[0.08] p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7FA] leading-tight">
                  {ex.exerciseName}
                </h2>
                <p className="text-xs font-medium text-[#F5B700] mt-1">{ex.progressionTip}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOpenExerciseGuide(
                    ExerciseGuides.forExercise(ex.exerciseId, ex.exerciseName, ex.cue)
                  )
                }
                className="min-h-[40px] px-3 rounded-xl bg-[#1A1E26] border border-white/[0.08] hover:bg-[#232833] text-xs font-semibold text-[#D1D5DB] inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <PlayCircle className="w-4 h-4 text-[#F5B700]" />
                <span>Guia</span>
              </button>
            </div>

            <p className="text-xs text-[#8A93A5] leading-relaxed">{ex.cue}</p>

            <div className="space-y-2">
              <div className="grid grid-cols-[2.25rem_1fr_4.75rem_4.75rem_2.75rem] gap-2 text-xs font-medium text-[#8A93A5] px-1">
                <span className="text-center">Sér</span>
                <span>Anterior</span>
                <span className="text-center">kg</span>
                <span className="text-center">{ex.isTimed ? 'Seg' : 'Reps'}</span>
                <span className="text-center">OK</span>
              </div>

              {ex.sets.map((s) => (
                <div
                  key={s.setNumber}
                  className={`grid grid-cols-[2.25rem_1fr_4.75rem_4.75rem_2.75rem] gap-2 items-center rounded-xl px-1.5 py-2 transition-colors ${
                    s.completed ? 'bg-[#22C55E]/10' : 'bg-[#090B0E]/60'
                  }`}
                >
                  <span className="text-xs font-mono font-bold text-[#9CA3B2] text-center tabular-nums">
                    {s.setNumber}
                  </span>
                  <span className="text-xs font-mono text-[#8A93A5] truncate tabular-nums">
                    {s.previousSummary}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={s.weightKgText}
                    onChange={(e) =>
                      onUpdateSet(ex.exerciseId, s.setNumber, e.target.value, s.repsText)
                    }
                    placeholder="0"
                    className="h-10 rounded-lg bg-[#1A1E26] border border-white/[0.1] text-center text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.repsText}
                    onChange={(e) =>
                      onUpdateSet(ex.exerciseId, s.setNumber, s.weightKgText, e.target.value)
                    }
                    placeholder="0"
                    className="h-10 rounded-lg bg-[#1A1E26] border border-white/[0.1] text-center text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
                  />
                  <button
                    type="button"
                    aria-label={`Marcar série ${s.setNumber}`}
                    onClick={() => onToggleSetDone(ex.exerciseId, s.setNumber)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                      s.completed
                        ? 'bg-[#22C55E] text-[#090B0E]'
                        : 'bg-[#1A1E26] border border-white/[0.08] text-[#8A93A5] hover:text-[#F5F7FA]'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onAddSet(ex.exerciseId)}
              className="w-full min-h-[44px] rounded-xl bg-[#1A1E26] hover:bg-[#232833] border border-white/[0.06] text-xs font-semibold text-[#D1D5DB] hover:text-[#F5F7FA] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar série</span>
            </button>
          </div>
        ))}
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-gradient-to-t from-[#090B0E] via-[#090B0E]/95 to-transparent pt-6 pb-4 px-4 safe-bottom">
        <div className="max-w-3xl mx-auto">
          <ActionButton text="Concluir e Sincronizar com o QG" onClick={onFinish} />
        </div>
      </div>
    </div>
  );
}

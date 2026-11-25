import { Check, PlayCircle, Plus, Timer, X } from 'lucide-react';
import { MicroKicker, MonochromePillButton } from '../components/UiKit';
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
    <div className="min-h-dvh bg-black text-white flex flex-col safe-top safe-bottom">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-[#232329] px-5 py-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <MicroKicker>{activeWorkout.template.category}</MicroKicker>
          <h1 className="text-base font-bold text-white truncate">{activeWorkout.template.title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs font-bold text-[#00F19F] bg-[#101012] border border-[#232329] px-2.5 py-1.5 rounded-full">
            {formatElapsed(activeWorkout.elapsedSeconds)} · {doneSets}/{totalSets}
          </span>
          <button
            type="button"
            onClick={onDiscard}
            aria-label="Descartar treino"
            className="w-9 h-9 rounded-full bg-[#101012] border border-[#232329] flex items-center justify-center text-[#A4A4AE] hover:text-[#FF4D57] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rest Timer Banner */}
      {activeWorkout.isRestRunning && (
        <div className="mx-5 mt-4 rounded-2xl bg-[#101012] border border-[#00F19F]/40 p-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-[#00F19F]" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D6D76] block">
                DESCANSO
              </span>
              <span className="font-mono text-xl font-extrabold text-[#00F19F]">
                {formatElapsed(activeWorkout.restRemainingSeconds)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAdjustRest(-15)}
              className="h-8 px-2.5 rounded-full bg-[#1C1C21] text-xs font-mono font-bold text-white cursor-pointer"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => onAdjustRest(15)}
              className="h-8 px-2.5 rounded-full bg-[#1C1C21] text-xs font-mono font-bold text-white cursor-pointer"
            >
              +15s
            </button>
            <button
              type="button"
              onClick={onSkipRest}
              className="h-8 px-3 rounded-full bg-white text-black text-xs font-bold cursor-pointer"
            >
              Pular
            </button>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="flex-1 px-5 py-4 space-y-5 pb-28">
        {activeWorkout.exercises.map((ex) => (
          <div
            key={ex.exerciseId}
            className="rounded-2xl bg-[#101012] border border-[#232329] p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white">{ex.exerciseName}</h2>
                <p className="text-[11px] text-[#00F19F] mt-0.5">{ex.progressionTip}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOpenExerciseGuide(
                    ExerciseGuides.forExercise(ex.exerciseId, ex.exerciseName, ex.cue)
                  )
                }
                className="h-8 px-2.5 rounded-full bg-[#1C1C21] border border-[#232329] text-[11px] font-semibold text-[#A4A4AE] hover:text-white inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5 text-[#00F19F]" />
                <span>Guia</span>
              </button>
            </div>

            <p className="text-[11px] text-[#6D6D76] leading-snug">{ex.cue}</p>

            <div className="space-y-1.5">
              <div className="grid grid-cols-[2rem_1fr_4.5rem_4.5rem_2.5rem] gap-2 text-[10px] font-bold uppercase tracking-wider text-[#6D6D76] px-1">
                <span>Sér</span>
                <span>Anterior</span>
                <span className="text-center">kg</span>
                <span className="text-center">{ex.isTimed ? 'Seg' : 'Reps'}</span>
                <span className="text-center">OK</span>
              </div>

              {ex.sets.map((s) => (
                <div
                  key={s.setNumber}
                  className={`grid grid-cols-[2rem_1fr_4.5rem_4.5rem_2.5rem] gap-2 items-center rounded-xl px-1.5 py-1.5 ${
                    s.completed ? 'bg-[#00F19F]/10' : 'bg-black/40'
                  }`}
                >
                  <span className="text-xs font-mono font-bold text-[#A4A4AE] text-center">
                    {s.setNumber}
                  </span>
                  <span className="text-[11px] font-mono text-[#6D6D76] truncate">
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
                    className="h-8 rounded-lg bg-[#1C1C21] border border-[#232329] text-center text-xs font-mono text-white outline-none focus:border-white"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.repsText}
                    onChange={(e) =>
                      onUpdateSet(ex.exerciseId, s.setNumber, s.weightKgText, e.target.value)
                    }
                    placeholder="0"
                    className="h-8 rounded-lg bg-[#1C1C21] border border-[#232329] text-center text-xs font-mono text-white outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => onToggleSetDone(ex.exerciseId, s.setNumber)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                      s.completed
                        ? 'bg-[#00F19F] text-black'
                        : 'bg-[#1C1C21] border border-[#232329] text-[#6D6D76]'
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
              className="w-full h-8 rounded-xl bg-[#1C1C21] text-xs font-semibold text-[#A4A4AE] hover:text-white inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar série</span>
            </button>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-black/90 backdrop-blur-md border-t border-[#232329] safe-bottom">
        <MonochromePillButton text="Concluir e Sincronizar com o QG" onClick={onFinish} />
      </div>
    </div>
  );
}

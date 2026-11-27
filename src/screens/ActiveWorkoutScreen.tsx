import { Check, PlayCircle, Plus, Timer, X } from 'lucide-react';
import { ActionButton, LinearProgressBar, MetadataLine } from '../components/UiKit';
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
    <div className="min-h-dvh bg-[#F3F1EC] dark:bg-[#0A0A0C] text-[#111114] dark:text-[#F5F4EF] flex flex-col safe-top safe-bottom">
      {/* Matte Obsidian Sticky Session Header */}
      <header className="sticky top-0 z-20 bg-[#111114] dark:bg-[#0A0A0C] text-[#F5F4EF] border-b border-[#26262E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <MetadataLine
              items={[
                activeWorkout.template.category,
                `TEMPO ${formatElapsed(activeWorkout.elapsedSeconds)}`,
                `${doneSets}/${totalSets} SÉRIES`,
              ]}
              className="text-[#A1A1AA]"
            />
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-[#F5F4EF] truncate leading-none mt-1">
              {activeWorkout.template.title}
            </h1>
          </div>
          <button
            type="button"
            onClick={onDiscard}
            aria-label="Descartar treino"
            className="min-w-[44px] min-h-[44px] rounded-[4px] bg-white/10 hover:bg-[#DC2626] flex items-center justify-center text-[#F5F4EF] cursor-pointer shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-3">
          <LinearProgressBar
            value={doneSets}
            max={Math.max(1, totalSets)}
            barColor="#EAB308"
            heightClass="h-1"
          />
        </div>
      </header>

      {/* Main Structured Logger */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5 pb-28">
        {/* Rest Timer Strip */}
        {activeWorkout.isRestRunning && (
          <div className="rounded-[4px] bg-[#111114] dark:bg-[#16161C] border border-[#EAB308]/60 p-4 flex flex-wrap items-center justify-between gap-3 text-[#F5F4EF]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[4px] bg-[#EAB308] text-[#0A0A0C] flex items-center justify-center">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#EAB308] block">
                  Intervalo de descanso
                </span>
                <span className="font-mono text-2xl font-bold text-[#F5F4EF] tabular-nums">
                  {formatElapsed(activeWorkout.restRemainingSeconds)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAdjustRest(-15)}
                className="min-h-[40px] px-3 rounded-[4px] bg-[#1A1A20] border border-[#2E2E38] text-xs font-mono font-bold text-[#F5F4EF] hover:bg-[#26262E] cursor-pointer"
              >
                -15s
              </button>
              <button
                type="button"
                onClick={() => onAdjustRest(15)}
                className="min-h-[40px] px-3 rounded-[4px] bg-[#1A1A20] border border-[#2E2E38] text-xs font-mono font-bold text-[#F5F4EF] hover:bg-[#26262E] cursor-pointer"
              >
                +15s
              </button>
              <button
                type="button"
                onClick={onSkipRest}
                className="min-h-[40px] px-4 rounded-[4px] bg-[#EAB308] text-[#0A0A0C] text-xs font-bold hover:bg-[#FACC15] cursor-pointer"
              >
                Pular
              </button>
            </div>
          </div>
        )}

        {/* Exercises */}
        {activeWorkout.exercises.map((ex, idx) => (
          <section
            key={ex.exerciseId}
            className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-[#D6D2C7] dark:border-[#26262E] flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#CA8A04] dark:text-[#EAB308]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-display text-2xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] leading-none">
                    {ex.exerciseName}
                  </h2>
                </div>
                <p className="text-xs font-mono font-semibold text-[#CA8A04] dark:text-[#EAB308] mt-1.5">
                  {ex.progressionTip}
                </p>
                <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] mt-1 leading-relaxed">
                  {ex.cue}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOpenExerciseGuide(
                    ExerciseGuides.forExercise(ex.exerciseId, ex.exerciseName, ex.cue)
                  )
                }
                className="min-h-[40px] px-3 rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-[#F3F1EC] dark:bg-[#1A1A20] hover:bg-[#EAE7DF] dark:hover:bg-[#24242C] text-xs font-semibold text-[#111114] dark:text-[#F5F4EF] inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <PlayCircle className="w-4 h-4 text-[#CA8A04] dark:text-[#EAB308]" />
                <span>Guia</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-2">
              <div className="grid grid-cols-[2.5rem_1fr_4.75rem_4.75rem_2.75rem] gap-2 text-[10px] font-mono uppercase tracking-[0.06em] font-semibold text-[#6B6B76] dark:text-[#8A8A96] px-1">
                <span className="text-center">Série</span>
                <span>Anterior</span>
                <span className="text-center">kg</span>
                <span className="text-center">{ex.isTimed ? 'Seg' : 'Reps'}</span>
                <span className="text-center">OK</span>
              </div>

              {ex.sets.map((s) => (
                <div
                  key={s.setNumber}
                  className={`grid grid-cols-[2.5rem_1fr_4.75rem_4.75rem_2.75rem] gap-2 items-center rounded-[4px] px-1.5 py-2 transition-colors ${
                    s.completed
                      ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/15'
                      : 'bg-[#F3F1EC] dark:bg-[#1A1A20]'
                  }`}
                >
                  <span className="text-xs font-mono font-bold text-[#47474F] dark:text-[#C4C4CC] text-center tabular-nums">
                    {s.setNumber}
                  </span>
                  <span className="text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96] truncate tabular-nums">
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
                    className="h-10 rounded-[4px] bg-white dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] text-center text-sm font-mono text-[#111114] dark:text-[#F5F4EF] placeholder:text-[#8A8A96] outline-none focus:border-[#EAB308]"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.repsText}
                    onChange={(e) =>
                      onUpdateSet(ex.exerciseId, s.setNumber, s.weightKgText, e.target.value)
                    }
                    placeholder="0"
                    className="h-10 rounded-[4px] bg-white dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] text-center text-sm font-mono text-[#111114] dark:text-[#F5F4EF] placeholder:text-[#8A8A96] outline-none focus:border-[#EAB308]"
                  />
                  <button
                    type="button"
                    aria-label={`Marcar série ${s.setNumber}`}
                    onClick={() => onToggleSetDone(ex.exerciseId, s.setNumber)}
                    className={`w-11 h-11 rounded-[4px] flex items-center justify-center cursor-pointer transition-colors ${
                      s.completed
                        ? 'bg-[#15803D] dark:bg-[#22C55E] text-white dark:text-[#0A0A0C]'
                        : 'bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#2E2E38] text-[#8A8A96] hover:text-[#111114] dark:hover:text-[#F5F4EF]'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => onAddSet(ex.exerciseId)}
                className="w-full min-h-[42px] mt-1 rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] hover:bg-[#EAE7DF] dark:hover:bg-[#24242C] border border-[#D6D2C7] dark:border-[#26262E] text-xs font-semibold text-[#111114] dark:text-[#F5F4EF] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar série</span>
              </button>
            </div>
          </section>
        ))}
      </div>

      {/* Sticky Bottom Finish Bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-[#F3F1EC]/95 dark:bg-[#0A0A0C]/95 backdrop-blur-md border-t border-[#D6D2C7] dark:border-[#26262E] px-4 py-3 safe-bottom">
        <div className="max-w-4xl mx-auto">
          <ActionButton
            text="Concluir e Sincronizar com o QG"
            onClick={onFinish}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

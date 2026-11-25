import { Dumbbell, Play, PlayCircle } from 'lucide-react';
import {
  EditorialRule,
  MicroKicker,
  MonochromePillButton,
  StatusDotPill,
} from '../components/UiKit';
import { ExerciseGuides } from '../domain/exerciseGuides';
import type { ExerciseGuide, TafAppState, WorkoutTemplate } from '../domain/types';

export function ForcaScreen({
  state,
  recommendedTemplate,
  onStartWorkout,
  onOpenExerciseGuide,
}: {
  state: TafAppState;
  recommendedTemplate: WorkoutTemplate;
  onStartWorkout: (tpl: WorkoutTemplate) => void;
  onOpenExerciseGuide: (guide: ExerciseGuide) => void;
}) {
  return (
    <div className="px-5 pt-4 pb-28 space-y-5">
      <div>
        <MicroKicker>ROTINAS PRF · ESTILO LYFTA</MicroKicker>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">Treinos</h1>
      </div>

      {/* Recomendado pelo gargalo */}
      <div className="rounded-[22px] bg-[#101012] border border-[#232329] p-5 space-y-3">
        <StatusDotPill text={`PRIORIDADE · ${recommendedTemplate.targetTest.toUpperCase()}`} color="#00F19F" />
        <h2 className="text-lg font-bold text-white">{recommendedTemplate.title}</h2>
        <p className="text-xs text-[#A4A4AE] leading-relaxed">{recommendedTemplate.subtitle}</p>
        <MonochromePillButton
          text="Iniciar Treino Recomendado"
          icon={<Play className="w-4 h-4 fill-black" />}
          onClick={() => onStartWorkout(recommendedTemplate)}
        />
      </div>

      <EditorialRule />

      <MicroKicker>TODAS AS ROTINAS ({state.strengthTemplates.length})</MicroKicker>

      <div className="space-y-4">
        {state.strengthTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="rounded-2xl bg-[#101012] border border-[#232329] p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D6D76]">
                  {tpl.category}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{tpl.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => onStartWorkout(tpl)}
                className="h-9 px-3.5 rounded-full bg-white text-black text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-[#E5E5EA]"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Iniciar</span>
              </button>
            </div>

            <div className="divide-y divide-[#232329]">
              {tpl.exercises.map((ex) => (
                <div key={ex.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{ex.name}</p>
                    <p className="text-[11px] font-mono text-[#6D6D76]">
                      {ex.sets} séries · {ex.targetRepsOrTime} · {ex.restSeconds}s desc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenExerciseGuide(ExerciseGuides.forExercise(ex.id, ex.name, ex.cue))
                    }
                    className="h-8 px-2.5 rounded-full bg-[#1C1C21] border border-[#232329] text-[11px] font-semibold text-[#A4A4AE] hover:text-white inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <PlayCircle className="w-3.5 h-3.5 text-[#00F19F]" />
                    <span>Vídeo</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {state.strengthHistory.length > 0 && (
        <>
          <EditorialRule />
          <MicroKicker>HISTÓRICO RECENTE ({state.strengthHistory.length})</MicroKicker>
          <div className="space-y-2">
            {state.strengthHistory.slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="rounded-2xl bg-[#101012] border border-[#232329] px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-white">{s.title}</p>
                  <p className="text-[11px] text-[#6D6D76]">{s.dateStr}</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#00F19F]">
                  {Math.max(1, Math.round(s.durationSeconds / 60))} min ·{' '}
                  {Math.round(s.totalVolumeKg)} kg
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

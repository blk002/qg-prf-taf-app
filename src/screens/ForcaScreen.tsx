import { Dumbbell, Play, PlayCircle } from 'lucide-react';
import strengthRigImg from '../assets/images/strength_pullup_rig_1795625269686.jpg';
import {
  ActionButton,
  EditorialRule,
  MediaBanner,
  MetadataLine,
  SectionKicker,
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
    <div className="space-y-6 lg:space-y-8">
      {/* Featured Priority Strength Hero */}
      <MediaBanner
        src={strengthRigImg}
        alt="Estrutura de barra fixa em academia de treino funcional"
      >
        <div className="p-5 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <MetadataLine
              items={['Prioridade pelo seu gargalo TAF', recommendedTemplate.targetTest]}
              className="text-[#F5B700]"
            />
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#F5F7FA] leading-none text-balance">
              {recommendedTemplate.title}
            </h1>
            <p className="text-sm sm:text-base text-[#D1D5DB] leading-relaxed">
              {recommendedTemplate.subtitle}
            </p>
          </div>
          <div className="lg:w-72 shrink-0">
            <ActionButton
              text="Iniciar Treino Recomendado"
              icon={<Play className="w-4 h-4 fill-[#090B0E]" />}
              onClick={() => onStartWorkout(recommendedTemplate)}
            />
          </div>
        </div>
      </MediaBanner>

      {/* Section Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <SectionKicker>Biblioteca de força específica</SectionKicker>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7FA] mt-0.5">
            Todas as Rotinas ({state.strengthTemplates.length})
          </h2>
        </div>
      </div>

      {/* 2-Column Routine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {state.strengthTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="rounded-2xl bg-[#12151B] border border-white/[0.08] p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <MetadataLine items={[tpl.category, `${tpl.exercises.length} exercícios`]} />
                  <h3 className="font-display text-2xl font-bold text-[#F5F7FA] mt-1 leading-tight">
                    {tpl.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onStartWorkout(tpl)}
                  className="min-h-[44px] px-4 rounded-xl bg-[#F5B700] hover:bg-[#FFCA2C] text-[#090B0E] text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>Iniciar</span>
                </button>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {tpl.exercises.map((ex) => (
                  <div key={ex.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#F5F7FA] truncate">{ex.name}</p>
                      <p className="text-xs font-mono text-[#8A93A5] mt-0.5 tabular-nums">
                        {ex.sets} séries · {ex.targetRepsOrTime} · {ex.restSeconds}s desc.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenExerciseGuide(ExerciseGuides.forExercise(ex.id, ex.name, ex.cue))
                      }
                      className="min-h-[40px] px-3 rounded-xl bg-[#1A1E26] border border-white/[0.08] hover:bg-[#232833] text-xs font-semibold text-[#D1D5DB] hover:text-[#F5F7FA] inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      <PlayCircle className="w-4 h-4 text-[#F5B700]" />
                      <span>Guia</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent History */}
      {state.strengthHistory.length > 0 && (
        <div className="space-y-4 pt-2">
          <EditorialRule />
          <div>
            <SectionKicker>Sessões concluídas</SectionKicker>
            <h2 className="font-display text-2xl font-bold text-[#F5F7FA] mt-0.5">
              Histórico Recente ({state.strengthHistory.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.strengthHistory.slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="rounded-xl bg-[#12151B] border border-white/[0.08] px-4 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F5F7FA] truncate">{s.title}</p>
                  <p className="text-xs text-[#8A93A5] mt-0.5">{s.dateStr}</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#F5B700] whitespace-nowrap tabular-nums">
                  {Math.max(1, Math.round(s.durationSeconds / 60))} min ·{' '}
                  {Math.round(s.totalVolumeKg)} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

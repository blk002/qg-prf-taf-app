import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Dumbbell,
  Edit2,
  Play,
  PlayCircle,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import barStrengthImg from '../assets/images/prf_bar_strength_1795657968371.jpg';
import { ActionButton, MetadataLine } from '../components/UiKit';
import { ExerciseGuides } from '../domain/exerciseGuides';
import type {
  ExerciseGuide,
  ExerciseTemplate,
  TafAppState,
  WorkoutTemplate,
} from '../domain/types';

function createBlankExercise(): ExerciseTemplate {
  return {
    id: `custom_ex_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: '',
    sets: 3,
    targetRepsOrTime: '8–10 reps',
    restSeconds: 90,
    isTimed: false,
    cue: '',
  };
}

export function ForcaScreen({
  state,
  recommendedTemplate,
  onStartWorkout,
  onOpenExerciseGuide,
  onSaveTemplate,
  onDeleteTemplate,
  onResetTemplates,
}: {
  state: TafAppState;
  recommendedTemplate: WorkoutTemplate;
  onStartWorkout: (tpl: WorkoutTemplate) => void;
  onOpenExerciseGuide: (guide: ExerciseGuide) => void;
  onSaveTemplate: (tpl: WorkoutTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onResetTemplates: () => void;
}) {
  const [selectedId, setSelectedId] = useState(recommendedTemplate.id);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const [editingDraft, setEditingDraft] = useState<WorkoutTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeTemplate =
    state.strengthTemplates.find((t) => t.id === selectedId) ??
    recommendedTemplate ??
    state.strengthTemplates[0];

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setFormError(null);
    setEditingDraft({
      id: `custom_tpl_${Date.now()}`,
      title: '',
      category: 'Personalizado',
      targetTest: 'Geral TAF',
      subtitle: '',
      recommendedScheduleHint: '1–2x por semana',
      exercises: [createBlankExercise()],
    });
  };

  const openEditModal = (tpl: WorkoutTemplate) => {
    setIsCreatingNew(false);
    setFormError(null);
    setEditingDraft({
      ...tpl,
      exercises: tpl.exercises.map((e) => ({ ...e })),
    });
  };

  const updateDraftExercise = (idx: number, patch: Partial<ExerciseTemplate>) => {
    setEditingDraft((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex)),
      };
    });
  };

  const moveDraftExercise = (idx: number, dir: -1 | 1) => {
    setEditingDraft((prev) => {
      if (!prev) return null;
      const target = idx + dir;
      if (target < 0 || target >= prev.exercises.length) return prev;
      const next = [...prev.exercises];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return { ...prev, exercises: next };
    });
  };

  const removeDraftExercise = (idx: number) => {
    setEditingDraft((prev) => {
      if (!prev || prev.exercises.length <= 1) return prev;
      return {
        ...prev,
        exercises: prev.exercises.filter((_, i) => i !== idx),
      };
    });
  };

  const handleSaveDraft = () => {
    if (!editingDraft) return;
    const cleanTitle = editingDraft.title.trim();
    if (!cleanTitle) {
      setFormError('Informe um título para a rotina.');
      return;
    }
    const validExercises = editingDraft.exercises
      .map((ex) => ({
        ...ex,
        name: ex.name.trim(),
        targetRepsOrTime: ex.targetRepsOrTime.trim() || (ex.isTimed ? '30s' : '8–10 reps'),
        sets: Math.max(1, Math.min(12, Number(ex.sets) || 3)),
        restSeconds: Math.max(15, Math.min(300, Number(ex.restSeconds) || 90)),
        cue: ex.cue.trim() || 'Mantenha técnica controlada em todas as repetições.',
      }))
      .filter((ex) => ex.name.length > 0);

    if (validExercises.length === 0) {
      setFormError('Adicione pelo menos um exercício com nome preenchido.');
      return;
    }

    const finalTemplate: WorkoutTemplate = {
      ...editingDraft,
      title: cleanTitle,
      category: editingDraft.category.trim() || 'Personalizado',
      targetTest: editingDraft.targetTest.trim() || 'Geral TAF',
      subtitle: editingDraft.subtitle.trim() || 'Rotina personalizada para preparação TAF PRF.',
      recommendedScheduleHint: editingDraft.recommendedScheduleHint.trim() || '1–2x por semana',
      exercises: validExercises,
    };

    onSaveTemplate(finalTemplate);
    setSelectedId(finalTemplate.id);
    setEditingDraft(null);
  };

  return (
    <div className="space-y-7">
      {/* Editorial Photographic Pull-Up Priority Hero */}
      <section className="relative rounded-[6px] overflow-hidden bg-[#0E0E12] border border-[#26262E] text-[#F5F4EF]">
        <img
          src={barStrengthImg}
          alt="Mãos com magnésio na barra fixa de aço"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C]/95 via-[#0A0A0C]/80 to-[#0A0A0C]/35"
        />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <MetadataLine
              items={['PRIORIDADE PELO GARGALO TAF', recommendedTemplate.targetTest]}
              tone="gold"
            />
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-[0.01em] text-[#F5F4EF] leading-[0.95]">
              {recommendedTemplate.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#D4D4DC] leading-relaxed">
              {recommendedTemplate.subtitle}
            </p>
          </div>
          <ActionButton
            text="Iniciar Recomendado"
            icon={<Play className="w-4 h-4 fill-current" />}
            onClick={() => onStartWorkout(recommendedTemplate)}
            className="shrink-0"
          />
        </div>
      </section>

      {/* Mobile Stacked Routine Workbench */}
      <div className="space-y-5">
        {/* Routine Selector Strip */}
        <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#D6D2C7] dark:border-[#26262E] bg-[#EAE7DF] dark:bg-[#1A1A20] flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.08em] font-bold text-[#111114] dark:text-[#F5F4EF]">
              Fichas ({state.strengthTemplates.length})
            </h2>
            <div className="flex items-center gap-1.5">
              {confirmReset ? (
                <button
                  type="button"
                  onClick={() => {
                    onResetTemplates();
                    setConfirmReset(false);
                  }}
                  onMouseLeave={() => setConfirmReset(false)}
                  className="px-2.5 py-1 rounded-[3px] bg-[#EAB308] text-[#0A0A0C] text-[11px] font-mono font-bold cursor-pointer"
                >
                  Confirmar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  title="Restaurar rotinas padrão PRF"
                  aria-label="Restaurar rotinas padrão"
                  className="w-8 h-8 rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-white dark:bg-[#121216] hover:bg-[#F3F1EC] dark:hover:bg-[#24242C] flex items-center justify-center text-[#6B6B76] dark:text-[#8A8A96] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={openCreateModal}
                className="min-h-[32px] px-3 rounded-[4px] bg-[#111114] dark:bg-[#EAB308] hover:bg-[#22222A] dark:hover:bg-[#FACC15] text-[#F5F4EF] dark:text-[#0A0A0C] text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova</span>
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto divide-x divide-[#E4E0D7] dark:divide-[#202028]">
            {state.strengthTemplates.map((tpl) => {
              const isSelected = tpl.id === activeTemplate?.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(tpl.id);
                    setConfirmDeleteId(null);
                  }}
                  className={`min-w-[215px] shrink-0 text-left px-4 py-3.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#111114] dark:bg-[#1E1E26] text-[#F5F4EF]'
                      : 'hover:bg-[#F3F1EC] dark:hover:bg-[#1A1A20] text-[#111114] dark:text-[#F5F4EF]'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.06em] ${
                      isSelected ? 'text-[#EAB308]' : 'text-[#6B6B76] dark:text-[#8A8A96]'
                    }`}
                  >
                    <span>{tpl.category}</span>
                    <span className="tabular-nums">{tpl.exercises.length} EX.</span>
                  </div>
                  <p className="text-sm font-bold mt-1 leading-snug">{tpl.title}</p>
                  <p
                    className={`text-xs mt-0.5 truncate ${
                      isSelected ? 'text-[#A1A1AA]' : 'text-[#6B6B76] dark:text-[#8A8A96]'
                    }`}
                  >
                    Alvo: {tpl.targetTest}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Exercise Blueprint Ledger */}
        {activeTemplate && (
          <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] overflow-hidden">
            <div className="p-4 border-b border-[#D6D2C7] dark:border-[#26262E] space-y-3.5">
              <div className="space-y-1 min-w-0">
                <MetadataLine items={[activeTemplate.category, activeTemplate.targetTest]} />
                <h2 className="font-display text-3xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] leading-tight">
                  {activeTemplate.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#47474F] dark:text-[#A1A1AA]">
                  {activeTemplate.subtitle}
                </p>
                {activeTemplate.recommendedScheduleHint && (
                  <p className="text-[11px] font-mono text-[#CA8A04] dark:text-[#EAB308] pt-0.5">
                    {activeTemplate.recommendedScheduleHint}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(activeTemplate)}
                  aria-label="Editar rotina"
                  className="min-h-[44px] px-3 rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-[#F3F1EC] dark:bg-[#1A1A20] hover:bg-[#EAE7DF] dark:hover:bg-[#24242C] text-xs font-semibold text-[#111114] dark:text-[#F5F4EF] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                {state.strengthTemplates.length > 1 &&
                  (confirmDeleteId === activeTemplate.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteTemplate(activeTemplate.id);
                        setConfirmDeleteId(null);
                      }}
                      className="min-h-[44px] px-3 rounded-[4px] bg-[#DC2626] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirmar exclusão</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(activeTemplate.id)}
                      aria-label="Excluir rotina"
                      className="min-w-[44px] min-h-[44px] rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-[#F3F1EC] dark:bg-[#1A1A20] hover:bg-[#FEF2F2] dark:hover:bg-[#EF4444]/15 text-[#6B6B76] dark:text-[#8A8A96] hover:text-[#DC2626] dark:hover:text-[#EF4444] inline-flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ))}

                <ActionButton
                  text="Iniciar Treino"
                  icon={<Dumbbell className="w-4 h-4" />}
                  onClick={() => onStartWorkout(activeTemplate)}
                />
              </div>
            </div>

            <div className="divide-y divide-[#E4E0D7] dark:divide-[#202028]">
              {activeTemplate.exercises.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="px-4 py-3.5 space-y-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111114] dark:text-[#F5F4EF]">
                      <span className="font-mono text-xs text-[#CA8A04] dark:text-[#EAB308] mr-2">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {ex.name}
                    </p>
                    <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] mt-0.5 leading-snug">
                      {ex.cue}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="font-mono font-bold text-[#111114] dark:text-[#F5F4EF] tabular-nums">
                      <span className="text-[#6B6B76] dark:text-[#8A8A96] font-sans font-normal">
                        Séries:{' '}
                      </span>
                      {ex.sets}
                    </span>
                    <span className="font-mono text-[#47474F] dark:text-[#C4C4CC] tabular-nums">
                      {ex.targetRepsOrTime}
                    </span>
                    <span className="font-mono text-[#6B6B76] dark:text-[#8A8A96] tabular-nums">
                      {ex.restSeconds}s
                    </span>
                  </div>

                  <div className="sm:text-right pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenExerciseGuide(ExerciseGuides.forExercise(ex.id, ex.name, ex.cue))
                      }
                      className="min-h-[38px] px-3 rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-[#F3F1EC] dark:bg-[#1A1A20] hover:bg-[#EAE7DF] dark:hover:bg-[#24242C] text-xs font-semibold text-[#111114] dark:text-[#F5F4EF] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-[#CA8A04] dark:text-[#EAB308]" />
                      <span>Vídeo</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Strength History Ledger */}
      {state.strengthHistory.length > 0 && (
        <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#D6D2C7] dark:border-[#26262E] bg-[#EAE7DF] dark:bg-[#1A1A20] flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-[0.08em] font-bold text-[#111114] dark:text-[#F5F4EF]">
              Histórico de Sessões Concluídas ({state.strengthHistory.length})
            </h2>
          </div>
          <div className="divide-y divide-[#E4E0D7] dark:divide-[#202028]">
            {state.strengthHistory.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-xs text-[#6B6B76] dark:text-[#8A8A96] tabular-nums shrink-0">
                    {s.dateStr}
                  </span>
                  <span className="font-semibold text-[#111114] dark:text-[#F5F4EF] truncate">
                    {s.title}
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] tabular-nums">
                  {Math.max(1, Math.round(s.durationSeconds / 60))} min ·{' '}
                  {Math.round(s.totalVolumeKg)} kg
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Custom Routine Editor Modal */}
      {editingDraft && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] rounded-t-[6px] sm:rounded-[6px] p-5 sm:p-6 space-y-5 safe-bottom max-h-[92dvh] overflow-y-auto shadow-2xl">
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#D6D2C7] dark:bg-[#2E2E38] mx-auto -mt-1 mb-1" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <MetadataLine items={['PERSONALIZAÇÃO DE FORÇA']} />
                <h3 className="font-display text-3xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-1">
                  {isCreatingNew ? 'Nova Rotina de Força' : 'Editar Rotina'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDraft(null)}
                aria-label="Fechar editor"
                className="min-w-[44px] min-h-[44px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-[#F3F1EC] dark:bg-[#1A1A20] flex items-center justify-center text-[#6B6B76] dark:text-[#8A8A96] hover:text-[#111114] dark:hover:text-[#F5F4EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="rounded-[4px] px-4 py-2.5 text-xs font-semibold bg-[#FEF2F2] dark:bg-[#EF4444]/10 border border-[#FECACA] dark:border-[#EF4444]/30 text-[#B91C1C] dark:text-[#FCA5A5]">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1">
                  Nome da Rotina
                </label>
                <input
                  type="text"
                  value={editingDraft.title}
                  onChange={(e) =>
                    setEditingDraft((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                  placeholder="Ex.: Força Barra Fixa + Core Pesado"
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={editingDraft.category}
                  onChange={(e) =>
                    setEditingDraft((prev) => (prev ? { ...prev, category: e.target.value } : null))
                  }
                  placeholder="Ex.: Força TAF"
                  className="w-full h-10 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-xs text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1">
                  Prova-alvo
                </label>
                <input
                  type="text"
                  value={editingDraft.targetTest}
                  onChange={(e) =>
                    setEditingDraft((prev) =>
                      prev ? { ...prev, targetTest: e.target.value } : null
                    )
                  }
                  placeholder="Ex.: Barra Fixa e Abdominal"
                  className="w-full h-10 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-xs text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1">
                  Descrição curta
                </label>
                <input
                  type="text"
                  value={editingDraft.subtitle}
                  onChange={(e) =>
                    setEditingDraft((prev) => (prev ? { ...prev, subtitle: e.target.value } : null))
                  }
                  placeholder="Objetivo principal desta sessão..."
                  className="w-full h-10 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-xs text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
            </div>

            {/* Exercises list */}
            <div className="space-y-3 border-t border-[#E4E0D7] dark:border-[#26262E] pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-[0.06em] font-bold text-[#111114] dark:text-[#F5F4EF]">
                  Exercícios ({editingDraft.exercises.length})
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setEditingDraft((prev) =>
                      prev ? { ...prev, exercises: [...prev.exercises, createBlankExercise()] } : null
                    )
                  }
                  className="min-h-[36px] px-3 rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#2E2E38] hover:bg-[#EAE7DF] dark:hover:bg-[#24242C] text-xs font-semibold text-[#111114] dark:text-[#F5F4EF] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#CA8A04] dark:text-[#EAB308]" />
                  <span>Adicionar exercício</span>
                </button>
              </div>

              <div className="space-y-3">
                {editingDraft.exercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#6B6B76] dark:text-[#8A8A96] w-6">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => updateDraftExercise(idx, { name: e.target.value })}
                        placeholder="Nome do exercício (ex.: Barra Fixa Pronada)"
                        className="flex-1 h-10 rounded-[4px] bg-white dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-xs font-semibold text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveDraftExercise(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Mover para cima"
                          className="w-8 h-8 rounded-[3px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#2E2E38] flex items-center justify-center text-[#47474F] dark:text-[#8A8A96] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDraftExercise(idx, 1)}
                          disabled={idx === editingDraft.exercises.length - 1}
                          aria-label="Mover para baixo"
                          className="w-8 h-8 rounded-[3px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#2E2E38] flex items-center justify-center text-[#47474F] dark:text-[#8A8A96] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDraftExercise(idx)}
                          disabled={editingDraft.exercises.length <= 1}
                          aria-label="Remover exercício"
                          className="w-8 h-8 rounded-[3px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#2E2E38] flex items-center justify-center text-[#6B6B76] hover:text-[#DC2626] disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#6B6B76] dark:text-[#8A8A96] block mb-0.5">
                          Séries
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={ex.sets}
                          onChange={(e) =>
                            updateDraftExercise(idx, { sets: parseInt(e.target.value, 10) || 1 })
                          }
                          className="w-full h-9 rounded-[4px] bg-white dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-2.5 text-xs font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#6B6B76] dark:text-[#8A8A96] block mb-0.5">
                          Meta (reps/tempo)
                        </label>
                        <input
                          type="text"
                          value={ex.targetRepsOrTime}
                          onChange={(e) =>
                            updateDraftExercise(idx, { targetRepsOrTime: e.target.value })
                          }
                          placeholder="8–10 reps"
                          className="w-full h-9 rounded-[4px] bg-white dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-2.5 text-xs font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#6B6B76] dark:text-[#8A8A96] block mb-0.5">
                          Descanso (seg)
                        </label>
                        <input
                          type="number"
                          min={15}
                          max={300}
                          value={ex.restSeconds}
                          onChange={(e) =>
                            updateDraftExercise(idx, {
                              restSeconds: parseInt(e.target.value, 10) || 60,
                            })
                          }
                          className="w-full h-9 rounded-[4px] bg-white dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-2.5 text-xs font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#6B6B76] dark:text-[#8A8A96] block mb-0.5">
                          Medição
                        </label>
                        <select
                          value={ex.isTimed ? 'timed' : 'reps'}
                          onChange={(e) =>
                            updateDraftExercise(idx, { isTimed: e.target.value === 'timed' })
                          }
                          className="w-full h-9 rounded-[4px] bg-white dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-2 text-xs text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                        >
                          <option value="reps">Repetições</option>
                          <option value="timed">Tempo (seg)</option>
                        </select>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={ex.cue}
                      onChange={(e) => updateDraftExercise(idx, { cue: e.target.value })}
                      placeholder="Dica técnica / execução (opcional)"
                      className="w-full h-9 rounded-[4px] bg-white dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-xs text-[#47474F] dark:text-[#C4C4CC] outline-none focus:border-[#EAB308]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E4E0D7] dark:border-[#26262E]">
              <ActionButton
                text="Cancelar"
                variant="secondary"
                onClick={() => setEditingDraft(null)}
              />
              <ActionButton text="Salvar Rotina" onClick={handleSaveDraft} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

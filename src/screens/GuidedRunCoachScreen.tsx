import {
  Check,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ActionButton, LinearProgressBar, MetadataLine } from '../components/UiKit';
import type { GuidedRunState } from '../data/useTafStore';

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GuidedRunCoachScreen({
  guided,
  onTogglePlay,
  onNextStep,
  onPreviousStep,
  onToggleVoice,
  onFinish,
  onDiscard,
}: {
  guided: GuidedRunState;
  onTogglePlay: () => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onToggleVoice: () => void;
  onFinish: (asPartial: boolean) => void;
  onDiscard: () => void;
}) {
  const currentStep = guided.steps[guided.currentStepIndex] ?? guided.steps[0];
  const nextStep = guided.steps[guided.currentStepIndex + 1] ?? null;
  const elapsedInStep =
    currentStep && currentStep.durationSeconds > 0
      ? currentStep.durationSeconds - guided.stepRemainingSeconds
      : 1;

  const isWork = currentStep?.type === 'WORK';
  const isRecovery = currentStep?.type === 'RECOVERY';
  const phaseAccent = isWork ? '#EAB308' : isRecovery ? '#22C55E' : '#A1A1AA';
  const phaseTextClass = isWork
    ? 'text-[#CA8A04] dark:text-[#EAB308]'
    : isRecovery
      ? 'text-[#15803D] dark:text-[#22C55E]'
      : 'text-[#6B6B76] dark:text-[#A1A1AA]';

  return (
    <div className="min-h-dvh bg-[#F3F1EC] dark:bg-[#0A0A0C] text-[#111114] dark:text-[#F5F4EF] flex flex-col safe-top safe-bottom">
      {/* Top Bar */}
      <header className="bg-[#111114] dark:bg-[#0A0A0C] text-[#F5F4EF] border-b border-[#26262E]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <MetadataLine
              items={[
                `SEMANA ${guided.workout.week}`,
                guided.workout.code,
                `DECORRIDO ${formatClock(guided.totalElapsedSeconds)}`,
              ]}
              className="text-[#A1A1AA]"
            />
            <p className="font-display text-xl font-extrabold uppercase text-[#F5F4EF] leading-none mt-0.5">
              Bloco {guided.currentStepIndex + 1} de {guided.steps.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleVoice}
              aria-label={guided.voiceEnabled ? 'Desativar voz' : 'Ativar voz'}
              className="min-w-[44px] min-h-[44px] rounded-[4px] bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer transition-colors"
            >
              {guided.voiceEnabled ? (
                <Volume2 className="w-5 h-5 text-[#EAB308]" />
              ) : (
                <VolumeX className="w-5 h-5 text-[#8A8A96]" />
              )}
            </button>
            <button
              type="button"
              onClick={onDiscard}
              aria-label="Sair do treino guiado"
              className="min-w-[44px] min-h-[44px] rounded-[4px] bg-white/10 hover:bg-[#DC2626] flex items-center justify-center text-[#F5F4EF] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Mobile Stack */}
      <div className="flex-1 w-full max-w-[460px] mx-auto px-4 py-5 space-y-5">
        {/* High-Contrast Track Chronograph */}
        <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-5 flex flex-col justify-between gap-6">
          <div className="text-center space-y-4 my-auto py-4">
            <span className={`font-mono text-xs font-bold uppercase tracking-[0.12em] block ${phaseTextClass}`}>
              {currentStep?.title ?? 'Treino'}
            </span>

            <span className="font-mono text-7xl sm:text-8xl font-bold tracking-tight text-[#111114] dark:text-[#F5F4EF] leading-none block tabular-nums">
              {formatClock(guided.stepRemainingSeconds)}
            </span>

            <p className="text-base sm:text-lg font-semibold text-[#47474F] dark:text-[#C4C4CC] text-balance">
              {currentStep?.targetLabel}
            </p>

            <div className="max-w-md mx-auto pt-2">
              <LinearProgressBar
                value={elapsedInStep}
                max={Math.max(1, currentStep?.durationSeconds ?? 1)}
                barColor={phaseAccent}
                heightClass="h-2"
              />
            </div>

            {nextStep && (
              <p className="text-xs sm:text-sm text-[#6B6B76] dark:text-[#8A8A96] pt-2">
                Próximo:{' '}
                <span className="font-semibold text-[#111114] dark:text-[#F5F4EF]">
                  {nextStep.title}
                </span>{' '}
                <span className="font-mono tabular-nums">
                  ({formatClock(nextStep.durationSeconds)})
                </span>
              </p>
            )}
          </div>

          {/* Playback & Finish Controls */}
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={onPreviousStep}
                aria-label="Bloco anterior"
                className="w-14 h-14 rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-[#F3F1EC] dark:bg-[#1A1A20] hover:bg-[#EAE7DF] dark:hover:bg-[#24242C] flex items-center justify-center text-[#111114] dark:text-[#F5F4EF] cursor-pointer transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onTogglePlay}
                aria-label={guided.isRunning ? 'Pausar' : 'Retomar'}
                className="w-20 h-20 rounded-[6px] bg-[#EAB308] hover:bg-[#FACC15] text-[#0A0A0C] flex items-center justify-center cursor-pointer active:scale-95 transition-all"
              >
                {guided.isRunning ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={onNextStep}
                aria-label="Próximo bloco"
                className="w-14 h-14 rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-[#F3F1EC] dark:bg-[#1A1A20] hover:bg-[#EAE7DF] dark:hover:bg-[#24242C] flex items-center justify-center text-[#111114] dark:text-[#F5F4EF] cursor-pointer transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E4E0D7] dark:border-[#26262E]">
              <ActionButton
                text="Salvar Parcial"
                variant="secondary"
                onClick={() => onFinish(true)}
              />
              <ActionButton
                text="Concluir Treino"
                icon={<Check className="w-4 h-4" />}
                onClick={() => onFinish(false)}
              />
            </div>
          </div>
        </section>

        {/* Step Queue */}
        <aside className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] overflow-hidden flex flex-col max-h-[380px]">
          <div className="px-5 py-3.5 border-b border-[#D6D2C7] dark:border-[#26262E] bg-[#EAE7DF] dark:bg-[#1A1A20] flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-[0.08em] font-bold text-[#111114] dark:text-[#F5F4EF]">
              Roteiro da Sessão
            </h2>
            <span className="font-mono text-xs text-[#6B6B76] dark:text-[#8A8A96] tabular-nums">
              {guided.steps.length} blocos
            </span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#E4E0D7] dark:divide-[#202028]">
            {guided.steps.map((step, i) => {
              const isCurrent = i === guided.currentStepIndex;
              const isPast = i < guided.currentStepIndex;
              return (
                <div
                  key={step.index}
                  className={`px-5 py-3 flex items-center justify-between gap-3 text-xs ${
                    isCurrent
                      ? 'bg-[#111114] dark:bg-[#1E1E26] text-[#F5F4EF]'
                      : isPast
                        ? 'bg-[#F3F1EC] dark:bg-[#0A0A0C]/60 text-[#8A8A96]'
                        : 'bg-white dark:bg-[#121216] text-[#111114] dark:text-[#F5F4EF]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      <span
                        className={`font-mono mr-2 ${
                          isCurrent ? 'text-[#EAB308]' : 'opacity-60'
                        }`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {step.title}
                    </p>
                    <p
                      className={`text-[11px] font-mono truncate mt-0.5 ${
                        isCurrent
                          ? 'text-[#C4C4CC]'
                          : 'text-[#6B6B76] dark:text-[#8A8A96]'
                      }`}
                    >
                      {step.targetLabel}
                    </p>
                  </div>
                  <span className="font-mono font-semibold shrink-0 tabular-nums">
                    {formatClock(step.durationSeconds)}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

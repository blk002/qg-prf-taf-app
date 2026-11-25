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
import { ActionButton, MetadataLine } from '../components/UiKit';
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
  const progress =
    currentStep && currentStep.durationSeconds > 0
      ? 1 - guided.stepRemainingSeconds / currentStep.durationSeconds
      : 1;

  const isWork = currentStep?.type === 'WORK';
  const isRecovery = currentStep?.type === 'RECOVERY';
  const stepColor = isWork ? '#F5B700' : isRecovery ? '#22C55E' : '#F5F7FA';

  return (
    <div className="min-h-dvh bg-[#090B0E] text-[#F5F7FA] flex flex-col safe-top safe-bottom">
      <div className="flex-1 w-full max-w-2xl mx-auto px-5 py-6 flex flex-col justify-between">
        {/* Top Bar */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <MetadataLine
              items={[
                `Semana ${guided.workout.week}`,
                guided.workout.code,
                `Total ${formatClock(guided.totalElapsedSeconds)}`,
              ]}
            />
            <p className="text-sm font-semibold text-[#D1D5DB] mt-1">
              Bloco {guided.currentStepIndex + 1} de {guided.steps.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleVoice}
              aria-label={guided.voiceEnabled ? 'Desativar voz' : 'Ativar voz'}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-[#12151B] border border-white/[0.08] flex items-center justify-center cursor-pointer hover:bg-[#1A1E26] transition-colors"
            >
              {guided.voiceEnabled ? (
                <Volume2 className="w-5 h-5 text-[#F5B700]" />
              ) : (
                <VolumeX className="w-5 h-5 text-[#8A93A5]" />
              )}
            </button>
            <button
              type="button"
              onClick={onDiscard}
              aria-label="Sair do treino guiado"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-[#12151B] border border-white/[0.08] flex items-center justify-center text-[#9CA3B2] hover:text-[#EF4444] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Live Countdown */}
        <div className="flex flex-col items-center text-center space-y-5 my-auto py-10">
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ color: stepColor }}
          >
            {currentStep?.title ?? 'Treino'}
          </span>

          <span className="font-mono text-7xl sm:text-8xl font-bold tracking-tight text-[#F5F7FA] leading-none tabular-nums">
            {formatClock(guided.stepRemainingSeconds)}
          </span>

          <p className="text-base sm:text-lg font-medium text-[#D1D5DB] max-w-md text-balance">
            {currentStep?.targetLabel}
          </p>

          <div className="w-full max-w-sm h-2 rounded-full bg-[#1A1E26] overflow-hidden mt-2">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.max(4, Math.min(100, progress * 100))}%`,
                backgroundColor: stepColor,
              }}
            />
          </div>

          {nextStep && (
            <p className="text-xs sm:text-sm text-[#8A93A5] pt-2">
              A seguir:{' '}
              <span className="text-[#F5F7FA] font-semibold">{nextStep.title}</span>{' '}
              <span className="font-mono tabular-nums">({formatClock(nextStep.durationSeconds)})</span>
            </p>
          )}
        </div>

        {/* Bottom Thumb Controls */}
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={onPreviousStep}
              aria-label="Bloco anterior"
              className="w-14 h-14 rounded-2xl bg-[#12151B] border border-white/[0.08] hover:bg-[#1A1E26] flex items-center justify-center text-[#F5F7FA] cursor-pointer transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={guided.isRunning ? 'Pausar' : 'Retomar'}
              className="w-20 h-20 rounded-2xl bg-[#F5B700] hover:bg-[#FFCA2C] text-[#090B0E] flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            >
              {guided.isRunning ? (
                <Pause className="w-8 h-8 fill-[#090B0E]" />
              ) : (
                <Play className="w-8 h-8 fill-[#090B0E] ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={onNextStep}
              aria-label="Próximo bloco"
              className="w-14 h-14 rounded-2xl bg-[#12151B] border border-white/[0.08] hover:bg-[#1A1E26] flex items-center justify-center text-[#F5F7FA] cursor-pointer transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ActionButton
              text="Registrar Parcial"
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
      </div>
    </div>
  );
}

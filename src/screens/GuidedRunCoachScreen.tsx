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
import { MicroKicker, MonochromePillButton, StatusDotPill } from '../components/UiKit';
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

  const stepColor =
    currentStep?.type === 'WORK'
      ? '#00F19F'
      : currentStep?.type === 'RECOVERY'
        ? '#FFBE2E'
        : '#FFFFFF';

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col justify-between px-5 py-5 safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <MicroKicker>
            SEM {guided.workout.week} · {guided.workout.code} · TOTAL{' '}
            {formatClock(guided.totalElapsedSeconds)}
          </MicroKicker>
          <p className="text-xs text-[#A4A4AE] mt-0.5">
            Bloco {guided.currentStepIndex + 1} de {guided.steps.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleVoice}
            className="w-10 h-10 rounded-full bg-[#101012] border border-[#232329] flex items-center justify-center cursor-pointer"
          >
            {guided.voiceEnabled ? (
              <Volume2 className="w-4 h-4 text-[#00F19F]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#6D6D76]" />
            )}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="w-10 h-10 rounded-full bg-[#101012] border border-[#232329] flex items-center justify-center text-[#A4A4AE] hover:text-[#FF4D57] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Countdown */}
      <div className="flex flex-col items-center text-center space-y-4 my-auto py-8">
        <StatusDotPill text={currentStep?.title ?? 'Treino'} color={stepColor} />
        <span className="font-mono text-7xl font-extrabold tracking-tight text-white leading-none">
          {formatClock(guided.stepRemainingSeconds)}
        </span>
        <p className="text-base font-semibold" style={{ color: stepColor }}>
          {currentStep?.targetLabel}
        </p>

        <div className="w-full max-w-xs h-1.5 rounded-full bg-[#1C1C21] overflow-hidden mt-2">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.max(4, Math.min(100, progress * 100))}%`,
              backgroundColor: stepColor,
            }}
          />
        </div>

        {nextStep && (
          <p className="text-xs text-[#6D6D76] pt-2">
            A seguir: <span className="text-[#A4A4AE] font-semibold">{nextStep.title}</span> (
            {formatClock(nextStep.durationSeconds)})
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={onPreviousStep}
            className="w-12 h-12 rounded-full bg-[#101012] border border-[#232329] flex items-center justify-center text-white cursor-pointer"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            {guided.isRunning ? (
              <Pause className="w-7 h-7 fill-black" />
            ) : (
              <Play className="w-7 h-7 fill-black ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onNextStep}
            className="w-12 h-12 rounded-full bg-[#101012] border border-[#232329] flex items-center justify-center text-white cursor-pointer"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <MonochromePillButton
            text="Parcial"
            variant="secondary"
            onClick={() => onFinish(true)}
          />
          <MonochromePillButton
            text="Concluir"
            icon={<Check className="w-4 h-4" />}
            onClick={() => onFinish(false)}
          />
        </div>
      </div>
    </div>
  );
}

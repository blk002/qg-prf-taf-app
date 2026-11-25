import { AlertTriangle, ExternalLink, Play, X } from 'lucide-react';
import { EditorialRule, MetadataLine, SectionKicker } from '../components/UiKit';
import type { ExerciseGuide } from '../domain/types';

export function ExerciseGuideModal({
  guide,
  onClose,
}: {
  guide: ExerciseGuide;
  onClose: () => void;
}) {
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    guide.youtubeQuery
  )}`;
  const youtubeShortsUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    guide.youtubeShortsQuery
  )}`;
  const embedSearchUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
    guide.youtubeQuery
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#12151B] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-5 safe-bottom max-h-[92dvh] overflow-y-auto">
        <div className="sm:hidden w-10 h-1.5 rounded-full bg-white/15 mx-auto -mt-1 mb-2" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <MetadataLine items={['Guia técnico', 'Execução TAF']} />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7FA] mt-1 leading-tight">
              {guide.title}
            </h2>
            <p className="text-xs font-medium text-[#F5B700] mt-1">{guide.muscles}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar guia"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#1A1E26] border border-white/[0.08] flex items-center justify-center text-[#9CA3B2] hover:text-[#F5F7FA] shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Embedded YouTube Player */}
        <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#090B0E] aspect-video">
          <iframe
            title={`Vídeo: ${guide.title}`}
            src={embedSearchUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] rounded-xl bg-[#F5B700] hover:bg-[#FFCA2C] text-[#090B0E] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-[#090B0E]" />
            <span>YouTube</span>
          </a>
          <a
            href={youtubeShortsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] rounded-xl bg-[#1A1E26] border border-white/[0.08] hover:bg-[#232833] text-[#F5F7FA] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#9CA3B2]" />
            <span>Shorts Rápido</span>
          </a>
        </div>

        <EditorialRule />

        <div className="space-y-1.5">
          <SectionKicker>Posição inicial</SectionKicker>
          <p className="text-sm text-[#D1D5DB] leading-relaxed">{guide.setup}</p>
        </div>

        <div className="space-y-3">
          <SectionKicker>Passo a passo</SectionKicker>
          <ol className="space-y-2.5">
            {guide.steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-[#F5F7FA] leading-relaxed"
              >
                <span className="font-mono text-xs font-bold text-[#F5B700] shrink-0 mt-0.5 tabular-nums">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 p-4 space-y-2">
          <div className="flex items-center gap-2 text-[#FCA5A5] text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Erros que reprovam ou lesionam</span>
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm text-[#F5F7FA] list-disc list-inside">
            {guide.commonMistakes.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

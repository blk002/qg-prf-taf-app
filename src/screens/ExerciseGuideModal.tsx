import { AlertTriangle, ExternalLink, Play, X } from 'lucide-react';
import { MetadataLine } from '../components/UiKit';
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] rounded-t-[6px] sm:rounded-[6px] p-5 sm:p-6 space-y-5 safe-bottom max-h-[92dvh] overflow-y-auto shadow-2xl">
        <div className="sm:hidden w-10 h-1 rounded-full bg-[#D6D2C7] dark:bg-[#2E2E38] mx-auto -mt-1 mb-1" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <MetadataLine items={['GUIA TÉCNICO', 'EXECUÇÃO TAF']} />
            <h2 className="font-display text-3xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-1 leading-tight">
              {guide.title}
            </h2>
            <p className="text-xs font-mono font-semibold text-[#CA8A04] dark:text-[#EAB308] mt-1">
              {guide.muscles}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar guia"
            className="min-w-[44px] min-h-[44px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-[#F3F1EC] dark:bg-[#1A1A20] flex items-center justify-center text-[#6B6B76] dark:text-[#8A8A96] hover:text-[#111114] dark:hover:text-[#F5F4EF] shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-[4px] overflow-hidden border border-[#D6D2C7] dark:border-[#26262E] bg-black aspect-video">
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
            className="min-h-[44px] rounded-[4px] bg-[#EAB308] hover:bg-[#FACC15] text-[#0A0A0C] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>YouTube</span>
          </a>
          <a
            href={youtubeShortsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-[#F3F1EC] dark:bg-[#1A1A20] hover:bg-[#EAE7DF] dark:hover:bg-[#24242C] text-[#111114] dark:text-[#F5F4EF] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#6B6B76] dark:text-[#8A8A96]" />
            <span>Shorts Rápido</span>
          </a>
        </div>

        <div className="border-t border-[#E4E0D7] dark:border-[#26262E] pt-4 space-y-1.5">
          <h3 className="text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-[#6B6B76] dark:text-[#8A8A96]">
            Posição inicial
          </h3>
          <p className="text-sm text-[#47474F] dark:text-[#C4C4CC] leading-relaxed">
            {guide.setup}
          </p>
        </div>

        <div className="space-y-2.5">
          <h3 className="text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-[#6B6B76] dark:text-[#8A8A96]">
            Passo a passo
          </h3>
          <ol className="space-y-2">
            {guide.steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-[#111114] dark:text-[#F5F4EF] leading-relaxed"
              >
                <span className="font-mono text-xs font-bold text-[#CA8A04] dark:text-[#EAB308] shrink-0 mt-0.5 tabular-nums">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[4px] bg-[#FEF2F2] dark:bg-[#EF4444]/10 border border-[#FECACA] dark:border-[#EF4444]/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-[#B91C1C] dark:text-[#EF4444] text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Erros que reprovam ou lesionam</span>
          </div>
          <ul className="space-y-1 text-xs sm:text-sm text-[#7F1D1D] dark:text-[#FCA5A5] list-disc list-inside">
            {guide.commonMistakes.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

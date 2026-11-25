import { AlertTriangle, ExternalLink, Play, X } from 'lucide-react';
import { EditorialRule, MicroKicker } from '../components/UiKit';
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#101012] border border-[#232329] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 safe-bottom max-h-[92dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <MicroKicker>GUIA TÉCNICO · EXECUÇÃO TAF</MicroKicker>
            <h2 className="text-lg font-bold text-white mt-0.5 leading-snug">{guide.title}</h2>
            <p className="text-[11px] text-[#00F19F] mt-1">{guide.muscles}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#1C1C21] border border-[#232329] flex items-center justify-center text-[#A4A4AE] hover:text-white shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player YouTube embutido */}
        <div className="rounded-2xl overflow-hidden border border-[#232329] bg-black aspect-video">
          <iframe
            title={`Vídeo: ${guide.title}`}
            src={embedSearchUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 rounded-full bg-white text-black text-xs font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>YouTube</span>
          </a>
          <a
            href={youtubeShortsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 rounded-full bg-[#1C1C21] border border-[#232329] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Shorts Rápido</span>
          </a>
        </div>

        <EditorialRule />

        <div className="space-y-1.5">
          <MicroKicker>POSIÇÃO INICIAL</MicroKicker>
          <p className="text-xs text-[#A4A4AE] leading-relaxed">{guide.setup}</p>
        </div>

        <div className="space-y-2">
          <MicroKicker>PASSO A PASSO</MicroKicker>
          <ol className="space-y-2">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-white leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-[#1C1C21] border border-[#232329] font-mono text-[10px] font-bold text-[#00F19F] flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl bg-[#FF4D57]/10 border border-[#FF4D57]/25 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#FF4D57] text-[11px] font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Erros que reprovam / lesionam</span>
          </div>
          <ul className="space-y-1 text-xs text-[#E5E5EA] list-disc list-inside">
            {guide.commonMistakes.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

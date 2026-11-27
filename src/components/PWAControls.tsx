import React, { useRef, useState } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  Printer,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../data/usePWAInstall';
import type { TafAppState } from '../domain/types';
import { ActionButton, MetadataLine } from './UiKit';

function formatTimeFromMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildCsvReport(state: TafAppState): string {
  const lines: string[] = [];
  lines.push('=== SIMULADOS TAF PRF ===');
  lines.push(
    'Data,Genero,Barra,Pts Barra,Abdominal,Pts Abdom,Impulsao (m),Pts Impulsao,Corrida 12m (m),Pts Corrida,Shuttle (s),Pts Shuttle,Total (25)'
  );
  state.tafHistory.forEach((s) => {
    lines.push(
      [
        s.data,
        s.genero,
        s.barra,
        s.ptsBarra.toFixed(1),
        s.abdominal,
        s.ptsAbdominal.toFixed(1),
        s.impulsao.toFixed(2),
        s.ptsImpulsao.toFixed(1),
        s.corrida,
        s.ptsCorrida.toFixed(1),
        s.shuttle.toFixed(2),
        s.ptsShuttle.toFixed(1),
        s.totalPts.toFixed(1),
      ].join(',')
    );
  });

  lines.push('');
  lines.push('=== TREINOS DE CORRIDA (JACK DANIELS) ===');
  lines.push('ID,Fase,Semana,Codigo,Status,Data Conclusao,Duracao (min),Prescricao');
  state.runWorkouts
    .filter((r) => r.status !== 'PENDENTE')
    .forEach((r) => {
      const safePresc = `"${r.prescription.replace(/"/g, '""')}"`;
      lines.push(
        [
          r.id,
          r.phase,
          r.week,
          r.code,
          r.status,
          r.completedDate ?? '',
          r.durationMin ?? '',
          safePresc,
        ].join(',')
      );
    });

  lines.push('');
  lines.push('=== SESSOES DE FORCA ===');
  lines.push('Data,Rotina,Categoria,Duracao (min),Volume Total (kg),Exercicios');
  state.strengthHistory.forEach((s) => {
    const safeTitle = `"${s.title.replace(/"/g, '""')}"`;
    lines.push(
      [
        s.dateStr,
        safeTitle,
        s.category,
        Math.max(1, Math.round(s.durationSeconds / 60)),
        Math.round(s.totalVolumeKg),
        s.exercises.length,
      ].join(',')
    );
  });

  return '\uFEFF' + lines.join('\n');
}

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        aria-label="Instalar aplicativo"
        title="Instalar aplicativo offline"
        className={
          compact
            ? 'min-w-[40px] min-h-[40px] rounded-[4px] border border-[#CA8A04]/50 dark:border-[#EAB308]/50 bg-[#EAB308]/15 text-[#CA8A04] dark:text-[#EAB308] flex items-center justify-center cursor-pointer transition-colors hover:bg-[#EAB308]/25'
            : 'w-full min-h-[40px] px-3 rounded-[4px] bg-[#EAB308]/15 hover:bg-[#EAB308]/25 border border-[#EAB308]/40 flex items-center justify-between text-xs font-semibold text-[#111114] dark:text-[#F5F4EF] transition-colors cursor-pointer'
        }
      >
        {compact ? (
          <Download className="w-4 h-4" />
        ) : (
          <>
            <span className="inline-flex items-center gap-2.5">
              <Download className="w-4 h-4 text-[#CA8A04] dark:text-[#EAB308]" />
              <span>Instalar App</span>
            </span>
            <span className="font-mono text-[10px] text-[#CA8A04] dark:text-[#EAB308]">PWA</span>
          </>
        )}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="Instalar no iOS"
          title="Instalar no iPhone / iPad"
          className={
            compact
              ? 'min-w-[40px] min-h-[40px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-white dark:bg-[#121216] text-[#111114] dark:text-[#F5F4EF] flex items-center justify-center cursor-pointer'
              : 'w-full min-h-[40px] px-3 rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] flex items-center justify-between text-xs font-semibold text-[#111114] dark:text-[#F5F4EF] transition-colors cursor-pointer'
          }
        >
          {compact ? (
            <Smartphone className="w-4 h-4 text-[#CA8A04] dark:text-[#EAB308]" />
          ) : (
            <>
              <span className="inline-flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-[#CA8A04] dark:text-[#EAB308]" />
                <span>Instalar no iOS</span>
              </span>
              <span className="font-mono text-[10px] text-[#6B6B76] dark:text-[#8A8A96]">Safari</span>
            </>
          )}
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-sm bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] rounded-t-[6px] sm:rounded-[6px] p-5 sm:p-6 space-y-4 safe-bottom shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-2xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF]">
                  Instalar no iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Fechar"
                  className="min-w-[40px] min-h-[40px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-[#F3F1EC] dark:bg-[#1A1A20] flex items-center justify-center text-[#6B6B76] dark:text-[#8A8A96] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-2.5 text-sm text-[#47474F] dark:text-[#C4C4CC]">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#CA8A04] dark:text-[#EAB308] mt-0.5">
                    01.
                  </span>
                  <span>
                    Toque no botão <strong>Compartilhar</strong>{' '}
                    <Share className="w-3.5 h-3.5 inline text-[#CA8A04] dark:text-[#EAB308]" /> na
                    barra do Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#CA8A04] dark:text-[#EAB308] mt-0.5">
                    02.
                  </span>
                  <span>
                    Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#CA8A04] dark:text-[#EAB308] mt-0.5">
                    03.
                  </span>
                  <span>
                    Confirme em <strong>Adicionar</strong> para usar em tela cheia offline.
                  </span>
                </li>
              </ol>
              <ActionButton
                text="Entendi"
                variant="secondary"
                onClick={() => setShowIOSGuide(false)}
                className="w-full"
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="no-print fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-[4px] bg-[#111114] border border-[#EAB308]/60 px-3.5 py-2 text-[11px] font-mono font-semibold text-[#F5F4EF] shadow-lg whitespace-nowrap"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#EAB308] shrink-0" />
      <span>MODO OFFLINE — DADOS LOCAIS PROTEGIDOS</span>
    </div>
  );
}

export function AppToolsModal({
  state,
  reminderEnabled,
  reminderSupported,
  reminderPermission,
  onToggleReminder,
  onSendTestReminder,
  onImportBackup,
  onClose,
}: {
  state: TafAppState;
  reminderEnabled: boolean;
  reminderSupported: boolean;
  reminderPermission: NotificationPermission;
  onToggleReminder: () => Promise<{ ok: boolean; message: string }>;
  onSendTestReminder: () => { ok: boolean; message: string };
  onImportBackup: (rawJson: string) => { ok: boolean; message: string };
  onClose: () => void;
}) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleExportJson = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        app: 'QG da PRF • TAF',
        version: 1,
        state,
      },
      null,
      2
    );
    downloadBlob(`qg-prf-taf-backup-${stamp}.json`, payload, 'application/json;charset=utf-8');
    setFeedback({ ok: true, message: 'Backup JSON baixado com sucesso.' });
  };

  const handleExportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const csv = buildCsvReport(state);
    downloadBlob(`qg-prf-taf-relatorio-${stamp}.csv`, csv, 'text/csv;charset=utf-8');
    setFeedback({ ok: true, message: 'Planilha CSV de evolução exportada.' });
  };

  const handlePrintPdf = () => {
    onClose();
    window.setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const res = onImportBackup(text);
      setFeedback(res);
    };
    reader.onerror = () => {
      setFeedback({ ok: false, message: 'Erro ao ler o arquivo selecionado.' });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] rounded-t-[6px] sm:rounded-[6px] p-5 sm:p-6 space-y-5 safe-bottom max-h-[92dvh] overflow-y-auto shadow-2xl">
        <div className="sm:hidden w-10 h-1 rounded-full bg-[#D6D2C7] dark:bg-[#2E2E38] mx-auto -mt-1 mb-1" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <MetadataLine items={['Ferramentas', 'Offline & Backup']} />
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-[0.02em] text-[#111114] dark:text-[#F5F4EF] mt-1">
              App, Lembretes e Backup
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="min-w-[44px] min-h-[44px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-[#F3F1EC] dark:bg-[#1A1A20] flex items-center justify-center text-[#6B6B76] dark:text-[#8A8A96] hover:text-[#111114] dark:hover:text-[#F5F4EF] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {feedback && (
          <div
            className={`rounded-[4px] px-4 py-3 text-xs font-medium border ${
              feedback.ok
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D] dark:bg-[#22C55E]/10 dark:border-[#22C55E]/30 dark:text-[#86EFAC]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C] dark:bg-[#EF4444]/10 dark:border-[#EF4444]/30 dark:text-[#FCA5A5]'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Section 1: PWA Install */}
        <section className="rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#111114] dark:text-[#F5F4EF]">
                Instalação Offline (PWA)
              </h3>
              <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] mt-0.5">
                {isInstalled
                  ? 'Aplicativo instalado em modo tela cheia com cache offline ativo.'
                  : isInstallable
                    ? 'Instale na tela inicial para abrir instantaneamente e treinar sem internet.'
                    : isIOS
                      ? 'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.'
                      : 'Cache offline ativo. Use o menu do navegador para instalar na área de trabalho.'}
              </p>
            </div>
            {isInstalled && (
              <CheckCircle2 className="w-5 h-5 text-[#15803D] dark:text-[#22C55E] shrink-0" />
            )}
          </div>
          {!isInstalled && isInstallable && (
            <ActionButton
              text="Instalar QG da PRF agora"
              icon={<Download className="w-4 h-4" />}
              onClick={async () => {
                const accepted = await install();
                if (accepted) {
                  setFeedback({ ok: true, message: 'Aplicativo instalado com sucesso.' });
                }
              }}
              className="w-full"
            />
          )}
        </section>

        {/* Section 2: Training Reminders */}
        <section className="rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#111114] dark:text-[#F5F4EF]">
                Lembrete Diário de Treino
              </h3>
              <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] mt-0.5">
                Horário configurado:{' '}
                <strong className="font-mono text-[#111114] dark:text-[#F5F4EF]">
                  {formatTimeFromMin(state.preferredTrainingStartMin)}
                </strong>{' '}
                (altere em Hoje → Dias de Corrida e Horário)
              </p>
              {reminderSupported && reminderPermission === 'denied' && (
                <p className="text-[11px] text-[#DC2626] dark:text-[#EF4444] mt-1">
                  Permissão bloqueada no navegador. Reative nas configurações do site.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={async () => {
                const res = await onToggleReminder();
                setFeedback(res);
              }}
              className={`min-h-[40px] px-3.5 rounded-[4px] text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                reminderEnabled
                  ? 'bg-[#15803D] text-white hover:bg-[#166534]'
                  : 'bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#2E2E38] text-[#111114] dark:text-[#F5F4EF]'
              }`}
            >
              {reminderEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              <span>{reminderEnabled ? 'Ativo' : 'Ativar'}</span>
            </button>
          </div>
          {reminderEnabled && (
            <button
              type="button"
              onClick={() => setFeedback(onSendTestReminder())}
              className="text-xs font-mono font-semibold text-[#CA8A04] dark:text-[#EAB308] hover:underline cursor-pointer"
            >
              Enviar notificação de teste agora
            </button>
          )}
        </section>

        {/* Section 3: Backup & Report Export */}
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[#111114] dark:text-[#F5F4EF]">
              Backup e Relatório de Evolução
            </h3>
            <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] mt-0.5">
              Salve seus simulados, histórico de corrida, VDOT e fichas de força em arquivo local.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <ActionButton
              text="Exportar Backup (.json)"
              variant="secondary"
              icon={<Download className="w-4 h-4 text-[#CA8A04] dark:text-[#EAB308]" />}
              onClick={handleExportJson}
            />
            <ActionButton
              text="Restaurar Backup"
              variant="secondary"
              icon={<FileUp className="w-4 h-4 text-[#47474F] dark:text-[#C4C4CC]" />}
              onClick={() => fileInputRef.current?.click()}
            />
            <ActionButton
              text="Exportar Planilha (.csv)"
              variant="secondary"
              icon={<FileSpreadsheet className="w-4 h-4 text-[#15803D] dark:text-[#22C55E]" />}
              onClick={handleExportCsv}
            />
            <ActionButton
              text="Imprimir / Salvar PDF"
              variant="navy"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrintPdf}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </section>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Cloud,
  Loader2,
  LogOut,
  Moon,
  RefreshCw,
  Shield,
  Sun,
  User,
  X,
} from 'lucide-react';
import type { SyncUiState } from '../data/useTafStore';
import type { SupabaseConfig } from '../domain/types';
import { PWAInstallButton } from './PWAControls';

export function MetadataLine({
  items,
  tone = 'muted',
  className = '',
}: {
  items: (string | null | undefined | false)[];
  tone?: 'muted' | 'gold' | 'light';
  className?: string;
}) {
  const clean = items.filter((item): item is string => Boolean(item && item.trim()));
  if (!clean.length) return null;
  const toneClass =
    tone === 'gold'
      ? 'text-[#EAB308]'
      : tone === 'light'
        ? 'text-[#C4C4CC]'
        : 'text-[#6B6B76] dark:text-[#8A8A96]';
  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono font-medium uppercase tracking-[0.06em] ${toneClass} ${className}`}
    >
      {clean.map((item, idx) => (
        <React.Fragment key={`${item}-${idx}`}>
          {idx > 0 && (
            <span aria-hidden="true" className="opacity-45">
              /
            </span>
          )}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function ActionButton({
  text,
  icon,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
}: {
  text: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'navy' | 'secondary';
  className?: string;
}) {
  const styles =
    variant === 'primary'
      ? 'bg-[#EAB308] text-[#0A0A0C] hover:bg-[#FACC15] active:bg-[#CA8A04] font-bold border border-[#CA8A04]/40'
      : variant === 'navy'
        ? 'bg-[#111114] text-[#F5F4EF] hover:bg-[#22222A] dark:bg-[#F5F4EF] dark:text-[#0A0A0C] dark:hover:bg-[#E4E2DA] font-bold border border-transparent'
        : 'bg-white text-[#111114] border border-[#D6D2C7] hover:bg-[#EAE7DF] dark:bg-[#1A1A20] dark:text-[#F5F4EF] dark:border-[#2E2E38] dark:hover:bg-[#24242C] font-semibold';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-[44px] px-4 py-2.5 rounded-[4px] text-xs sm:text-[13px] tracking-[0.01em] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors duration-150 active:scale-[0.99] disabled:opacity-50 cursor-pointer ${styles} ${className}`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

export function SegmentedControl({
  options,
  selectedKey,
  onSelect,
}: {
  options: { key: string; label: string }[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="inline-flex w-full sm:w-auto items-center p-0.5 rounded-[4px] bg-[#EAE7DF] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E]">
      {options.map((opt) => {
        const active = opt.key === selectedKey;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt.key)}
            className={`flex-1 sm:flex-initial min-h-[34px] px-3.5 rounded-[3px] text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer ${
              active
                ? 'bg-[#111114] text-[#F5F4EF] dark:bg-[#EAB308] dark:text-[#0A0A0C]'
                : 'text-[#47474F] hover:text-[#111114] dark:text-[#A1A1AA] dark:hover:text-[#F5F4EF]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function LinearProgressBar({
  value,
  max,
  cutoff,
  barColor = '#EAB308',
  heightClass = 'h-1.5',
  onDarkSurface = false,
}: {
  value: number;
  max: number;
  cutoff?: number;
  barColor?: string;
  heightClass?: string;
  onDarkSurface?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  const cutoffPct = cutoff && max > 0 ? Math.max(0, Math.min(100, (cutoff / max) * 100)) : null;

  return (
    <div
      className={`relative w-full ${heightClass} rounded-[1px] overflow-visible ${
        onDarkSurface ? 'bg-white/15' : 'bg-[#DDD8CE] dark:bg-[#26262E]'
      }`}
    >
      <div
        className="h-full rounded-[1px] transition-[width] duration-300"
        style={{ width: `${pct}%`, backgroundColor: barColor }}
      />
      {cutoffPct !== null && (
        <div
          aria-hidden="true"
          className={`absolute top-1/2 -translate-y-1/2 w-[2px] h-3.5 ${
            onDarkSurface ? 'bg-[#F5F4EF]' : 'bg-[#111114] dark:bg-[#F5F4EF]'
          }`}
          style={{ left: `${cutoffPct}%` }}
        />
      )}
    </div>
  );
}

export function WorkspaceShell({
  tabs,
  selectedKey,
  onSelect,
  sectionTitle,
  isDark,
  onToggleTheme,
  isLoggedIn,
  userEmail,
  isSyncing,
  reminderEnabled,
  sidebarStats,
  onOpenAccount,
  onOpenAppTools,
  children,
}: {
  tabs: { key: string; label: string; mobileLabel?: string; icon: React.ReactNode }[];
  selectedKey: string;
  onSelect: (key: string) => void;
  sectionTitle: string;
  isDark: boolean;
  onToggleTheme: () => void;
  isLoggedIn: boolean;
  userEmail: string;
  isSyncing: boolean;
  reminderEnabled: boolean;
  sidebarStats: {
    bestScore: number;
    vdot: number;
    completedRuns: number;
    totalRuns: number;
    isDoneToday: boolean;
  };
  onOpenAccount: () => void;
  onOpenAppTools: () => void;
  children: React.ReactNode;
}) {
  const previousTabRef = useRef(selectedKey);

  useEffect(() => {
    if (previousTabRef.current !== selectedKey) {
      previousTabRef.current = selectedKey;
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [selectedKey]);

  return (
    <div className="min-h-dvh w-full bg-[#E5E2D9] dark:bg-[#050507] flex justify-center">
      <div className="w-full max-w-[460px] min-h-dvh flex flex-col bg-[#F3F1EC] dark:bg-[#0A0A0C] text-[#111114] dark:text-[#F5F4EF] sm:border-x sm:border-[#D6D2C7] dark:sm:border-[#26262E] sm:shadow-2xl relative">
        {/* Mobile-Only Compact Top Bar (56px) */}
        <header className="sticky top-0 z-40 bg-[#F3F1EC]/95 dark:bg-[#0A0A0C]/95 backdrop-blur-md border-b border-[#D6D2C7] dark:border-[#26262E] safe-top">
          <div className="px-4 h-14 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onSelect('HOJE')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-[3px] bg-[#EAB308] text-[#0A0A0C] flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="min-w-0 leading-none">
                <span className="font-display text-[17px] font-extrabold uppercase tracking-[0.04em] text-[#111114] dark:text-[#F5F4EF] block leading-none">
                  QG da PRF
                </span>
                <span
                  key={selectedKey}
                  className="animate-tab-label font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[#CA8A04] dark:text-[#EAB308] block mt-0.5 truncate"
                >
                  {sectionTitle}
                </span>
              </div>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <PWAInstallButton compact />
              <button
                type="button"
                onClick={onOpenAppTools}
                aria-label="Lembretes, Offline e Backup"
                className="relative min-w-[40px] min-h-[40px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-white dark:bg-[#121216] flex items-center justify-center text-[#111114] dark:text-[#F5F4EF] cursor-pointer"
              >
                <Bell
                  className={`w-4 h-4 ${
                    reminderEnabled
                      ? 'text-[#15803D] dark:text-[#22C55E]'
                      : 'text-[#47474F] dark:text-[#8A8A96]'
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
                className="min-w-[40px] min-h-[40px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-white dark:bg-[#121216] flex items-center justify-center text-[#111114] dark:text-[#EAB308] cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onOpenAccount}
                title={isLoggedIn && userEmail ? `Conectado: ${userEmail}` : 'Conta e sincronização'}
                aria-label="Conta e sincronização"
                className="min-w-[40px] min-h-[40px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-white dark:bg-[#121216] flex items-center justify-center text-[#111114] dark:text-[#F5F4EF] cursor-pointer"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#EAB308]" />
                ) : isLoggedIn ? (
                  <Cloud className="w-4 h-4 text-[#15803D] dark:text-[#22C55E]" />
                ) : (
                  <User className="w-4 h-4 text-[#47474F] dark:text-[#8A8A96]" />
                )}
              </button>
            </div>
          </div>

          {/* Compact Mobile Telemetry Strip */}
          <div className="border-t border-[#E4E0D7] dark:border-[#1B1B22] bg-[#EAE7DF]/75 dark:bg-[#0E0E12] px-4 h-7 flex items-center justify-between text-[10px] font-mono text-[#6B6B76] dark:text-[#8A8A96] tabular-nums">
            <span>
              TAF{' '}
              <strong className="text-[#111114] dark:text-[#F5F4EF]">
                {sidebarStats.bestScore.toFixed(1)}/25
              </strong>
            </span>
            <span>
              VDOT{' '}
              <strong className="text-[#CA8A04] dark:text-[#EAB308]">{sidebarStats.vdot}</strong>
            </span>
            <span>
              CORRIDA{' '}
              <strong className="text-[#111114] dark:text-[#F5F4EF]">
                {sidebarStats.completedRuns}/{sidebarStats.totalRuns}
              </strong>
            </span>
            <span
              className={
                sidebarStats.isDoneToday
                  ? 'text-[#15803D] dark:text-[#22C55E] font-bold'
                  : 'text-[#6B6B76] dark:text-[#8A8A96]'
              }
            >
              {sidebarStats.isDoneToday ? 'HOJE OK' : 'PENDENTE'}
            </span>
          </div>
        </header>

        {/* Main Mobile Content Stage */}
        <main className="flex-1 w-full px-4 py-4 pb-24">
          <div key={selectedKey} className="animate-tab-enter">
            {children}
          </div>
        </main>

        {/* Fixed Bottom Navigation Dock (64px) */}
        <nav
          aria-label="Navegação inferior"
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[460px] z-40 bg-[#F3F1EC]/95 dark:bg-[#0A0A0C]/95 backdrop-blur-md border-t border-[#D6D2C7] dark:border-[#26262E] safe-bottom"
        >
          <div
            className="grid h-16"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
          >
            {tabs.map((tab) => {
              const active = tab.key === selectedKey;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onSelect(tab.key)}
                  className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] px-1 transition-colors cursor-pointer ${
                    active
                      ? 'text-[#111114] dark:text-[#F5F4EF]'
                      : 'text-[#6B6B76] hover:text-[#111114] dark:text-[#8A8A96] dark:hover:text-[#F5F4EF]'
                  }`}
                >
                  {active && (
                    <span className="absolute top-0 w-9 h-[2px] bg-[#CA8A04] dark:bg-[#EAB308]" />
                  )}
                  <span className={active ? 'text-[#CA8A04] dark:text-[#EAB308]' : ''}>
                    {tab.icon}
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.01em] whitespace-nowrap truncate max-w-full">
                    {tab.mobileLabel ?? tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function TafLineChart({ scores }: { scores: [string, number][] }) {
  if (!scores.length) return null;
  const recent = scores.slice(-10);
  const width = 520;
  const height = 148;
  const padX = 28;
  const padY = 22;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = recent.map(([label, pts], idx) => {
    const x =
      recent.length === 1
        ? width / 2
        : padX + (idx / (recent.length - 1)) * innerW;
    const clamped = Math.max(0, Math.min(25, pts));
    const y = padY + innerH - (clamped / 25) * innerH;
    return { x, y, label: label.slice(0, 5), pts };
  });

  const cutoffY = padY + innerH - (12 / 25) * innerH;
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints =
    points.length > 1
      ? `${points[0].x},${padY + innerH} ${polylinePoints} ${points[points.length - 1].x},${padY + innerH}`
      : '';

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono uppercase tracking-[0.06em] font-semibold text-[#111114] dark:text-[#F5F4EF]">
          Curva de evolução (últimos simulados)
        </span>
        <span className="font-mono text-[#6B6B76] dark:text-[#8A8A96] tabular-nums">
          Corte oficial: 12.0 pts
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 min-w-[300px]"
          role="img"
          aria-label="Gráfico de evolução nos simulados TAF"
        >
          <line
            x1={padX}
            y1={cutoffY}
            x2={width - padX}
            y2={cutoffY}
            stroke="#EAB308"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            opacity="0.85"
          />
          <text
            x={width - padX}
            y={cutoffY - 5}
            textAnchor="end"
            className="fill-[#CA8A04] dark:fill-[#EAB308] font-mono text-[9px] font-semibold"
          >
            12.0
          </text>

          <line
            x1={padX}
            y1={padY + innerH}
            x2={width - padX}
            y2={padY + innerH}
            stroke="var(--chart-grid)"
            strokeWidth="1"
          />

          {areaPoints && <polygon points={areaPoints} fill="var(--chart-area)" opacity="0.12" />}

          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="var(--chart-primary)"
              strokeWidth="2.25"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={polylinePoints}
            />
          )}

          {points.map((p, i) => (
            <g key={`${p.label}-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill={p.pts >= 12 ? '#22C55E' : '#EF4444'}
                stroke="var(--chart-node-stroke)"
                strokeWidth="2"
              />
              <text
                x={p.x}
                y={p.y - 9}
                textAnchor="middle"
                fill="var(--chart-primary)"
                className="font-mono text-[10px] font-bold"
              >
                {p.pts.toFixed(1)}
              </text>
              <text
                x={p.x}
                y={height - 4}
                textAnchor="middle"
                fill="var(--chart-axis)"
                className="font-mono text-[9px]"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function AccountSyncModal({
  authConfig,
  isLoggedIn,
  syncState,
  lastSyncedAt,
  onClose,
  onSignInAndSync,
  onSyncNow,
  onSignOut,
}: {
  authConfig: SupabaseConfig;
  isLoggedIn: boolean;
  syncState: SyncUiState;
  lastSyncedAt: string | null;
  onClose: () => void;
  onSignInAndSync: (email: string, password: string) => void;
  onSyncNow: () => void;
  onSignOut: () => void;
}) {
  const [email, setEmail] = useState(authConfig.userEmail);
  const [password, setPassword] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end justify-center">
      <div className="animate-sheet-up w-full max-w-[460px] bg-white dark:bg-[#121216] border-t sm:border-x border-[#D6D2C7] dark:border-[#26262E] rounded-t-[10px] p-5 space-y-5 safe-bottom max-h-[88dvh] overflow-y-auto shadow-2xl">
        <div className="w-10 h-1 rounded-full bg-[#D6D2C7] dark:bg-[#2E2E38] mx-auto -mt-1 mb-1" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <MetadataLine items={['Nuvem QG da PRF', 'Supabase']} />
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-[0.02em] text-[#111114] dark:text-[#F5F4EF] mt-1">
              Sincronização em Nuvem
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="min-w-[44px] min-h-[44px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-[#F3F1EC] dark:bg-[#1A1A20] flex items-center justify-center text-[#6B6B76] dark:text-[#8A8A96] hover:text-[#111114] dark:hover:text-[#F5F4EF] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {syncState.message && (
          <div
            className={`rounded-[4px] px-4 py-3 text-xs font-medium border ${
              syncState.isError
                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C] dark:bg-[#EF4444]/10 dark:border-[#EF4444]/30 dark:text-[#FCA5A5]'
                : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D] dark:bg-[#22C55E]/10 dark:border-[#22C55E]/30 dark:text-[#86EFAC]'
            }`}
          >
            {syncState.message}
          </div>
        )}

        {isLoggedIn ? (
          <div className="space-y-4">
            <div className="rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] p-4 flex items-center gap-3">
              <Cloud className="w-5 h-5 text-[#15803D] dark:text-[#22C55E] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#111114] dark:text-[#F5F4EF] truncate">
                  {authConfig.userEmail}
                </p>
                <p className="text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96] mt-0.5">
                  {lastSyncedAt ? `Último sync: ${lastSyncedAt}` : 'Conectado ao QG da PRF'}
                </p>
              </div>
            </div>

            <ActionButton
              text={syncState.isSyncing ? 'Sincronizando...' : 'Sincronizar com o QG agora'}
              icon={
                syncState.isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )
              }
              disabled={syncState.isSyncing}
              onClick={onSyncNow}
              className="w-full"
            />

            <button
              type="button"
              onClick={onSignOut}
              className="w-full min-h-[44px] rounded-[4px] text-xs font-semibold text-[#DC2626] dark:text-[#FCA5A5] bg-[#FEF2F2] dark:bg-[#EF4444]/10 border border-[#FECACA] dark:border-[#EF4444]/30 hover:bg-[#FEE2E2] dark:hover:bg-[#EF4444]/20 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair desta conta</span>
            </button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSignInAndSync(email, password);
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block">
                E-mail do QG da PRF
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3.5 text-sm text-[#111114] dark:text-[#F5F4EF] placeholder:text-[#8A8A96] outline-none focus:border-[#EAB308]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3.5 text-sm text-[#111114] dark:text-[#F5F4EF] placeholder:text-[#8A8A96] outline-none focus:border-[#EAB308]"
              />
            </div>

            <button
              type="submit"
              disabled={syncState.isSyncing}
              className="w-full min-h-[46px] rounded-[4px] bg-[#EAB308] hover:bg-[#FACC15] text-[#0A0A0C] font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {syncState.isSyncing && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{syncState.isSyncing ? 'Conectando...' : 'Entrar e Sincronizar'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Cloud, Loader2, LogOut, RefreshCw, User, X } from 'lucide-react';
import type { SyncUiState } from '../data/useTafStore';
import type { SupabaseConfig } from '../domain/types';

export function SectionKicker({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`block text-xs font-medium text-[#8A93A5] ${className}`}>
      {children}
    </span>
  );
}

export function MetadataLine({
  items,
  className = '',
}: {
  items: (string | null | undefined | false)[];
  className?: string;
}) {
  const clean = items.filter((item): item is string => Boolean(item && item.trim()));
  if (!clean.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-[#9CA3B2] ${className}`}>
      {clean.map((item, idx) => (
        <React.Fragment key={`${item}-${idx}`}>
          {idx > 0 && (
            <span aria-hidden="true" className="text-[#525B6B]">
              ·
            </span>
          )}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function EditorialRule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-white/[0.08] ${className}`} />;
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
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}) {
  const styles =
    variant === 'primary'
      ? 'bg-[#F5B700] text-[#090B0E] hover:bg-[#FFCA2C] font-bold'
      : variant === 'secondary'
        ? 'bg-[#1A1E26] text-[#F5F7FA] border border-white/[0.08] hover:bg-[#232833] font-semibold'
        : 'bg-transparent text-[#9CA3B2] hover:text-[#F5F7FA] hover:bg-white/[0.05] font-medium';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full min-h-[48px] px-5 py-3 rounded-xl text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] disabled:opacity-50 cursor-pointer ${styles} ${className}`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

export function MediaBanner({
  src,
  alt,
  children,
  className = '',
}: {
  src: string;
  alt: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12151B] ${className}`}
    >
      {!imgError ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-55"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,183,0,0.16),transparent_60%),linear-gradient(135deg,#12151B_0%,#090B0E_100%)]"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#090B0E] via-[#090B0E]/75 to-[#090B0E]/35"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function PerformanceArcGauge({
  progress,
  valueText,
  unitText,
  label,
  arcColor = '#F5B700',
  size = 152,
  strokeWidth = 9,
  onClick,
}: {
  progress: number;
  valueText: string;
  unitText: string;
  label: string;
  arcColor?: string;
  size?: number;
  strokeWidth?: number;
  onClick?: () => void;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcSpan = circumference * (240 / 360);
  const dashFilled = arcSpan * clamped;

  const content = (
    <>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcSpan} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(150 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dashFilled} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(150 ${cx} ${cy})`}
          className="transition-[stroke-dasharray] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
        <span className="text-[11px] font-medium text-[#8A93A5]">{label}</span>
        <span className="font-display text-4xl font-bold tracking-tight text-[#F5F7FA] leading-none mt-1 tabular-nums">
          {valueText}
        </span>
        <span className="text-xs font-mono text-[#9CA3B2] mt-1 tabular-nums">{unitText}</span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative flex items-center justify-center select-none rounded-2xl hover:bg-white/[0.03] transition-colors cursor-pointer active:scale-[0.98]"
        style={{ width: size, height: size }}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {content}
    </div>
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
    <div className="flex items-center gap-1 p-1 rounded-xl bg-[#12151B] border border-white/[0.08]">
      {options.map((opt) => {
        const active = opt.key === selectedKey;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt.key)}
            className={`flex-1 min-h-[40px] px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer ${
              active
                ? 'bg-[#F5B700] text-[#090B0E]'
                : 'text-[#9CA3B2] hover:text-[#F5F7FA] hover:bg-white/[0.04]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function AppNavigation({
  tabs,
  selectedKey,
  onSelect,
  isLoggedIn,
  userEmail,
  isSyncing,
  onOpenAccount,
}: {
  tabs: { key: string; label: string; icon: React.ReactNode }[];
  selectedKey: string;
  onSelect: (key: string) => void;
  isLoggedIn: boolean;
  userEmail: string;
  isSyncing: boolean;
  onOpenAccount: () => void;
}) {
  return (
    <>
      {/* Desktop Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="hidden lg:block sticky top-0 z-40 bg-[#090B0E]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelect('HOJE')}
            className="font-display text-2xl font-bold tracking-tight text-[#F5F7FA] whitespace-nowrap shrink-0 cursor-pointer"
          >
            QG da PRF
          </button>

          {/* Zone 2: 4 Clean Text Navigation Links */}
          <nav aria-label="Navegação principal" className="flex items-center gap-8">
            {tabs.map((tab) => {
              const active = tab.key === selectedKey;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onSelect(tab.key)}
                  className={`relative h-16 px-1 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active ? 'text-[#F5F7FA]' : 'text-[#8A93A5] hover:text-[#F5F7FA]'
                  }`}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#F5B700] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={onOpenAccount}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#1A1E26] border border-white/[0.08] hover:bg-[#232833] text-xs font-semibold text-[#F5F7FA] inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F5B700]" />
              ) : isLoggedIn ? (
                <Cloud className="w-3.5 h-3.5 text-[#22C55E]" />
              ) : (
                <User className="w-3.5 h-3.5 text-[#9CA3B2]" />
              )}
              <span className="max-w-[160px] truncate">
                {isSyncing ? 'Sincronizando' : isLoggedIn ? userEmail || 'Sincronizado' : 'Conectar QG'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Compact Top Bar (<= 56px) */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#090B0E]/92 backdrop-blur-md border-b border-white/[0.08] safe-top">
        <div className="px-4 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onSelect('HOJE')}
            className="font-display text-xl font-bold tracking-tight text-[#F5F7FA] whitespace-nowrap shrink-0 cursor-pointer"
          >
            QG da PRF
          </button>
          <button
            type="button"
            onClick={onOpenAccount}
            aria-label="Conta e sincronização"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#12151B] border border-white/[0.08] flex items-center justify-center text-[#9CA3B2] hover:text-[#F5F7FA] cursor-pointer"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#F5B700]" />
            ) : isLoggedIn ? (
              <Cloud className="w-4 h-4 text-[#22C55E]" />
            ) : (
              <User className="w-4 h-4 text-[#9CA3B2]" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Fixed Bottom Tab Bar (Thumb Zone Anchor, h-16) */}
      <nav
        aria-label="Navegação inferior"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#090B0E]/95 backdrop-blur-md border-t border-white/[0.08] safe-bottom"
      >
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const active = tab.key === selectedKey;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSelect(tab.key)}
                className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors cursor-pointer ${
                  active ? 'text-[#F5B700]' : 'text-[#8A93A5] hover:text-[#F5F7FA]'
                }`}
              >
                {active && (
                  <span className="absolute top-0 w-8 h-0.5 bg-[#F5B700] rounded-full" />
                )}
                {tab.icon}
                <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function TafEvolutionChart({ scores }: { scores: [string, number][] }) {
  if (!scores.length) return null;
  const recent = scores.slice(-8);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#F5F7FA]">Evolução nos simulados</h3>
        <span className="text-xs font-mono text-[#8A93A5] tabular-nums">Corte 12.0 pts</span>
      </div>
      <div className="relative h-36 flex items-end gap-2.5 pt-6">
        <div
          className="absolute inset-x-0 border-t border-dashed border-[#F5B700]/45 pointer-events-none"
          style={{ bottom: `${(12 / 25) * 100}%` }}
        />
        {recent.map(([dateLabel, pts], i) => {
          const pct = Math.max(10, Math.min(100, (pts / 25) * 100));
          const pass = pts >= 12;
          return (
            <div
              key={`${dateLabel}_${i}`}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
            >
              <span className="text-[11px] font-mono font-bold text-[#F5F7FA] tabular-nums">
                {pts.toFixed(1)}
              </span>
              <div className="w-full max-w-[32px] rounded-t-lg bg-[#1A1E26] flex items-end overflow-hidden h-20">
                <div
                  className="w-full rounded-t-lg transition-all duration-300"
                  style={{
                    height: `${pct}%`,
                    backgroundColor: pass ? '#22C55E' : '#EF4444',
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-[#8A93A5] truncate max-w-full tabular-nums">
                {dateLabel.slice(0, 5)}
              </span>
            </div>
          );
        })}
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
  onSignInAndSync: (url: string, key: string, email: string, password: string) => void;
  onSyncNow: () => void;
  onSignOut: () => void;
}) {
  const [url, setUrl] = useState(authConfig.supabaseUrl);
  const [anonKey, setAnonKey] = useState(authConfig.supabaseAnonKey);
  const [email, setEmail] = useState(authConfig.userEmail);
  const [password, setPassword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(
    !authConfig.supabaseUrl || !authConfig.supabaseAnonKey
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#12151B] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-5 safe-bottom max-h-[90dvh] overflow-y-auto">
        <div className="sm:hidden w-10 h-1.5 rounded-full bg-white/15 mx-auto -mt-1 mb-2" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <SectionKicker>Nuvem do QG da PRF</SectionKicker>
            <h2 className="font-display text-2xl font-bold text-[#F5F7FA] mt-0.5">
              Sincronização Supabase
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#1A1E26] border border-white/[0.08] flex items-center justify-center text-[#9CA3B2] hover:text-[#F5F7FA] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {syncState.message && (
          <div
            className={`rounded-xl px-4 py-3 text-xs font-medium border ${
              syncState.isError
                ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#FCA5A5]'
                : 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#86EFAC]'
            }`}
          >
            {syncState.message}
          </div>
        )}

        {isLoggedIn ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#1A1E26] border border-white/[0.08] p-4 flex items-center gap-3">
              <Cloud className="w-5 h-5 text-[#22C55E] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#F5F7FA] truncate">
                  {authConfig.userEmail}
                </p>
                <p className="text-xs text-[#9CA3B2] mt-0.5">
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
            />

            <button
              type="button"
              onClick={onSignOut}
              className="w-full min-h-[44px] rounded-xl text-xs font-semibold text-[#FCA5A5] bg-[#EF4444]/10 border border-[#EF4444]/25 hover:bg-[#EF4444]/15 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
              onSignInAndSync(url, anonKey, email, password);
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9CA3B2] block">E-mail do QG da PRF</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-12 rounded-xl bg-[#090B0E] border border-white/[0.1] px-4 text-sm text-[#F5F7FA] placeholder:text-[#525B6B] outline-none focus:border-[#F5B700]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9CA3B2] block">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 rounded-xl bg-[#090B0E] border border-white/[0.1] px-4 text-sm text-[#F5F7FA] placeholder:text-[#525B6B] outline-none focus:border-[#F5B700]"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-xs font-medium text-[#8A93A5] hover:text-[#F5F7FA] py-1 cursor-pointer"
            >
              {showAdvanced ? 'Ocultar URL e Anon Key' : 'Configurar URL e Anon Key'}
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-1">
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xxxx.supabase.co"
                  className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3.5 text-xs font-mono text-[#F5F7FA] placeholder:text-[#525B6B] outline-none focus:border-[#F5B700]"
                />
                <input
                  type="text"
                  required
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="Supabase Anon Key"
                  className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3.5 text-xs font-mono text-[#F5F7FA] placeholder:text-[#525B6B] outline-none focus:border-[#F5B700]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={syncState.isSyncing}
              className="w-full min-h-[48px] rounded-xl bg-[#F5B700] hover:bg-[#FFCA2C] text-[#090B0E] font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
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

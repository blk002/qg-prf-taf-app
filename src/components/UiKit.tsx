import React, { useState } from 'react';
import { Cloud, Loader2, LogOut, RefreshCw, X } from 'lucide-react';
import type { SyncUiState } from '../data/useTafStore';
import type { SupabaseConfig } from '../domain/types';

export function MicroKicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] font-bold tracking-[0.14em] uppercase text-[#6D6D76]">
      {children}
    </span>
  );
}

export function EditorialRule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-[#232329] ${className}`} />;
}

export function StatusDotPill({ text, color }: { text: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1C1C21] border border-[#232329] text-[10px] font-bold tracking-[0.08em] uppercase text-[#A4A4AE]">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {text}
    </span>
  );
}

export function MonochromePillButton({
  text,
  icon,
  onClick,
  disabled = false,
  variant = 'primary',
}: {
  text: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const base =
    variant === 'primary'
      ? 'bg-white text-black hover:bg-[#E5E5EA]'
      : 'bg-[#1C1C21] text-white border border-[#232329] hover:bg-[#232329]';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full h-12 rounded-full font-bold text-sm tracking-tight inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer ${base}`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

export function WhoopArcGauge({
  progress,
  valueText,
  unitText,
  label,
  arcColor = '#00F19F',
  size = 148,
  strokeWidth = 10,
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
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcSpan = circumference * (240 / 360);
  const dashFilled = arcSpan * clamped;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center select-none ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : 'cursor-default'}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#1C1C21"
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
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
        <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#6D6D76]">
          {label}
        </span>
        <span className="font-mono text-3xl font-extrabold tracking-tight text-white leading-none mt-1">
          {valueText}
        </span>
        <span className="text-[11px] font-medium text-[#A4A4AE] mt-1">{unitText}</span>
      </div>
    </button>
  );
}

export function EditorialTabRow({
  options,
  selectedKey,
  onSelect,
}: {
  options: { key: string; label: string }[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-[#101012] border border-[#232329]">
      {options.map((opt) => {
        const active = opt.key === selectedKey;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt.key)}
            className={`flex-1 h-9 rounded-full text-xs font-bold transition-all cursor-pointer ${
              active ? 'bg-white text-black shadow-sm' : 'text-[#A4A4AE] hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function FloatingCapsuleDock({
  tabs,
  selectedKey,
  onSelect,
}: {
  tabs: { key: string; label: string; icon: React.ReactNode }[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-32px)] max-w-[400px] safe-bottom">
      <nav
        aria-label="Navegação principal"
        className="flex items-center justify-between gap-1 p-1.5 rounded-full bg-[#101012]/95 backdrop-blur-md border border-[#232329] shadow-[0_12px_36px_rgba(0,0,0,0.8)]"
      >
        {tabs.map((tab) => {
          const active = tab.key === selectedKey;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelect(tab.key)}
              className={`flex-1 h-11 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                active ? 'bg-white text-black' : 'text-[#A4A4AE] hover:text-white'
              }`}
            >
              {tab.icon}
              {active && <span>{tab.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function TafEvolutionChart({ scores }: { scores: [string, number][] }) {
  if (!scores.length) return null;
  const recent = scores.slice(-8);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <MicroKicker>EVOLUÇÃO NOS SIMULADOS</MicroKicker>
        <span className="text-[11px] font-mono text-[#6D6D76]">Corte 12.0 pts</span>
      </div>
      <div className="relative h-28 flex items-end gap-2 pt-4">
        <div
          className="absolute inset-x-0 border-t border-dashed border-[#FFBE2E]/40 pointer-events-none"
          style={{ bottom: `${(12 / 25) * 100}%` }}
        />
        {recent.map(([dateLabel, pts], i) => {
          const pct = Math.max(8, Math.min(100, (pts / 25) * 100));
          const color = pts >= 12 ? '#00F19F' : '#FF4D57';
          return (
            <div key={`${dateLabel}_${i}`} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[10px] font-mono font-bold text-[#A4A4AE]">
                {pts.toFixed(1)}
              </span>
              <div className="w-full max-w-[26px] rounded-t-md bg-[#1C1C21] flex items-end overflow-hidden h-16">
                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{ height: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-[9px] font-mono text-[#6D6D76] truncate max-w-full">
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
  const [showAdvanced, setShowAdvanced] = useState(!authConfig.supabaseUrl || !authConfig.supabaseAnonKey);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#101012] border border-[#232329] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 safe-bottom max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <MicroKicker>NUVEM DO QG DA PRF</MicroKicker>
            <h2 className="text-lg font-bold text-white mt-0.5">Sincronização Supabase</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#1C1C21] border border-[#232329] flex items-center justify-center text-[#A4A4AE] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {syncState.message && (
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-xs border ${
              syncState.isError
                ? 'bg-[#FF4D57]/10 border-[#FF4D57]/30 text-[#FF4D57]'
                : 'bg-[#00F19F]/10 border-[#00F19F]/30 text-[#00F19F]'
            }`}
          >
            {syncState.message}
          </div>
        )}

        {isLoggedIn ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#1C1C21] border border-[#232329] p-4 flex items-center gap-3">
              <Cloud className="w-5 h-5 text-[#00F19F] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{authConfig.userEmail}</p>
                <p className="text-[11px] text-[#A4A4AE]">
                  {lastSyncedAt ? `Último sync: ${lastSyncedAt}` : 'Conectado ao QG da PRF'}
                </p>
              </div>
            </div>

            <MonochromePillButton
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
              className="w-full h-10 rounded-full text-xs font-semibold text-[#FF4D57] bg-[#FF4D57]/10 border border-[#FF4D57]/25 inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair desta conta
            </button>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              onSignInAndSync(url, anonKey, email, password);
            }}
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#A4A4AE]">E-mail do QG da PRF</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-11 rounded-xl bg-black border border-[#232329] px-3.5 text-sm text-white outline-none focus:border-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#A4A4AE]">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl bg-black border border-[#232329] px-3.5 text-sm text-white outline-none focus:border-white"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-[11px] font-semibold text-[#6D6D76] hover:text-white cursor-pointer"
            >
              {showAdvanced ? '▾ Ocultar URL / Anon Key' : '▸ Configurar URL / Anon Key'}
            </button>

            {showAdvanced && (
              <div className="space-y-2.5 pt-1">
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xxxx.supabase.co"
                  className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-xs text-white outline-none focus:border-white"
                />
                <input
                  type="text"
                  required
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="Supabase Anon Key"
                  className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-xs text-white outline-none focus:border-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={syncState.isSyncing}
              className="w-full h-12 rounded-full bg-white text-black font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  defaultJackDanielsWorkouts,
  estimateRunDurationMinutes,
} from '../domain/jackDanielsPlan';
import { buildSimulado } from '../domain/prfTafScoring';
import { parseRunWorkoutSteps } from '../domain/runStepParser';
import { defaultPrfTemplates } from '../domain/strengthModels';
import { strengthProgressionTip } from '../domain/tafCoachEngine';
import type {
  ExerciseLog,
  ReadinessLevel,
  RemoteTafAppData,
  RoutineTrainingBlock,
  RunStatus,
  RunStep,
  RunWorkout,
  StrengthSession,
  SupabaseConfig,
  TafAppState,
  TafSimulado,
  WeeklySplitPreset,
  WorkoutTemplate,
} from '../domain/types';
import { calculateVdot, pacesForVdot } from '../domain/vdotCalculator';
import {
  buildPlannedRoutineBlocks,
  buildWeeklyPlan,
  formatLocalIsoDate,
} from '../domain/weeklyPlannerEngine';
import {
  normalizeSupabaseUrl,
  pullTafPayload,
  pushTafPayload,
  refreshSupabaseSession,
  signInSupabase,
  SupabaseSyncError,
  type RemoteTafPayload,
} from './supabaseSync';
import { notifyStepAlert, speakPtBr, stopSpeaking } from './voiceCoach';

const STATE_STORAGE_KEY = 'qg_prf_taf_state_v1';
const AUTH_STORAGE_KEY = 'qg_prf_taf_auth_v1';

const ENV_SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const ENV_SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export interface SyncUiState {
  isSyncing: boolean;
  message: string | null;
  isError: boolean;
}

export interface ActiveSetDraft {
  setNumber: number;
  weightKgText: string;
  repsText: string;
  previousSummary: string;
  completed: boolean;
}

export interface ActiveExerciseDraft {
  exerciseId: string;
  exerciseName: string;
  isTimed: boolean;
  restSeconds: number;
  cue: string;
  progressionTip: string;
  sets: ActiveSetDraft[];
}

export interface ActiveWorkoutState {
  template: WorkoutTemplate;
  elapsedSeconds: number;
  exercises: ActiveExerciseDraft[];
  restRemainingSeconds: number;
  restTotalSeconds: number;
  isRestRunning: boolean;
}

export interface GuidedRunState {
  workout: RunWorkout;
  steps: RunStep[];
  currentStepIndex: number;
  stepRemainingSeconds: number;
  totalElapsedSeconds: number;
  isRunning: boolean;
  voiceEnabled: boolean;
  completedStepCount: number;
}

function defaultState(): TafAppState {
  return {
    vdot: 34,
    vdotHistory: [],
    runWorkouts: defaultJackDanielsWorkouts(),
    strengthTemplates: defaultPrfTemplates(),
    strengthHistory: [],
    tafHistory: [],
    tafTrainingStatus: { lastDoneDate: null },
    routineBlocks: [],
    weeklySplitPreset: 'SEG_QUA_SEX',
    preferredTrainingStartMin: 390,
    todayReadiness: 'NORMAL',
    todayReadinessDate: null,
    deletedTafIds: [],
    lastSyncedAt: null,
  };
}

function loadSavedState(): TafAppState {
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<TafAppState>;
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      runWorkouts:
        Array.isArray(parsed.runWorkouts) && parsed.runWorkouts.length > 0
          ? parsed.runWorkouts
          : base.runWorkouts,
      strengthTemplates:
        Array.isArray(parsed.strengthTemplates) && parsed.strengthTemplates.length > 0
          ? parsed.strengthTemplates
          : base.strengthTemplates,
      strengthHistory: Array.isArray(parsed.strengthHistory) ? parsed.strengthHistory : [],
      tafHistory: Array.isArray(parsed.tafHistory) ? parsed.tafHistory : [],
      vdotHistory: Array.isArray(parsed.vdotHistory) ? parsed.vdotHistory : [],
      routineBlocks: Array.isArray(parsed.routineBlocks) ? parsed.routineBlocks : [],
      deletedTafIds: Array.isArray(parsed.deletedTafIds) ? parsed.deletedTafIds : [],
    };
  } catch {
    return defaultState();
  }
}

function loadSavedAuth(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<SupabaseConfig>) : {};
    return {
      supabaseUrl: ENV_SUPABASE_URL || parsed.supabaseUrl || '',
      supabaseAnonKey: ENV_SUPABASE_ANON_KEY || parsed.supabaseAnonKey || '',
      userEmail: parsed.userEmail || '',
      accessToken: parsed.accessToken || '',
      refreshToken: parsed.refreshToken || '',
    };
  } catch {
    return {
      supabaseUrl: ENV_SUPABASE_URL,
      supabaseAnonKey: ENV_SUPABASE_ANON_KEY,
      userEmail: '',
      accessToken: '',
      refreshToken: '',
    };
  }
}

function weekdayKey(d: Date): string {
  const keys = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  return keys[d.getDay()] ?? 'seg';
}

function formatBrDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatWeight(kg: number): string {
  return kg % 1 === 0 ? String(Math.round(kg)) : String(kg);
}

function effectiveRoutineBlocksForSync(st: TafAppState): RoutineTrainingBlock[] {
  const completed = st.routineBlocks.filter((b) => !b.isPlanned).slice(0, 45);
  const planned = buildPlannedRoutineBlocks(
    st.weeklySplitPreset,
    st.runWorkouts,
    st.tafHistory,
    st.strengthTemplates,
    st.preferredTrainingStartMin,
    completed
  );
  return [...completed, ...planned].slice(0, 60);
}

function mergeRemoteAndLocal(
  local: TafAppState,
  remote: RemoteTafPayload,
  preferLocal = false
): TafAppState {
  const deletedSet = new Set([
    ...local.deletedTafIds,
    ...(remote.tafAppData.deletedTafIds ?? []),
  ]);

  const simMap = new Map<number, TafSimulado>();
  remote.tafHistory.filter((s) => !deletedSet.has(s.id)).forEach((s) => simMap.set(s.id, s));
  local.tafHistory.filter((s) => !deletedSet.has(s.id)).forEach((s) => simMap.set(s.id, s));
  const mergedTafHistory = Array.from(simMap.values()).sort((a, b) => a.id - b.id);

  const localDone = local.tafTrainingStatus.lastDoneDate;
  const remoteDone = remote.tafTrainingStatus.lastDoneDate;
  const mergedLastDone = preferLocal
    ? localDone
    : [localDone, remoteDone].filter((d): d is string => Boolean(d)).sort().pop() ?? null;

  const baseRuns = local.runWorkouts.length > 0 ? local.runWorkouts : defaultJackDanielsWorkouts();
  const remoteRunsById = new Map((remote.tafAppData.runWorkouts ?? []).map((r) => [r.id, r]));
  const mergedRuns = preferLocal
    ? baseRuns
    : baseRuns.map((localRun) => {
        const remoteRun = remoteRunsById.get(localRun.id);
        if (!remoteRun) return localRun;
        if (localRun.status === 'PENDENTE' && remoteRun.status !== 'PENDENTE') return remoteRun;
        if (!localRun.notes.trim() && remoteRun.notes.trim())
          return { ...localRun, notes: remoteRun.notes };
        return localRun;
      });

  const strengthMap = new Map<number, StrengthSession>();
  (remote.tafAppData.strengthHistory ?? []).forEach((s) => strengthMap.set(s.id, s));
  local.strengthHistory.forEach((s) => strengthMap.set(s.id, s));
  const mergedStrength = Array.from(strengthMap.values()).sort((a, b) => b.id - a.id);

  const mergedVdot =
    local.vdot === 34 && (remote.tafAppData.vdot ?? 34) !== 34
      ? (remote.tafAppData.vdot ?? 34)
      : local.vdot;

  const mergedTemplates =
    local.strengthTemplates.length > 0
      ? local.strengthTemplates
      : remote.tafAppData.strengthTemplates && remote.tafAppData.strengthTemplates.length > 0
        ? remote.tafAppData.strengthTemplates
        : defaultPrfTemplates();

  const mergedSplit =
    local.lastSyncedAt === null &&
    local.weeklySplitPreset === 'SEG_QUA_SEX' &&
    remote.tafAppData.weeklySplitPreset
      ? remote.tafAppData.weeklySplitPreset
      : local.weeklySplitPreset;

  const mergedStartMin =
    local.lastSyncedAt === null &&
    local.preferredTrainingStartMin === 390 &&
    remote.tafAppData.preferredTrainingStartMin != null
      ? remote.tafAppData.preferredTrainingStartMin
      : local.preferredTrainingStartMin;

  const completedRunIds = new Set(
    mergedRuns
      .filter((r) => r.status === 'FEITO' || r.status === 'PARCIAL')
      .map((r) => `taf_run_${r.id}`)
  );

  const isValidCompletedBlock = (b: RoutineTrainingBlock) => {
    if (b.isPlanned) return false;
    if (b.id.startsWith('taf_run_') && !completedRunIds.has(b.id)) return false;
    return true;
  };

  const routineMap = new Map<string, RoutineTrainingBlock>();
  (remote.tafAppData.routineBlocks ?? [])
    .filter(isValidCompletedBlock)
    .forEach((b) => routineMap.set(b.id, b));
  local.routineBlocks
    .filter(isValidCompletedBlock)
    .forEach((b) => routineMap.set(b.id, b));
  const mergedRoutineBlocks = Array.from(routineMap.values())
    .sort((a, b) =>
      `${b.dateIso}_${String(b.startMin).padStart(4, '0')}`.localeCompare(
        `${a.dateIso}_${String(a.startMin).padStart(4, '0')}`
      )
    )
    .slice(0, 45);

  return {
    ...local,
    vdot: mergedVdot,
    runWorkouts: mergedRuns,
    strengthTemplates: mergedTemplates,
    strengthHistory: mergedStrength,
    tafHistory: mergedTafHistory,
    tafTrainingStatus: { lastDoneDate: mergedLastDone },
    routineBlocks: mergedRoutineBlocks,
    weeklySplitPreset: mergedSplit,
    preferredTrainingStartMin: mergedStartMin,
    deletedTafIds: Array.from(deletedSet),
  };
}

export function useTafStore() {
  const [state, setState] = useState<TafAppState>(() => loadSavedState());
  const [authConfig, setAuthConfig] = useState<SupabaseConfig>(() => loadSavedAuth());
  const [syncState, setSyncState] = useState<SyncUiState>({
    isSyncing: false,
    message: null,
    isError: false,
  });
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutState | null>(null);
  const [activeGuidedRun, setActiveGuidedRun] = useState<GuidedRunState | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const authRef = useRef(authConfig);
  authRef.current = authConfig;
  const syncingRef = useRef(false);
  const autoSyncTimerRef = useRef<number | null>(null);

  const mutateAndSave = useCallback((updater: (prev: TafAppState) => TafAppState) => {
    setState((prev) => {
      const next = updater(prev);
      stateRef.current = next;
      try {
        localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  const saveAuth = useCallback((nextAuth: SupabaseConfig) => {
    authRef.current = nextAuth;
    setAuthConfig(nextAuth);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
    } catch {
      // Ignore
    }
  }, []);

  const performSync = useCallback(
    async (initialConfig: SupabaseConfig, silent = false, preferLocal = false) => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      setSyncState((prev) =>
        silent
          ? { ...prev, isSyncing: true }
          : { isSyncing: true, message: 'Sincronizando dados do TAF...', isError: false }
      );

      let activeConfig = initialConfig;
      try {
        let remote: RemoteTafPayload;
        try {
          remote = await pullTafPayload(
            activeConfig.supabaseUrl,
            activeConfig.supabaseAnonKey,
            activeConfig.accessToken
          );
        } catch (err) {
          if (err instanceof SupabaseSyncError && err.statusCode === 401 && activeConfig.refreshToken) {
            const refreshed = await refreshSupabaseSession(
              activeConfig.supabaseUrl,
              activeConfig.supabaseAnonKey,
              activeConfig.refreshToken,
              activeConfig.userEmail
            );
            activeConfig = {
              ...activeConfig,
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              userEmail: refreshed.email,
            };
            saveAuth(activeConfig);
            remote = await pullTafPayload(
              activeConfig.supabaseUrl,
              activeConfig.supabaseAnonKey,
              activeConfig.accessToken
            );
          } else {
            throw err;
          }
        }

        const merged = mergeRemoteAndLocal(stateRef.current, remote, preferLocal);
        const blocksToPush = effectiveRoutineBlocksForSync(merged);
        const appDataToPush: RemoteTafAppData = {
          vdot: merged.vdot,
          runWorkouts: merged.runWorkouts,
          strengthTemplates: merged.strengthTemplates,
          strengthHistory: merged.strengthHistory,
          routineBlocks: blocksToPush,
          weeklySplitPreset: merged.weeklySplitPreset,
          preferredTrainingStartMin: merged.preferredTrainingStartMin,
          deletedTafIds: merged.deletedTafIds,
        };

        const serverTime = await pushTafPayload(
          activeConfig.supabaseUrl,
          activeConfig.supabaseAnonKey,
          activeConfig.accessToken,
          merged.tafHistory,
          merged.tafTrainingStatus,
          appDataToPush
        );

        const now = new Date();
        const nowLabel = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        mutateAndSave(() => ({
          ...merged,
          lastSyncedAt: serverTime ?? nowLabel,
        }));

        setSyncState({
          isSyncing: false,
          message: `Sincronizado com o QG em ${nowLabel} (${blocksToPush.length} blocos na Rotina · ${merged.tafHistory.length} simulados).`,
          isError: false,
        });
      } catch (err) {
        if (silent) {
          setSyncState((prev) => ({ ...prev, isSyncing: false }));
        } else {
          setSyncState({
            isSyncing: false,
            message: err instanceof Error ? err.message : 'Erro ao sincronizar com o Supabase.',
            isError: true,
          });
        }
      } finally {
        syncingRef.current = false;
      }
    },
    [mutateAndSave, saveAuth]
  );

  const triggerAutoSync = useCallback(
    (delayMs = 1200, preferLocal = true) => {
      const cfg = authRef.current;
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !cfg.accessToken) return;
      if (autoSyncTimerRef.current !== null) {
        window.clearTimeout(autoSyncTimerRef.current);
      }
      autoSyncTimerRef.current = window.setTimeout(() => {
        const latestCfg = authRef.current;
        if (latestCfg.accessToken && !syncingRef.current) {
          void performSync(latestCfg, true, preferLocal);
        }
      }, delayMs);
    },
    [performSync]
  );

  useEffect(() => {
    const cfg = authRef.current;
    if (cfg.supabaseUrl && cfg.supabaseAnonKey && cfg.accessToken) {
      triggerAutoSync(800, false);
    }
    return () => {
      if (autoSyncTimerRef.current !== null) window.clearTimeout(autoSyncTimerRef.current);
    };
  }, [triggerAutoSync]);

  // Active workout timer loop
  useEffect(() => {
    if (!activeWorkout) return;
    const id = window.setInterval(() => {
      let restDone = false;
      setActiveWorkout((prev) => {
        if (!prev) return null;
        const nextRest =
          prev.isRestRunning && prev.restRemainingSeconds > 0
            ? prev.restRemainingSeconds - 1
            : prev.restRemainingSeconds;
        const stillRunning = prev.isRestRunning && nextRest > 0;
        if (prev.isRestRunning && nextRest === 0) restDone = true;
        return {
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
          restRemainingSeconds: nextRest,
          isRestRunning: stillRunning,
        };
      });
      if (restDone) notifyStepAlert();
    }, 1000);
    return () => window.clearInterval(id);
  }, [Boolean(activeWorkout)]);

  // Guided run coach loop
  useEffect(() => {
    if (!activeGuidedRun) return;
    const id = window.setInterval(() => {
      let announcement: string | null = null;
      let shouldAlert = false;
      setActiveGuidedRun((prev) => {
        if (!prev || !prev.isRunning) return prev;
        const nextElapsed = prev.totalElapsedSeconds + 1;
        const nextRem = prev.stepRemainingSeconds - 1;

        if (nextRem === 10 && prev.voiceEnabled) {
          announcement = 'Dez segundos';
        }
        if (nextRem <= 0) {
          shouldAlert = true;
          const nextIdx = prev.currentStepIndex + 1;
          if (nextIdx < prev.steps.length) {
            const nextStep = prev.steps[nextIdx];
            if (prev.voiceEnabled) announcement = `${nextStep.title}. ${nextStep.targetLabel}`;
            return {
              ...prev,
              currentStepIndex: nextIdx,
              stepRemainingSeconds: nextStep.durationSeconds,
              totalElapsedSeconds: nextElapsed,
              completedStepCount: Math.max(prev.completedStepCount, nextIdx),
            };
          }
          if (prev.voiceEnabled) announcement = 'Treino concluído! Excelente trabalho.';
          return {
            ...prev,
            stepRemainingSeconds: 0,
            totalElapsedSeconds: nextElapsed,
            isRunning: false,
            completedStepCount: prev.steps.length,
          };
        }
        return {
          ...prev,
          stepRemainingSeconds: nextRem,
          totalElapsedSeconds: nextElapsed,
        };
      });
      if (shouldAlert) notifyStepAlert();
      if (announcement) speakPtBr(announcement);
    }, 1000);
    return () => window.clearInterval(id);
  }, [Boolean(activeGuidedRun)]);

  const todayIso = formatLocalIsoDate(new Date());
  const todayBr = formatBrDate(new Date());
  const todayDayKey = weekdayKey(new Date());
  const effectiveTodayReadiness: ReadinessLevel =
    state.todayReadinessDate === todayIso ? state.todayReadiness : 'NORMAL';

  const weeklyPlan = useMemo(
    () =>
      buildWeeklyPlan(
        state.weeklySplitPreset,
        state.runWorkouts,
        state.tafHistory,
        state.strengthTemplates
      ),
    [state.weeklySplitPreset, state.runWorkouts, state.tafHistory, state.strengthTemplates, todayIso]
  );

  const todaySlot = weeklyPlan.find((s) => s.dayKey === todayDayKey);
  const todayLinkedRun = todaySlot?.linkedRunId
    ? state.runWorkouts.find((r) => r.id === todaySlot.linkedRunId) ?? null
    : null;
  const isDoneToday = todayLinkedRun
    ? todayLinkedRun.status === 'FEITO' || todayLinkedRun.status === 'PARCIAL'
    : state.tafTrainingStatus.lastDoneDate === todayIso;

  const nextPendingRun = useMemo(
    () => state.runWorkouts.find((r) => r.status === 'PENDENTE') ?? null,
    [state.runWorkouts]
  );

  const setTodayReadiness = useCallback(
    (level: ReadinessLevel) => {
      const today = formatLocalIsoDate(new Date());
      mutateAndSave((prev) => ({ ...prev, todayReadiness: level, todayReadinessDate: today }));
    },
    [mutateAndSave]
  );

  const setWeeklySplitPreset = useCallback(
    (preset: WeeklySplitPreset) => {
      mutateAndSave((prev) => ({ ...prev, weeklySplitPreset: preset }));
      triggerAutoSync();
    },
    [mutateAndSave, triggerAutoSync]
  );

  const setPreferredTrainingStartMin = useCallback(
    (startMin: number) => {
      const clamped = Math.min(1320, Math.max(300, startMin));
      mutateAndSave((prev) => ({ ...prev, preferredTrainingStartMin: clamped }));
      triggerAutoSync();
    },
    [mutateAndSave, triggerAutoSync]
  );

  const toggleTodayTafDone = useCallback(() => {
    const now = new Date();
    const today = formatLocalIsoDate(now);
    const dayKey = weekdayKey(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();

    mutateAndSave((prev) => {
      const planNow = buildWeeklyPlan(
        prev.weeklySplitPreset,
        prev.runWorkouts,
        prev.tafHistory,
        prev.strengthTemplates,
        now
      );
      const todaySlot = planNow.find((s) => s.dayKey === dayKey);
      const todayRunId = todaySlot?.linkedRunId ?? null;
      const todayRun = todayRunId ? prev.runWorkouts.find((r) => r.id === todayRunId) ?? null : null;

      const isCurrentlyDone = todayRun
        ? todayRun.status === 'FEITO' || todayRun.status === 'PARCIAL'
        : prev.tafTrainingStatus.lastDoneDate === today;

      let nextRuns = prev.runWorkouts;
      let nextBlocks = prev.routineBlocks;

      if (todayRun) {
        if (!isCurrentlyDone) {
          const dur = Math.min(
            240,
            Math.max(15, todayRun.durationMin ?? estimateRunDurationMinutes(todayRun.prescription))
          );
          const endMin = Math.min(1440, Math.max(dur, nowMin));
          const startMin = todayRun.startMin ?? Math.max(0, endMin - dur);
          const newBlock: RoutineTrainingBlock = {
            id: `taf_run_${todayRun.id}`,
            dayKey,
            dateIso: today,
            label: `Corrida Sem ${todayRun.week} · ${todayRun.code}`,
            startMin,
            endMin: Math.min(1440, startMin + dur),
            durationMin: dur,
            note: `${dur} min · ${todayRun.prescription.slice(0, 60)} (App TAF)`,
            category: 'training',
            source: 'taf_app',
            isPlanned: false,
          };
          nextRuns = prev.runWorkouts.map((r) =>
            r.id === todayRun.id
              ? { ...r, status: 'FEITO', completedDate: today, durationMin: dur, startMin }
              : r
          );
          nextBlocks = [
            newBlock,
            ...prev.routineBlocks.filter((b) => b.id !== newBlock.id),
          ].slice(0, 60);
        } else if (todayRun.completedDate === today) {
          nextRuns = prev.runWorkouts.map((r) =>
            r.id === todayRun.id
              ? { ...r, status: 'PENDENTE', completedDate: null, durationMin: null, startMin: null }
              : r
          );
          nextBlocks = prev.routineBlocks.filter((b) => b.id !== `taf_run_${todayRun.id}`);
        }
      }

      return {
        ...prev,
        runWorkouts: nextRuns,
        routineBlocks: nextBlocks,
        tafTrainingStatus: {
          lastDoneDate: isCurrentlyDone ? null : today,
        },
      };
    });
    triggerAutoSync();
  }, [mutateAndSave, triggerAutoSync]);

  const updateRunWorkout = useCallback(
    (
      workoutId: string,
      newStatus: RunStatus,
      notes: string,
      durationMin?: number,
      completedDateIso?: string
    ) => {
      const now = new Date();
      const today = formatLocalIsoDate(now);
      const dayKey = weekdayKey(now);
      const nowMin = now.getHours() * 60 + now.getMinutes();

      const parseLocalIsoDate = (iso: string | undefined): Date | null => {
        if (!iso) return null;
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
        if (!match) return null;
        const y = Number(match[1]);
        const m = Number(match[2]);
        const d = Number(match[3]);
        const dt = new Date(y, m - 1, d);
        if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
        return dt;
      };

      mutateAndSave((prev) => {
        const previousRun = prev.runWorkouts.find((item) => item.id === workoutId) ?? null;
        const isCompleted = newStatus === 'FEITO' || newStatus === 'PARCIAL';
        const parsedCustom = parseLocalIsoDate(completedDateIso);
        const resolvedDate: string | null = isCompleted
          ? parsedCustom
            ? completedDateIso!.trim()
            : previousRun?.completedDate ?? today
          : null;
        let updatedBlock: RoutineTrainingBlock | null = null;

        const nextRuns = prev.runWorkouts.map((item) => {
          if (item.id !== workoutId) return item;
          if (isCompleted && resolvedDate) {
            const parsedDate = parseLocalIsoDate(resolvedDate);
            const blockDayKey = parsedDate ? weekdayKey(parsedDate) : dayKey;
            const dur = Math.min(
              240,
              Math.max(15, durationMin ?? item.durationMin ?? estimateRunDurationMinutes(item.prescription))
            );
            const endMin = Math.min(1440, Math.max(dur, nowMin));
            const startMin = item.startMin ?? Math.max(0, endMin - dur);
            updatedBlock = {
              id: `taf_run_${item.id}`,
              dayKey: blockDayKey,
              dateIso: resolvedDate,
              label: `Corrida Sem ${item.week} · ${item.code}`,
              startMin,
              endMin: Math.min(1440, startMin + dur),
              durationMin: dur,
              note: `${dur} min · ${item.prescription.slice(0, 60)} (App TAF)`,
              category: 'training',
              source: 'taf_app',
              isPlanned: false,
            };
            return {
              ...item,
              status: newStatus,
              notes: notes.trim(),
              completedDate: resolvedDate,
              durationMin: dur,
              startMin,
            };
          }
          return {
            ...item,
            status: newStatus,
            notes: notes.trim(),
            completedDate: null,
            durationMin: null,
            startMin: null,
          };
        });

        const blockId = `taf_run_${workoutId}`;
        const baseBlocks = prev.routineBlocks.filter((b) => b.id !== blockId);
        const nextBlocks = updatedBlock ? [updatedBlock, ...baseBlocks].slice(0, 60) : baseBlocks;

        let nextLastDoneDate = prev.tafTrainingStatus.lastDoneDate;
        if (isCompleted && resolvedDate === today) {
          nextLastDoneDate = today;
        } else if (prev.tafTrainingStatus.lastDoneDate === today) {
          const hasOtherCompletedToday =
            nextRuns.some(
              (r) => (r.status === 'FEITO' || r.status === 'PARCIAL') && r.completedDate === today
            ) || prev.strengthHistory.some((s) => s.dateIso === today);

          const movedOrPastDateEdit =
            previousRun?.completedDate === today ||
            !previousRun?.completedDate ||
            Boolean(resolvedDate && resolvedDate < today) ||
            !isCompleted;

          if (!hasOtherCompletedToday && movedOrPastDateEdit) {
            const allCompletionDates = [
              ...nextRuns
                .filter((r) => (r.status === 'FEITO' || r.status === 'PARCIAL') && r.completedDate)
                .map((r) => r.completedDate as string),
              ...prev.strengthHistory
                .filter((s) => Boolean(s.dateIso))
                .map((s) => s.dateIso as string),
            ]
              .filter((d) => d <= today)
              .sort();
            nextLastDoneDate =
              allCompletionDates.length > 0
                ? allCompletionDates[allCompletionDates.length - 1]
                : null;
          }
        } else if (isCompleted && resolvedDate) {
          if (!nextLastDoneDate || (resolvedDate <= today && resolvedDate > nextLastDoneDate)) {
            nextLastDoneDate = resolvedDate;
          }
        }

        return {
          ...prev,
          runWorkouts: nextRuns,
          tafTrainingStatus: { lastDoneDate: nextLastDoneDate },
          routineBlocks: nextBlocks,
        };
      });
      triggerAutoSync();
    },
    [mutateAndSave, triggerAutoSync]
  );

  const logVdotCheckpoint = useCallback(
    (newVdot: number, source: 'manual' | 'teste' = 'manual', note?: string) => {
      const clamped = Math.min(65, Math.max(30, Math.round(newVdot)));
      const today = formatBrDate(new Date());
      mutateAndSave((prev) => {
        const history = Array.isArray(prev.vdotHistory) ? [...prev.vdotHistory] : [];
        const last = history[history.length - 1];
        if (last && last.dateStr === today && last.source === source && !note) {
          history[history.length - 1] = { ...last, vdot: clamped };
        } else {
          history.push({
            id: Date.now(),
            dateStr: today,
            vdot: clamped,
            source,
            note: note?.trim() || undefined,
          });
        }
        return { ...prev, vdot: clamped, vdotHistory: history.slice(-30) };
      });
    },
    [mutateAndSave]
  );

  const updateVdot = useCallback(
    (newVdot: number) => {
      logVdotCheckpoint(newVdot, 'manual');
    },
    [logVdotCheckpoint]
  );

  const updateVdotFromTest = useCallback(
    (distanceMeters: number, timeSeconds: number): number => {
      const calc = Math.min(65, Math.max(30, Math.round(calculateVdot(distanceMeters, timeSeconds))));
      const mins = Math.floor(timeSeconds / 60);
      const secs = timeSeconds % 60;
      logVdotCheckpoint(calc, 'teste', `${distanceMeters}m em ${mins}:${String(secs).padStart(2, '0')}`);
      return calc;
    },
    [logVdotCheckpoint]
  );

  const saveSimulado = useCallback(
    (
      editingId: number | null,
      data: string,
      genero: string,
      barra: number,
      abdominal: number,
      impulsao: number,
      corrida: number,
      shuttle: number
    ) => {
      const id = editingId ?? Date.now();
      const sim = buildSimulado(
        id,
        data.trim() || formatBrDate(new Date()),
        genero,
        barra,
        abdominal,
        impulsao,
        corrida,
        shuttle
      );
      mutateAndSave((prev) => {
        const exists = prev.tafHistory.some((s) => s.id === id);
        const updated = exists
          ? prev.tafHistory.map((s) => (s.id === id ? sim : s))
          : [...prev.tafHistory, sim];
        return {
          ...prev,
          tafHistory: updated,
          deletedTafIds: prev.deletedTafIds.filter((d) => d !== id),
        };
      });
      triggerAutoSync();
    },
    [mutateAndSave, triggerAutoSync]
  );

  const deleteSimulado = useCallback(
    (id: number) => {
      mutateAndSave((prev) => ({
        ...prev,
        tafHistory: prev.tafHistory.filter((s) => s.id !== id),
        deletedTafIds: Array.from(new Set([...prev.deletedTafIds, id])),
      }));
      triggerAutoSync();
    },
    [mutateAndSave, triggerAutoSync]
  );

  const saveStrengthTemplate = useCallback(
    (template: WorkoutTemplate) => {
      mutateAndSave((prev) => {
        const exists = prev.strengthTemplates.some((t) => t.id === template.id);
        const nextTemplates = exists
          ? prev.strengthTemplates.map((t) => (t.id === template.id ? template : t))
          : [...prev.strengthTemplates, template];
        return { ...prev, strengthTemplates: nextTemplates };
      });
      triggerAutoSync();
    },
    [mutateAndSave, triggerAutoSync]
  );

  const deleteStrengthTemplate = useCallback(
    (templateId: string) => {
      mutateAndSave((prev) => {
        if (prev.strengthTemplates.length <= 1) return prev;
        return {
          ...prev,
          strengthTemplates: prev.strengthTemplates.filter((t) => t.id !== templateId),
        };
      });
      triggerAutoSync();
    },
    [mutateAndSave, triggerAutoSync]
  );

  const resetStrengthTemplates = useCallback(() => {
    mutateAndSave((prev) => ({
      ...prev,
      strengthTemplates: defaultPrfTemplates(),
    }));
    triggerAutoSync();
  }, [mutateAndSave, triggerAutoSync]);

  const importAppStateBackup = useCallback(
    (rawJson: string): { ok: boolean; message: string } => {
      try {
        const parsed = JSON.parse(rawJson) as { state?: Partial<TafAppState> } & Partial<TafAppState>;
        const candidate = parsed.state && typeof parsed.state === 'object' ? parsed.state : parsed;
        if (
          !candidate ||
          (!Array.isArray(candidate.runWorkouts) &&
            !Array.isArray(candidate.tafHistory) &&
            !Array.isArray(candidate.strengthTemplates))
        ) {
          return { ok: false, message: 'Arquivo JSON inválido para o QG da PRF.' };
        }
        const base = defaultState();
        mutateAndSave(() => ({
          ...base,
          ...candidate,
          runWorkouts:
            Array.isArray(candidate.runWorkouts) && candidate.runWorkouts.length > 0
              ? candidate.runWorkouts
              : base.runWorkouts,
          strengthTemplates:
            Array.isArray(candidate.strengthTemplates) && candidate.strengthTemplates.length > 0
              ? candidate.strengthTemplates
              : base.strengthTemplates,
          strengthHistory: Array.isArray(candidate.strengthHistory)
            ? candidate.strengthHistory
            : [],
          tafHistory: Array.isArray(candidate.tafHistory) ? candidate.tafHistory : [],
          vdotHistory: Array.isArray(candidate.vdotHistory) ? candidate.vdotHistory : [],
          routineBlocks: Array.isArray(candidate.routineBlocks) ? candidate.routineBlocks : [],
          deletedTafIds: Array.isArray(candidate.deletedTafIds) ? candidate.deletedTafIds : [],
        }));
        triggerAutoSync();
        return { ok: true, message: 'Backup restaurado com sucesso!' };
      } catch {
        return { ok: false, message: 'Não foi possível ler o JSON. Verifique o arquivo.' };
      }
    },
    [mutateAndSave, triggerAutoSync]
  );

  const startStrengthWorkout = useCallback((template: WorkoutTemplate) => {
    const history = stateRef.current.strengthHistory;
    const exercises: ActiveExerciseDraft[] = template.exercises.map((ex) => {
      const lastLog = history
        .flatMap((s) => s.exercises)
        .find((l) => l.exerciseId === ex.id);
      const sets: ActiveSetDraft[] = Array.from({ length: ex.sets }, (_, i) => {
        const setNum = i + 1;
        const prevSet = lastLog?.sets[i] ?? lastLog?.sets[lastLog.sets.length - 1];
        let prevLabel = '—';
        if (prevSet) {
          if (ex.isTimed) prevLabel = `${prevSet.repsOrSeconds}s`;
          else if (prevSet.weightKg > 0) prevLabel = `${formatWeight(prevSet.weightKg)}kg × ${prevSet.repsOrSeconds}`;
          else prevLabel = `${prevSet.repsOrSeconds} reps`;
        }
        return {
          setNumber: setNum,
          weightKgText: prevSet && prevSet.weightKg > 0 ? formatWeight(prevSet.weightKg) : '',
          repsText: prevSet && prevSet.repsOrSeconds > 0 ? String(prevSet.repsOrSeconds) : '',
          previousSummary: prevLabel,
          completed: false,
        };
      });
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        isTimed: ex.isTimed,
        restSeconds: ex.restSeconds,
        cue: ex.cue,
        progressionTip: strengthProgressionTip(ex.isTimed, lastLog?.sets),
        sets,
      };
    });

    setActiveWorkout({
      template,
      elapsedSeconds: 0,
      exercises,
      restRemainingSeconds: 0,
      restTotalSeconds: 0,
      isRestRunning: false,
    });
  }, []);

  const updateActiveSetInputs = useCallback(
    (exerciseId: string, setNumber: number, weightKgText: string, repsText: string) => {
      setActiveWorkout((prev) =>
        prev
          ? {
              ...prev,
              exercises: prev.exercises.map((ex) =>
                ex.exerciseId !== exerciseId
                  ? ex
                  : {
                      ...ex,
                      sets: ex.sets.map((s) =>
                        s.setNumber === setNumber ? { ...s, weightKgText, repsText } : s
                      ),
                    }
              ),
            }
          : null
      );
    },
    []
  );

  const toggleActiveSetCompleted = useCallback((exerciseId: string, setNumber: number) => {
    setActiveWorkout((prev) => {
      if (!prev) return null;
      let triggeredRest: number | null = null;
      const exercises = prev.exercises.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.setNumber !== setNumber) return s;
            const nextDone = !s.completed;
            if (nextDone) triggeredRest = ex.restSeconds;
            return { ...s, completed: nextDone };
          }),
        };
      });
      if (triggeredRest !== null) {
        return {
          ...prev,
          exercises,
          restRemainingSeconds: triggeredRest,
          restTotalSeconds: triggeredRest,
          isRestRunning: true,
        };
      }
      return { ...prev, exercises };
    });
  }, []);

  const addActiveSet = useCallback((exerciseId: string) => {
    setActiveWorkout((prev) =>
      prev
        ? {
            ...prev,
            exercises: prev.exercises.map((ex) => {
              if (ex.exerciseId !== exerciseId) return ex;
              const last = ex.sets[ex.sets.length - 1];
              const nextNum = (last?.setNumber ?? 0) + 1;
              return {
                ...ex,
                sets: [
                  ...ex.sets,
                  {
                    setNumber: nextNum,
                    weightKgText: last?.weightKgText ?? '',
                    repsText: last?.repsText ?? '',
                    previousSummary: last?.previousSummary ?? '—',
                    completed: false,
                  },
                ],
              };
            }),
          }
        : null
    );
  }, []);

  const adjustRestTimer = useCallback((deltaSeconds: number) => {
    setActiveWorkout((prev) => {
      if (!prev) return null;
      const next = Math.max(0, prev.restRemainingSeconds + deltaSeconds);
      return {
        ...prev,
        restRemainingSeconds: next,
        restTotalSeconds: Math.max(prev.restTotalSeconds, next),
        isRestRunning: next > 0,
      };
    });
  }, []);

  const skipRestTimer = useCallback(() => {
    setActiveWorkout((prev) =>
      prev ? { ...prev, restRemainingSeconds: 0, isRestRunning: false } : null
    );
  }, []);

  const discardActiveWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, []);

  const finishActiveWorkout = useCallback(() => {
    setActiveWorkout((active) => {
      if (!active) return null;
      const logs: ExerciseLog[] = active.exercises
        .map((ex) => {
          const completedSets = ex.sets
            .filter((s) => s.completed)
            .map((s) => ({
              setNumber: s.setNumber,
              weightKg: Number(s.weightKgText.replace(',', '.')) || 0,
              repsOrSeconds: parseInt(s.repsText, 10) || 0,
              completed: true,
            }));
          if (!completedSets.length) return null;
          return {
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            isTimed: ex.isTimed,
            restSeconds: ex.restSeconds,
            cue: ex.cue,
            sets: completedSets,
          };
        })
        .filter((x): x is ExerciseLog => x !== null);

      const totalVolumeKg = logs.reduce(
        (acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + s.weightKg * s.repsOrSeconds, 0),
        0
      );

      const now = new Date();
      const today = formatLocalIsoDate(now);
      const actualDurationMin = Math.max(1, Math.round((active.elapsedSeconds + 30) / 60));
      const blockDurationMin = Math.max(15, actualDurationMin);
      const endMin = Math.min(1440, Math.max(blockDurationMin, now.getHours() * 60 + now.getMinutes()));
      const startMin = Math.max(0, endMin - blockDurationMin);
      const sessionId = Date.now();

      const session: StrengthSession = {
        id: sessionId,
        templateId: active.template.id,
        title: active.template.title,
        category: active.template.category,
        dateStr: formatBrDate(now),
        durationSeconds: active.elapsedSeconds,
        totalVolumeKg,
        exercises: logs,
        dateIso: today,
        startedAtMin: startMin,
      };

      const block: RoutineTrainingBlock = {
        id: `taf_str_${sessionId}`,
        dayKey: weekdayKey(now),
        dateIso: today,
        label: active.template.title,
        startMin,
        endMin: Math.min(1440, startMin + blockDurationMin),
        durationMin: actualDurationMin,
        note: `${actualDurationMin} min · ${Math.round(totalVolumeKg)} kg · App TAF`,
        category: 'training',
        source: 'taf_app',
        isPlanned: false,
      };

      mutateAndSave((prev) => ({
        ...prev,
        strengthHistory: [session, ...prev.strengthHistory],
        tafTrainingStatus: { lastDoneDate: today },
        routineBlocks: [block, ...prev.routineBlocks].slice(0, 60),
      }));
      triggerAutoSync();
      return null;
    });
  }, [mutateAndSave, triggerAutoSync]);

  const startGuidedRun = useCallback((workout: RunWorkout) => {
    const paces = pacesForVdot(stateRef.current.vdot);
    const steps = parseRunWorkoutSteps(workout, paces);
    const first = steps[0];
    if (!first) return;
    setActiveGuidedRun({
      workout,
      steps,
      currentStepIndex: 0,
      stepRemainingSeconds: first.durationSeconds,
      totalElapsedSeconds: 0,
      isRunning: true,
      voiceEnabled: true,
      completedStepCount: 0,
    });
    speakPtBr(`Iniciando ${workout.code}. ${first.title}. ${first.targetLabel}`);
  }, []);

  const toggleGuidedRunPlaying = useCallback(() => {
    setActiveGuidedRun((prev) => (prev ? { ...prev, isRunning: !prev.isRunning } : null));
  }, []);

  const nextGuidedStep = useCallback(() => {
    setActiveGuidedRun((prev) => {
      if (!prev) return null;
      const nextIdx = prev.currentStepIndex + 1;
      if (nextIdx >= prev.steps.length) return prev;
      const nextStep = prev.steps[nextIdx];
      if (prev.voiceEnabled) speakPtBr(`${nextStep.title}. ${nextStep.targetLabel}`);
      return {
        ...prev,
        currentStepIndex: nextIdx,
        stepRemainingSeconds: nextStep.durationSeconds,
        completedStepCount: Math.max(prev.completedStepCount, nextIdx),
      };
    });
  }, []);

  const previousGuidedStep = useCallback(() => {
    setActiveGuidedRun((prev) => {
      if (!prev) return null;
      const prevIdx = Math.max(0, prev.currentStepIndex - 1);
      const prevStep = prev.steps[prevIdx];
      return {
        ...prev,
        currentStepIndex: prevIdx,
        stepRemainingSeconds: prevStep.durationSeconds,
      };
    });
  }, []);

  const toggleGuidedVoice = useCallback(() => {
    setActiveGuidedRun((prev) => (prev ? { ...prev, voiceEnabled: !prev.voiceEnabled } : null));
  }, []);

  const discardGuidedRun = useCallback(() => {
    stopSpeaking();
    setActiveGuidedRun(null);
  }, []);

  const finishGuidedRun = useCallback(
    (asPartial: boolean) => {
      stopSpeaking();
      const guided = activeGuidedRun;
      if (!guided) return;
      const mins = Math.max(1, Math.round((guided.totalElapsedSeconds + 30) / 60));
      const doneSteps = Math.min(
        guided.steps.length,
        Math.max(guided.completedStepCount, guided.currentStepIndex + 1)
      );
      const summary = `Treino guiado: ${doneSteps}/${guided.steps.length} blocos em ${mins} min (${formatBrDate(new Date())})`;
      const mergedNote =
        !guided.workout.notes.trim() || guided.workout.notes === '---'
          ? summary
          : `${guided.workout.notes} | ${summary}`;
      updateRunWorkout(
        guided.workout.id,
        asPartial ? 'PARCIAL' : 'FEITO',
        mergedNote,
        mins,
        formatLocalIsoDate(new Date())
      );
      setActiveGuidedRun(null);
    },
    [activeGuidedRun, updateRunWorkout]
  );

  const signInAndSync = useCallback(
    async (email: string, password: string) => {
      const supabaseUrl = ENV_SUPABASE_URL || authRef.current.supabaseUrl;
      const anonKey = ENV_SUPABASE_ANON_KEY || authRef.current.supabaseAnonKey;
      if (!supabaseUrl || !anonKey) {
        setSyncState({
          isSyncing: false,
          message: 'Conexão com o Supabase ainda não configurada no ambiente do aplicativo.',
          isError: true,
        });
        return;
      }
      setSyncState({ isSyncing: true, message: 'Conectando ao QG da PRF...', isError: false });
      try {
        const normalized = normalizeSupabaseUrl(supabaseUrl);
        const session = await signInSupabase(normalized, anonKey, email, password);
        const cfg: SupabaseConfig = {
          supabaseUrl: normalized,
          supabaseAnonKey: anonKey.trim(),
          userEmail: session.email,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        };
        saveAuth(cfg);
        await performSync(cfg, false);
      } catch (err) {
        setSyncState({
          isSyncing: false,
          message: err instanceof Error ? err.message : 'Falha ao entrar no Supabase.',
          isError: true,
        });
      }
    },
    [performSync, saveAuth]
  );

  const syncNow = useCallback(() => {
    const cfg = authRef.current;
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !cfg.accessToken) {
      setSyncState({
        isSyncing: false,
        message: 'Configure e entre na sua conta para sincronizar com o QG.',
        isError: true,
      });
      return;
    }
    void performSync(cfg, false);
  }, [performSync]);

  const signOutSupabase = useCallback(() => {
    saveAuth({
      ...authRef.current,
      accessToken: '',
      refreshToken: '',
    });
    setSyncState({ isSyncing: false, message: 'Sessão encerrada neste aparelho.', isError: false });
  }, [saveAuth]);

  return {
    state,
    authConfig,
    isLoggedIn: Boolean(authConfig.supabaseUrl && authConfig.supabaseAnonKey && authConfig.accessToken),
    syncState,
    activeWorkout,
    activeGuidedRun,
    todayIso,
    todayBr,
    todayDayKey,
    isDoneToday,
    effectiveTodayReadiness,
    weeklyPlan,
    nextPendingRun,
    setTodayReadiness,
    setWeeklySplitPreset,
    setPreferredTrainingStartMin,
    toggleTodayTafDone,
    updateRunWorkout,
    updateVdot,
    updateVdotFromTest,
    logVdotCheckpoint,
    saveSimulado,
    deleteSimulado,
    saveStrengthTemplate,
    deleteStrengthTemplate,
    resetStrengthTemplates,
    importAppStateBackup,
    startStrengthWorkout,
    updateActiveSetInputs,
    toggleActiveSetCompleted,
    addActiveSet,
    adjustRestTimer,
    skipRestTimer,
    finishActiveWorkout,
    discardActiveWorkout,
    startGuidedRun,
    toggleGuidedRunPlaying,
    nextGuidedStep,
    previousGuidedStep,
    toggleGuidedVoice,
    finishGuidedRun,
    discardGuidedRun,
    signInAndSync,
    syncNow,
    signOutSupabase,
  };
}

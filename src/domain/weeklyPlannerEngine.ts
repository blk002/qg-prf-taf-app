import { estimateRunDurationMinutes } from './jackDanielsPlan';
import { findWeakestTest } from './prfTafScoring';
import type {
  PlannedDaySlot,
  PlannedDayType,
  RoutineTrainingBlock,
  RunWorkout,
  TafSimulado,
  WeeklySplitPreset,
  WorkoutTemplate,
} from './types';

export const WEEKLY_SPLIT_OPTIONS: { key: WeeklySplitPreset; label: string; runDays: string[] }[] = [
  { key: 'SEG_QUA_SEX', label: 'Seg / Qua / Sex', runDays: ['seg', 'qua', 'sex'] },
  { key: 'TER_QUI_SAB', label: 'Ter / Qui / Sáb', runDays: ['ter', 'qui', 'sab'] },
  { key: 'TER_QUI_DOM', label: 'Ter / Qui / Dom', runDays: ['ter', 'qui', 'dom'] },
];

const WEEK_ORDER: [string, string][] = [
  ['seg', 'Seg'],
  ['ter', 'Ter'],
  ['qua', 'Qua'],
  ['qui', 'Qui'],
  ['sex', 'Sex'],
  ['sab', 'Sáb'],
  ['dom', 'Dom'],
];

const DAY_INDEX: Record<string, number> = Object.fromEntries(
  WEEK_ORDER.map(([key], idx) => [key, idx])
);

const DAY_LABEL: Record<string, string> = Object.fromEntries(WEEK_ORDER);

function runCodeToDayType(code: string | undefined): PlannedDayType {
  if (code === 'Q2') return 'CORRIDA_Q2';
  if (code === 'Q3') return 'CORRIDA_Q3';
  return 'CORRIDA_Q1';
}

function runCodeToOrder(code: string | undefined): number {
  if (code === 'Q2') return 1;
  if (code === 'Q3') return 2;
  return 0;
}

export function formatLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildWeeklyPlan(
  preset: WeeklySplitPreset,
  runWorkouts: RunWorkout[],
  tafHistory: TafSimulado[],
  templates: WorkoutTemplate[],
  referenceDate: Date = new Date()
): PlannedDaySlot[] {
  const split = WEEKLY_SPLIT_OPTIONS.find((o) => o.key === preset) ?? WEEKLY_SPLIT_OPTIONS[0];

  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const todayIndex = (ref.getDay() + 6) % 7;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - todayIndex);

  // Map each day of the current calendar week to its ISO date
  const dayKeyToIso: Record<string, string> = {};
  const isoToDayKey: Record<string, string> = {};
  WEEK_ORDER.forEach(([key], idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const iso = formatLocalIsoDate(d);
    dayKeyToIso[key] = iso;
    isoToDayKey[iso] = key;
  });

  const pendingRuns = runWorkouts.filter((r) => r.status === 'PENDENTE');
  const activeWeek =
    pendingRuns[0]?.week ?? runWorkouts[runWorkouts.length - 1]?.week ?? 9;
  const activeWeekRuns = runWorkouts.filter((r) => r.week === activeWeek);

  interface AssignedRunInfo {
    run: RunWorkout;
    dayType: PlannedDayType;
    isRescheduled: boolean;
    shiftedFromLabel?: string;
  }

  const runAssignments: Record<string, AssignedRunInfo> = {};
  const usedRunIds = new Set<string>();

  // 1. Anchor runs already completed/partial on one of this calendar week's run days
  for (const run of runWorkouts) {
    if (run.status === 'PENDENTE' || !run.completedDate) continue;
    const matchedDay = isoToDayKey[run.completedDate];
    if (matchedDay && split.runDays.includes(matchedDay) && !runAssignments[matchedDay]) {
      runAssignments[matchedDay] = {
        run,
        dayType: runCodeToDayType(run.code),
        isRescheduled: false,
      };
      usedRunIds.add(run.id);
    }
  }

  // 2. Anchor active-week runs completed on a non-run day of THIS week (or marked PULADO)
  //    to unoccupied past run days so the weekly timeline reflects that they are already resolved.
  const pastUnoccupiedRunDays = split.runDays.filter(
    (d) => (DAY_INDEX[d] ?? 0) < todayIndex && !runAssignments[d]
  );
  const resolvedThisWeekOrSkipped = activeWeekRuns.filter((r) => {
    if (r.status === 'PENDENTE' || usedRunIds.has(r.id)) return false;
    if (r.status === 'PULADO') return true;
    return Boolean(r.completedDate && isoToDayKey[r.completedDate]);
  });

  resolvedThisWeekOrSkipped.forEach((run, i) => {
    const pastDay = pastUnoccupiedRunDays[i];
    if (!pastDay) return;
    runAssignments[pastDay] = {
      run,
      dayType: runCodeToDayType(run.code),
      isRescheduled: false,
    };
    usedRunIds.add(run.id);
  });

  // 3. Assign pending runs STRICTLY IN ORDER starting from today / next upcoming run day
  //    so a later workout (Q2/Q3) is NEVER prescribed while an earlier workout (Q1/Q2) is still pending.
  const upcomingUnoccupiedRunDays = split.runDays.filter(
    (d) => (DAY_INDEX[d] ?? 0) >= todayIndex && !runAssignments[d]
  );
  const missedPastRunDays = split.runDays.filter(
    (d) => (DAY_INDEX[d] ?? 0) < todayIndex && !runAssignments[d]
  );

  let pendingCursor = 0;
  for (const dayKey of upcomingUnoccupiedRunDays) {
    const nextRun = pendingRuns[pendingCursor];
    if (!nextRun) break;
    pendingCursor += 1;

    const slotPos = split.runDays.indexOf(dayKey);
    const expectedPos = runCodeToOrder(nextRun.code);
    const isRescheduled =
      missedPastRunDays.length > 0 &&
      nextRun.week === activeWeek &&
      slotPos > expectedPos;
    const shiftedFromDay = split.runDays[expectedPos];

    runAssignments[dayKey] = {
      run: nextRun,
      dayType: runCodeToDayType(nextRun.code),
      isRescheduled,
      shiftedFromLabel: isRescheduled ? DAY_LABEL[shiftedFromDay] : undefined,
    };
    usedRunIds.add(nextRun.id);
  }

  // Fallback if all 54 workouts are already done (show last week's completed workouts)
  if (pendingRuns.length === 0 && Object.keys(runAssignments).length === 0) {
    activeWeekRuns.slice(0, 3).forEach((run, idx) => {
      const dayKey = split.runDays[idx];
      if (!dayKey) return;
      runAssignments[dayKey] = {
        run,
        dayType: runCodeToDayType(run.code),
        isRescheduled: false,
      };
    });
  }

  // Determine where the first missed pending run was moved (for helpful copy on past missed days)
  const firstPendingRun = pendingRuns[0] ?? null;
  const firstPendingTargetDayKey = firstPendingRun
    ? split.runDays.find((d) => runAssignments[d]?.run.id === firstPendingRun.id) ?? null
    : null;
  const completedTodayOrLaterDayKey = split.runDays.find(
    (d) =>
      (DAY_INDEX[d] ?? 0) >= todayIndex &&
      runAssignments[d] &&
      runAssignments[d].run.status !== 'PENDENTE'
  );

  const weakest = findWeakestTest(tafHistory)?.name ?? null;
  const specificTemplateId = weakest === 'Shuttle Run' ? 'esp_shuttle' : 'esp_impulsao';
  const barraTemplate = templates.find((t) => t.id === 'forca_barra_core');
  const runStrTemplate = templates.find((t) => t.id === 'fort_corrida');
  const specificTemplate = templates.find((t) => t.id === specificTemplateId);

  const nonRunKeys = WEEK_ORDER.map(([k]) => k).filter((k) => !split.runDays.includes(k));
  const restKey = nonRunKeys.includes('dom') ? 'dom' : nonRunKeys[nonRunKeys.length - 1];
  const strengthKeys = nonRunKeys.filter((k) => k !== restKey);

  const strengthAssignments: Record<string, PlannedDaySlot> = {};
  strengthKeys.forEach((dayKey, index) => {
    const shortLabel = DAY_LABEL[dayKey] ?? dayKey;
    if (index === 0) {
      strengthAssignments[dayKey] = {
        dayKey,
        shortLabel,
        type: 'FORCA_BARRA',
        title: barraTemplate?.title ?? 'Força Superior & Core',
        subtitle: 'Barra fixa pronada, pegada e abdominal remador',
        estimatedMin: 35,
        linkedRunId: null,
        linkedTemplateId: 'forca_barra_core',
        coachReason:
          'Mantém pernas frescas entre as corridas enquanto sobe sua nota na barra e abdominal.',
      };
    } else if (index === 1) {
      strengthAssignments[dayKey] = {
        dayKey,
        shortLabel,
        type: 'FORT_CORRIDA',
        title: runStrTemplate?.title ?? 'Fortalecimento para Corrida',
        subtitle: 'Sóleo, tibial anterior, glúteo médio e búlgaro',
        estimatedMin: 35,
        linkedRunId: null,
        linkedTemplateId: 'fort_corrida',
        coachReason:
          'Previne canelite e melhora economia de corrida para suportar os treinos Q2/Q3.',
      };
    } else {
      strengthAssignments[dayKey] = {
        dayKey,
        shortLabel,
        type: 'ESPECIFICO_TAF',
        title: specificTemplate?.title ?? 'Específico Impulsão / Shuttle',
        subtitle: specificTemplate?.subtitle ?? 'Pliometria e mudança de direção para o TAF',
        estimatedMin: 35,
        linkedRunId: null,
        linkedTemplateId: specificTemplateId,
        coachReason:
          weakest === 'Shuttle Run'
            ? 'Foco em Shuttle Run por ser sua menor pontuação média no TAF.'
            : 'Potência horizontal e agilidade sem sobrecarregar antes do longão.',
      };
    }
  });

  return WEEK_ORDER.map(([dayKey, shortLabel]) => {
    const isRunDay = split.runDays.includes(dayKey);
    if (isRunDay) {
      const assigned = runAssignments[dayKey];
      if (assigned) {
        const { run, dayType, isRescheduled, shiftedFromLabel } = assigned;
        const estimatedMin = estimateRunDurationMinutes(run.prescription);
        const baseReason =
          dayType === 'CORRIDA_Q1'
            ? 'Base aeróbica (Q1): sustente ritmo confortável para construir volume sem fadiga.'
            : dayType === 'CORRIDA_Q2'
              ? 'Qualidade (Q2): execute os tiros com foco no tempo-alvo exato do seu VDOT.'
              : 'Qualidade (Q3): complete a última sessão forte da semana mantendo boa postura.';

        const coachReason = isRescheduled
          ? `Reagendado de ${shiftedFromLabel ?? 'dia anterior'}: o sistema identificou que ${run.code} ainda não foi concluído e o manteve na ordem antes de avançar. ${baseReason}`
          : baseReason;

        return {
          dayKey,
          shortLabel,
          type: dayType,
          title: `Corrida Sem ${run.week} · ${run.code}`,
          subtitle: run.prescription,
          estimatedMin,
          linkedRunId: run.id,
          linkedTemplateId: null,
          coachReason,
          runStatus: run.status,
          isRescheduled,
        };
      }

      // Past run day where no workout was logged -> shifted forward to preserve sequence
      const targetLabel = firstPendingTargetDayKey
        ? DAY_LABEL[firstPendingTargetDayKey]
        : DAY_LABEL[split.runDays[0]];
      const subtitle = firstPendingRun
        ? firstPendingTargetDayKey
          ? `Sem ${firstPendingRun.week} · ${firstPendingRun.code} não realizado neste dia — movido para ${targetLabel}.`
          : `Sem ${firstPendingRun.week} · ${firstPendingRun.code} aguarda o próximo dia de corrida (${targetLabel}).`
        : completedTodayOrLaterDayKey
          ? `Corrida da sequência concluída em ${DAY_LABEL[completedTodayOrLaterDayKey]}.`
          : 'Nenhuma corrida registrada neste dia.';

      return {
        dayKey,
        shortLabel,
        type: 'CORRIDA_REAGENDADA',
        title: 'Corrida reagendada',
        subtitle,
        estimatedMin: 0,
        linkedRunId: null,
        linkedTemplateId: null,
        coachReason:
          'A sequência Q1 → Q2 → Q3 é preservada automaticamente para que nenhum treino posterior seja prescrito antes de concluir o anterior.',
        rescheduledTargetDayKey: firstPendingTargetDayKey,
      };
    }

    if (dayKey === restKey) {
      return {
        dayKey,
        shortLabel,
        type: 'DESCANSO',
        title: 'Descanso & Recuperação',
        subtitle: 'Mobilidade leve, hidratação e sono reparador',
        estimatedMin: 0,
        linkedRunId: null,
        linkedTemplateId: null,
        coachReason:
          'A adaptação muscular e aeróbica acontece no descanso — essencial antes da próxima semana.',
      };
    }

    return strengthAssignments[dayKey];
  });
}

export function buildPlannedRoutineBlocks(
  preset: WeeklySplitPreset,
  runWorkouts: RunWorkout[],
  tafHistory: TafSimulado[],
  templates: WorkoutTemplate[],
  preferredStartMin = 390,
  completedBlocks: RoutineTrainingBlock[] = [],
  referenceDate: Date = new Date()
): RoutineTrainingBlock[] {
  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const mondayOffset = (ref.getDay() + 6) % 7;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - mondayOffset);

  const weeklyPlan = buildWeeklyPlan(preset, runWorkouts, tafHistory, templates, ref);
  const completedDates = new Set(
    completedBlocks.filter((b) => !b.isPlanned).map((b) => b.dateIso)
  );

  const result: RoutineTrainingBlock[] = [];
  weeklyPlan.forEach((slot, index) => {
    if (
      slot.type === 'DESCANSO' ||
      slot.type === 'CORRIDA_REAGENDADA' ||
      slot.estimatedMin <= 0
    ) {
      return;
    }
    if (slot.runStatus && slot.runStatus !== 'PENDENTE') return;

    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    const dateIso = formatLocalIsoDate(d);
    if (completedDates.has(dateIso)) return;

    const dur = Math.min(240, Math.max(15, slot.estimatedMin));
    const startMin = Math.min(1440 - dur, Math.max(0, preferredStartMin));
    result.push({
      id: `taf_plan_${slot.dayKey}`,
      dayKey: slot.dayKey,
      dateIso,
      label: slot.title,
      startMin,
      endMin: Math.min(1440, startMin + dur),
      durationMin: dur,
      note: `Planejado · ~${dur} min · ${slot.subtitle.slice(0, 48)} (App TAF)`,
      category: 'training',
      source: 'taf_app',
      isPlanned: true,
    });
  });

  return result;
}

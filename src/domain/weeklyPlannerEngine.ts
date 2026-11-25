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
  templates: WorkoutTemplate[]
): PlannedDaySlot[] {
  const split = WEEKLY_SPLIT_OPTIONS.find((o) => o.key === preset) ?? WEEKLY_SPLIT_OPTIONS[0];
  const activeWeek =
    runWorkouts.find((r) => r.status === 'PENDENTE')?.week ??
    runWorkouts[runWorkouts.length - 1]?.week ??
    9;
  const weekRuns = runWorkouts.filter((r) => r.week === activeWeek);
  const q1 = weekRuns.find((r) => r.code === 'Q1') ?? null;
  const q2 = weekRuns.find((r) => r.code === 'Q2') ?? null;
  const q3 = weekRuns.find((r) => r.code === 'Q3') ?? null;

  const weakest = findWeakestTest(tafHistory)?.name ?? null;
  const specificTemplateId = weakest === 'Shuttle Run' ? 'esp_shuttle' : 'esp_impulsao';
  const barraTemplate = templates.find((t) => t.id === 'forca_barra_core');
  const runStrTemplate = templates.find((t) => t.id === 'fort_corrida');
  const specificTemplate = templates.find((t) => t.id === specificTemplateId);

  const runAssignments: Record<string, { run: RunWorkout | null; dayType: PlannedDayType }> = {
    [split.runDays[0]]: { run: q1, dayType: 'CORRIDA_Q1' },
    [split.runDays[1]]: { run: q2, dayType: 'CORRIDA_Q2' },
    [split.runDays[2]]: { run: q3, dayType: 'CORRIDA_Q3' },
  };

  const nonRunKeys = WEEK_ORDER.map(([k]) => k).filter((k) => !split.runDays.includes(k));
  const restKey = nonRunKeys.includes('dom') ? 'dom' : nonRunKeys[nonRunKeys.length - 1];
  const strengthKeys = nonRunKeys.filter((k) => k !== restKey);

  const strengthAssignments: Record<string, PlannedDaySlot> = {};
  strengthKeys.forEach((dayKey, index) => {
    const shortLabel = WEEK_ORDER.find(([k]) => k === dayKey)?.[1] ?? dayKey;
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
        coachReason: 'Mantém pernas frescas entre as corridas enquanto sobe sua nota na barra e abdominal.',
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
        coachReason: 'Previne canelite e melhora economia de corrida para suportar os treinos Q2/Q3.',
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
    const runPair = runAssignments[dayKey];
    if (runPair) {
      const { run, dayType } = runPair;
      const estimatedMin = run ? estimateRunDurationMinutes(run.prescription) : 45;
      return {
        dayKey,
        shortLabel,
        type: dayType,
        title: run ? `Corrida Sem ${run.week} · ${run.code}` : 'Corrida Jack Daniels',
        subtitle: run?.prescription ?? 'Treino do ciclo Jack Daniels',
        estimatedMin,
        linkedRunId: run?.id ?? null,
        linkedTemplateId: null,
        coachReason:
          dayType === 'CORRIDA_Q1'
            ? 'Base aeróbica (Q1): sustente ritmo confortável para construir volume sem fadiga.'
            : dayType === 'CORRIDA_Q2'
              ? 'Qualidade (Q2): execute os tiros com foco no tempo-alvo exato do seu VDOT.'
              : 'Qualidade (Q3): complete a última sessão forte da semana mantendo boa postura.',
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
        coachReason: 'A adaptação muscular e aeróbica acontece no descanso — essencial antes da próxima semana.',
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
  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const mondayOffset = (ref.getDay() + 6) % 7;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - mondayOffset);

  const weeklyPlan = buildWeeklyPlan(preset, runWorkouts, tafHistory, templates);
  const completedDates = new Set(
    completedBlocks.filter((b) => !b.isPlanned).map((b) => b.dateIso)
  );

  const result: RoutineTrainingBlock[] = [];
  weeklyPlan.forEach((slot, index) => {
    if (slot.type === 'DESCANSO' || slot.estimatedMin <= 0) return;
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

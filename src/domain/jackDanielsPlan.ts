import type { RunStatus, RunWorkout } from './types';

export function estimateRunDurationMinutes(prescription: string): number {
  let explicitMinutes = 0;
  const minRegex = /(\d+)(?:\s*[–-]\s*\d+)?\s*min/g;
  for (const m of prescription.matchAll(minRegex)) {
    explicitMinutes += Number(m[1]) || 0;
  }

  const hasIntervals = prescription.includes('×') || /milha/i.test(prescription);
  let intervalEstimate = 0;
  if (hasIntervals) {
    let repMinutes = 0;
    for (const m of prescription.matchAll(/(\d+)\s*×\s*(\d+)\s*m/g)) {
      const reps = Number(m[1]) || 0;
      const dist = Number(m[2]) || 0;
      if (dist >= 800) repMinutes += reps * 6;
      else if (dist >= 600) repMinutes += reps * 5;
      else if (dist >= 400) repMinutes += reps * 3;
      else repMinutes += reps * 2;
    }
    let mileMinutes = 0;
    for (const m of prescription.matchAll(/(\d+)\s*×?\s*1?\s*milha/g)) {
      mileMinutes += (Number(m[1]) || 1) * 10;
    }
    intervalEstimate = Math.max(repMinutes + mileMinutes, explicitMinutes < 45 ? 15 : 0);
  }

  const total = explicitMinutes + intervalEstimate;
  return total > 0 ? Math.min(120, Math.max(20, total)) : 45;
}

function w(
  id: string,
  phase: string,
  week: number,
  code: string,
  prescription: string,
  status: RunStatus = 'PENDENTE',
  notes = '',
  completedDate: string | null = null
): RunWorkout {
  return {
    id,
    phase,
    week,
    code,
    prescription,
    status,
    notes,
    completedDate,
    durationMin: null,
    startMin: null,
  };
}

/**
 * Plano completo 1.500 m a 2 milhas — Semanas 7 a 24 (54 treinos) baseado em Jack Daniels (4ª ed.).
 * Inclui o histórico exato importado da planilha do usuário (Semanas 7 e 8).
 */
export function defaultJackDanielsWorkouts(): RunWorkout[] {
  return [
    // Fase II — Semanas 7 a 12
    w('II-7-Q1', 'II', 7, 'Q1', '60 min a 6:45–7:31 por km', 'FEITO', '2026-12-10', '2026-12-10'),
    w('II-7-Q2', 'II', 7, 'Q2', '20 min + 8×200 m (1:00), trote 200 m + 10 min', 'PARCIAL', '19/10/2026', '2026-10-19'),
    w('II-7-Q3', 'II', 7, 'Q3', '10 min + 10×200 m (1:00), trote 200 m + 20 min', 'PULADO', '---', null),
    w('II-8-Q1', 'II', 8, 'Q1', '60 min a 6:45–7:31 por km', 'FEITO', '26/10/2026', '2026-10-26'),
    w('II-8-Q2', 'II', 8, 'Q2', '20 min + 2×200 m (1:00), trote 200 m + 4×400 m (2:00), trote 400 m + 10 min', 'FEITO', '2026-03-11', '2026-03-11'),
    w('II-8-Q3', 'II', 8, 'Q3', '20 min + 10×200 m (1:00), trote 200 m + 10 min', 'FEITO', '2026-05-11', '2026-05-11'),

    w('II-9-Q1', 'II', 9, 'Q1', '60 min a 6:45–7:31 por km'),
    w('II-9-Q2', 'II', 9, 'Q2', '10 min + 2×200 m (1:00), trote 200 m + 6×400 m (2:00), trote 400 m + 10 min'),
    w('II-9-Q3', 'II', 9, 'Q3', '10 min + 6×200 m (1:00), trote 200 m + 10 min + 4×200 m (1:00), trote 200 m + 10 min'),

    w('II-10-Q1', 'II', 10, 'Q1', '60 min a 6:45–7:31 por km'),
    w('II-10-Q2', 'II', 10, 'Q2', '20 min + 3 séries de (200 m em 1:00, trote 200 m, 200 m em 1:00, trote 400 m, 400 m em 2:00, trote 200 m) + 10 min'),
    w('II-10-Q3', 'II', 10, 'Q3', '10 min + 6×400 m (2:00), trote 400 m + 2×200 m (1:00), trote 200 m + 10 min'),

    w('II-11-Q1', 'II', 11, 'Q1', '60 min a 6:45–7:31 por km'),
    w('II-11-Q2', 'II', 11, 'Q2', '20 min + 4×200 m (1:00), trote 200 m + 2×600 m (3:00), trote 600 m + 4×200 m (1:00), trote 200 m + 10 min'),
    w('II-11-Q3', 'II', 11, 'Q3', '10 min + 4 acelerações + 600 m (3:00), trote 600 m + 2×400 m (2:00), trote 400 m + 4×200 m (1:00), trote 200 m + 20 min'),

    w('II-12-Q1', 'II', 12, 'Q1', '60 min a 6:45–7:31 por km'),
    w('II-12-Q2', 'II', 12, 'Q2', '10 min + 2×200 m (1:00), trote 200 m + 2×400 m (2:00), trote 400 m + 2×600 m (3:00), trote 600 m + 15 min'),
    w('II-12-Q3', 'II', 12, 'Q3', '10 min + 6×200 m (1:00), trote 200 m + 4×300 m (1:30), trote 300 m + 20 min'),

    // Fase III — Semanas 13 a 18
    w('III-13-Q1', 'III', 13, 'Q1', '60–70 min a 6:45–7:31 por km + 8 acelerações'),
    w('III-13-Q2', 'III', 13, 'Q2', '10 min + 16×200 m (0:59), trote 200 m + 1 milha'),
    w('III-13-Q3', 'III', 13, 'Q3', '20 min + 4×600 m (2:57), trote 600 m + 4×200 m (0:59), trote 200 m + 15 min'),

    w('III-14-Q1', 'III', 14, 'Q1', '10 min + 8×400 m (1:58), trote 400 m + 20 min'),
    w('III-14-Q2', 'III', 14, 'Q2', '15 min + 4×800 m (4:16), trote 3 min + 6 acelerações + 15 min'),
    w('III-14-Q3', 'III', 14, 'Q3', '20 min + 3×1 milha (9:20), descanso 2 min + 20 min'),

    w('III-15-Q1', 'III', 15, 'Q1', '60–70 min a 6:45–7:31 por km + 8 acelerações'),
    w('III-15-Q2', 'III', 15, 'Q2', '20 min + 4×600 m (2:57), trote 600 m + 4×200 m (0:59), trote 200 m + 10 min'),
    w('III-15-Q3', 'III', 15, 'Q3', '15 min + 8×2 min fortes (esforço de 10–12 min), trote 1 min + 1 milha + 4×200 m (0:59), trote 200 m + 15 min'),

    w('III-16-Q1', 'III', 16, 'Q1', '20 min + 8×400 m (1:56), trote 400 m + 15 min'),
    w('III-16-Q2', 'III', 16, 'Q2', '20 min + 4×800 m (4:16), trote 3 min + 6 acelerações + 15 min'),
    w('III-16-Q3', 'III', 16, 'Q3', '15 min + 3 milhas seguidas (5:48/km, ~28:00) + 6×200 m (0:58), trote 200 m + 10 min'),

    w('III-17-Q1', 'III', 17, 'Q1', '60–70 min a 6:45–7:31 por km + 8 acelerações'),
    w('III-17-Q2', 'III', 17, 'Q2', '20 min + 4×600 m (2:54), trote 600 m + 4×200 m (0:58), trote 200 m + 10 min'),
    w('III-17-Q3', 'III', 17, 'Q3', '10 min + 4×800 m (4:16), trote 400 m + 4×200 m (0:58), trote 200 m + 20 min'),

    w('III-18-Q1', 'III', 18, 'Q1', '20 min + 2×600 m (2:54), trote 600 m + 3×400 m (1:56), trote 400 m + 4×200 m (0:58), trote 200 m + 10 min'),
    w('III-18-Q2', 'III', 18, 'Q2', '15 min + 4×800 m (4:16), trote 3 min + 6 acelerações + 10 min'),
    w('III-18-Q3', 'III', 18, 'Q3', '10 min + 4×1 milha (9:20), descanso 1 min + 4×200 m (0:58), trote 200 m + 10 min'),

    // Fase IV — Semanas 19 a 24
    w('IV-19-Q1', 'IV', 19, 'Q1', '60 min a 6:45–7:31 por km + 8 acelerações'),
    w('IV-19-Q2', 'IV', 19, 'Q2', '10 min + 4×600 m (2:53), trote 600 m + 15 min'),
    w('IV-19-Q3', 'IV', 19, 'Q3', '20 min + 2 milhas seguidas (9:16/milha) + 4×200 m (0:58), trote 200 m + 2×1 milha (9:16), descanso 1 min + 4×200 m (0:58), trote 200 m + 10 min'),

    w('IV-20-Q1', 'IV', 20, 'Q1', '60 min a 6:45–7:31 por km + 6 acelerações'),
    w('IV-20-Q2', 'IV', 20, 'Q2', '10 min + 2×600 m (2:53), trote 1 km + 2×400 m (1:55), trote 400 m + 4×200 m (0:58), trote 200 m + 10 min'),
    w('IV-20-Q3', 'IV', 20, 'Q3', '20 min + 4×200 m (0:58), trote 200 m + 4×400 m (1:55), trote 400 m + 6 acelerações + 10 min'),

    w('IV-21-Q1', 'IV', 21, 'Q1', '20 min + 3 milhas seguidas (5:45/km, ~27:48) + 8 acelerações + 20 min'),
    w('IV-21-Q2', 'IV', 21, 'Q2', '20 min + 600 m (2:53), trote 600 m + 2×400 m (1:55), trote 400 m + 4×200 m (0:58), trote 200 m + 10 min'),
    w('IV-21-Q3', 'IV', 21, 'Q3', '20 min + 3×1 milha (9:16), descanso 2 min + 6×200 m (0:58), trote 200 m (pule se houver prova no fim de semana)'),

    w('IV-22-Q1', 'IV', 22, 'Q1', '60 min a 6:45–7:31 por km + 8 acelerações'),
    w('IV-22-Q2', 'IV', 22, 'Q2', '20 min + 8×400 m (1:55), trote 400 m + 10 min'),
    w('IV-22-Q3', 'IV', 22, 'Q3', '20 min + 3×1 milha (9:16), descanso 1 min + 8×200 m (0:58), trote 200 m + 10 min'),

    w('IV-23-Q1', 'IV', 23, 'Q1', '10 min + 4×1 milha (9:16), descanso 1 min + 4×200 m (0:58), trote 200 m + 10 min'),
    w('IV-23-Q2', 'IV', 23, 'Q2', '20 min + 2 séries de (1 milha em 9:16, trote 400 m, 4×200 m em 0:58, trote 200 m) + 1 milha'),
    w('IV-23-Q3', 'IV', 23, 'Q3', '10 min + 2×800 m (4:14), trote 3 min + 4×400 m (1:55), trote 400 m + 15 min (pule se houver prova grande)'),

    w('IV-24-Q1', 'IV', 24, 'Q1', '50 min a 6:45–7:31 por km + 6 acelerações'),
    w('IV-24-Q2', 'IV', 24, 'Q2', '10 min + 2×200 m (0:58), trote 200 m + 2×1 milha (9:16), descanso 2 min + 2×200 m (0:58), trote 200 m + 10 min'),
    w('IV-24-Q3', 'IV', 24, 'Q3', '20 min + acelerações + dia da prova'),
  ];
}

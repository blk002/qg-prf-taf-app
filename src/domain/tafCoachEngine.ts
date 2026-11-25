import {
  calcAbdominal,
  calcBarra,
  calcCorrida,
  calcImpulsao,
  calcShuttle,
} from './prfTafScoring';
import type { CoachGapInsight, LoggedSet, ReadinessLevel, TafSimulado } from './types';

export const READINESS_OPTIONS: { level: ReadinessLevel; label: string; shortTip: string }[] = [
  {
    level: 'ALTA',
    label: 'Alta',
    shortTip: 'Energia alta: mantenha os ritmos-alvo e busque progressão nas séries.',
  },
  {
    level: 'NORMAL',
    label: 'Normal',
    shortTip: 'Prontidão equilibrada: siga a prescrição do dia sem pular aquecimento.',
  },
  {
    level: 'CANSADO',
    label: 'Cansado',
    shortTip: 'Fadiga alta: priorize técnica, fique no limite lento do trote leve e evite falhar na barra.',
  },
];

function formatKg(kg: number): string {
  return kg % 1 === 0 ? String(Math.round(kg)) : kg.toFixed(1);
}

export function analyzeNextPointGain(history: TafSimulado[]): CoachGapInsight | null {
  if (!history.length) return null;
  const latest = history[history.length - 1];
  const isMale = latest.genero !== 'feminino';

  const scores: [string, number][] = [
    ['Barra Fixa', latest.ptsBarra],
    ['Abdominal', latest.ptsAbdominal],
    ['Impulsão', latest.ptsImpulsao],
    ['Corrida', latest.ptsCorrida],
    ['Shuttle Run', latest.ptsShuttle],
  ];
  const weakest = scores.reduce((min, cur) => (cur[1] < min[1] ? cur : min), scores[0]);
  if (weakest[1] >= 5) {
    return {
      testName: 'TAF Completo',
      currentPts: 5,
      nextPts: 5,
      actionTip: 'Você já atingiu 25/25 pts! Mantenha o ritmo semanal sem overtraining.',
    };
  }

  switch (weakest[0]) {
    case 'Barra Fixa': {
      const target = isMale
        ? latest.barra < 3
          ? 3
          : Math.floor(latest.barra) + 1
        : ([10, 13, 16, 19, 22, 25, 28].find((t) => t > latest.barra) ?? 28);
      const nextPts = calcBarra(target, isMale);
      const unit = isMale ? 'reps' : 'seg';
      return {
        testName: 'Barra Fixa',
        currentPts: latest.ptsBarra,
        nextPts,
        actionTip: `Chegue em ${Math.round(target)} ${unit} (hoje ${Math.round(latest.barra)}) para subir para ${nextPts.toFixed(1)} pts.`,
      };
    }
    case 'Abdominal': {
      const thresholds = isMale ? [35, 39, 43, 47, 51, 55, 59] : [28, 31, 34, 37, 40, 43, 46];
      const next = thresholds.find((t) => t > latest.abdominal) ?? thresholds[thresholds.length - 1];
      const nextPts = calcAbdominal(next, isMale);
      const delta = Math.max(1, Math.round(next - latest.abdominal));
      return {
        testName: 'Abdominal',
        currentPts: latest.ptsAbdominal,
        nextPts,
        actionTip: `+${delta} reps em 1 min (meta: ${next} reps) vale ${nextPts.toFixed(1)} pts.`,
      };
    }
    case 'Impulsão': {
      const thresholds = isMale
        ? [2.01, 2.06, 2.11, 2.16, 2.21, 2.26, 2.31]
        : [1.61, 1.66, 1.71, 1.76, 1.81, 1.86, 1.91];
      const next = thresholds.find((t) => t > latest.impulsao + 0.001) ?? thresholds[thresholds.length - 1];
      const nextPts = calcImpulsao(next, isMale);
      const deltaCm = Math.max(1, Math.round((next - latest.impulsao) * 100));
      return {
        testName: 'Impulsão',
        currentPts: latest.ptsImpulsao,
        nextPts,
        actionTip: `Ganhe +${deltaCm} cm (meta: ${next.toFixed(2)} m) para ir a ${nextPts.toFixed(1)} pts.`,
      };
    }
    case 'Corrida': {
      const thresholds = isMale
        ? [2301, 2401, 2501, 2601, 2701, 2801, 2901]
        : [2001, 2101, 2201, 2301, 2401, 2501, 2601];
      const next = thresholds.find((t) => t > latest.corrida) ?? thresholds[thresholds.length - 1];
      const nextPts = calcCorrida(next, isMale);
      const deltaM = Math.max(1, Math.round(next - latest.corrida));
      return {
        testName: 'Corrida 12 min',
        currentPts: latest.ptsCorrida,
        nextPts,
        actionTip: `+${deltaM} m nos 12 min (meta: ${next} m) garante ${nextPts.toFixed(1)} pts.`,
      };
    }
    default: {
      const thresholds = isMale
        ? [13.9, 13.4, 12.9, 12.4, 11.9, 11.4, 10.9]
        : [15.9, 15.4, 14.9, 14.4, 13.9, 13.4, 12.9];
      const next =
        latest.shuttle <= 0
          ? thresholds[0]
          : (thresholds.find((t) => t < latest.shuttle - 0.01) ?? thresholds[thresholds.length - 1]);
      const nextPts = calcShuttle(next, isMale);
      return {
        testName: 'Shuttle Run',
        currentPts: latest.ptsShuttle,
        nextPts,
        actionTip: `Baixe para ${next.toFixed(1)} s na ida e volta para cravar ${nextPts.toFixed(1)} pts.`,
      };
    }
  }
}

export function strengthProgressionTip(isTimed: boolean, lastSets?: LoggedSet[]): string {
  if (!lastSets || !lastSets.length) {
    return 'Meta hoje: complete todas as séries com técnica limpa para registrar sua base.';
  }
  const maxWeight = Math.max(0, ...lastSets.map((s) => s.weightKg));
  const maxReps = Math.max(0, ...lastSets.map((s) => s.repsOrSeconds));
  if (isTimed) {
    return `Meta do treinador: segure ${maxReps + 5}s na melhor série (último: ${maxReps}s).`;
  }
  if (maxWeight > 0) {
    const nextW = maxWeight + 2.5;
    return `Meta do treinador: busque ${formatKg(nextW)} kg × ${maxReps} ou +1 rep com ${formatKg(maxWeight)} kg.`;
  }
  return `Meta do treinador: supere ${maxReps} reps na 1ª série (tente ${maxReps + 1} reps).`;
}

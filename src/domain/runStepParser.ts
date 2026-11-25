import type { RunStep, RunWorkout, VdotPaces } from './types';

function splitTopLevelPlus(input: string): string[] {
  const result: string[] = [];
  let buf = '';
  let depth = 0;
  for (const ch of input) {
    if (ch === '(') {
      depth++;
      buf += ch;
    } else if (ch === ')') {
      depth = Math.max(0, depth - 1);
      buf += ch;
    } else if (ch === '+' && depth === 0) {
      result.push(buf.trim());
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) result.push(buf.trim());
  return result;
}

function parseTimeToSec(mmSs: string): number {
  const parts = mmSs.trim().split(':');
  if (parts.length !== 2) return 90;
  const m = Number(parts[0]) || 0;
  const s = Number(parts[1]) || 0;
  return Math.max(15, m * 60 + s);
}

function inferWorkSeconds(workPart: string, paces: VdotPaces): number {
  const explicitTime = workPart.match(/\((\d+:\d+)\)/)?.[1];
  if (explicitTime) return parseTimeToSec(explicitTime);

  const minMatch = workPart.match(/(\d+)\s*min/)?.[1];
  if (minMatch) return Number(minMatch) * 60;

  if (workPart.includes('200')) return parseTimeToSec(paces.rep200);
  if (workPart.includes('300')) return parseTimeToSec(paces.rep300);
  if (workPart.includes('400')) return parseTimeToSec(paces.rep400);
  if (workPart.includes('600')) return parseTimeToSec(paces.rep600);
  if (workPart.includes('800')) return parseTimeToSec(paces.interval800);
  if (/milha/i.test(workPart)) return parseTimeToSec(paces.thresholdMile);
  return 120;
}

function inferRecoverySeconds(recPart: string): number {
  const minMatch = recPart.match(/(\d+)\s*min/)?.[1];
  if (minMatch) return Number(minMatch) * 60;

  if (/1 km/i.test(recPart)) return 420;
  if (recPart.includes('600')) return 240;
  if (recPart.includes('400')) return 165;
  if (recPart.includes('300')) return 125;
  if (recPart.includes('200')) return 90;
  return 90;
}

function capitalize(str: string): string {
  return str ? str[0].toUpperCase() + str.slice(1) : str;
}

function appendSegmentSteps(
  out: RunStep[],
  segment: string,
  paces: VdotPaces,
  isFirst: boolean,
  isLast: boolean,
  prefix: string
): void {
  const strideMatch = segment.match(/^(\d+)?\s*aceleraç(?:ão|ões)/i);
  if (strideMatch) {
    const count = Number(strideMatch[1]) || 6;
    out.push({
      index: out.length,
      title: `${prefix}${count} Acelerações Leves`,
      targetLabel: '15–20s rápidas com pausa completa',
      durationSeconds: count * 45,
      type: 'STRIDES',
    });
    return;
  }

  const contMilesMatch = segment.match(/(\d+)\s*milhas?\s+seguidas/i);
  if (contMilesMatch) {
    const miles = Number(contMilesMatch[1]) || 2;
    const approx = segment.match(/~(\d+):(\d+)/);
    const durationSeconds = approx
      ? (Number(approx[1]) || 28) * 60 + (Number(approx[2]) || 0)
      : miles * parseTimeToSec(paces.thresholdMile);
    out.push({
      index: out.length,
      title: `${prefix}${miles} Milhas Contínuas (Limiar)`,
      targetLabel: `Ritmo T: ${paces.thresholdKm}`,
      durationSeconds,
      type: 'WORK',
    });
    return;
  }

  const repWithRecovery = segment.match(/^(\d+)\s*×\s*([^,]+),\s*(trote|descanso)\s+(.+)$/i);
  if (repWithRecovery) {
    const reps = Math.min(30, Math.max(1, Number(repWithRecovery[1]) || 1));
    const workPart = repWithRecovery[2].trim();
    const recKind = capitalize(repWithRecovery[3].trim());
    const recPart = repWithRecovery[4].trim();
    const workSec = inferWorkSeconds(workPart, paces);
    const recSec = inferRecoverySeconds(recPart);
    const workName = workPart.replace(/\s*\([^)]*\)/g, '').trim();
    const target = workPart.match(/\(([^)]+)\)/)?.[1] ?? paces.thresholdKm;

    for (let r = 1; r <= reps; r++) {
      out.push({
        index: out.length,
        title: `${prefix}Tiro ${r}/${reps} · ${workName}`,
        targetLabel: `Alvo: ${target}`,
        durationSeconds: workSec,
        type: 'WORK',
      });
      out.push({
        index: out.length,
        title: `${prefix}${recKind} (${recPart})`,
        targetLabel: `Solto: ${paces.easyRange}`,
        durationSeconds: recSec,
        type: 'RECOVERY',
      });
    }
    return;
  }

  const singleWithRecovery = segment.match(
    /^(\d+\s*m\s*\([^)]+\)|1\s*milha\s*\([^)]+\)),\s*(trote|descanso)\s+(.+)$/i
  );
  if (singleWithRecovery) {
    const workPart = singleWithRecovery[1].trim();
    const recKind = capitalize(singleWithRecovery[2].trim());
    const recPart = singleWithRecovery[3].trim();
    const target = workPart.match(/\(([^)]+)\)/)?.[1] ?? paces.rep600;
    out.push({
      index: out.length,
      title: `${prefix}Tiro · ${workPart.replace(/\s*\([^)]*\)/g, '').trim()}`,
      targetLabel: `Alvo: ${target}`,
      durationSeconds: inferWorkSeconds(workPart, paces),
      type: 'WORK',
    });
    out.push({
      index: out.length,
      title: `${prefix}${recKind} (${recPart})`,
      targetLabel: `Solto: ${paces.easyRange}`,
      durationSeconds: inferRecoverySeconds(recPart),
      type: 'RECOVERY',
    });
    return;
  }

  const singleWork = segment.match(/^(\d+\s*m|1\s*milha)\s+em\s+(\d+:\d+)/i);
  if (singleWork) {
    out.push({
      index: out.length,
      title: `${prefix}Tiro · ${singleWork[1]}`,
      targetLabel: `Alvo: ${singleWork[2]}`,
      durationSeconds: parseTimeToSec(singleWork[2]),
      type: 'WORK',
    });
    return;
  }

  if (/^(?:trote|descanso)/i.test(segment)) {
    out.push({
      index: out.length,
      title: `${prefix}${capitalize(segment)}`,
      targetLabel: `Solto: ${paces.easyRange}`,
      durationSeconds: inferRecoverySeconds(segment),
      type: 'RECOVERY',
    });
    return;
  }

  const minMatch = segment.match(/^(\d+)(?:\s*[–-]\s*\d+)?\s*min/);
  if (minMatch) {
    const mins = Math.min(120, Math.max(1, Number(minMatch[1]) || 15));
    const type = isLast && !isFirst ? 'COOLDOWN' : 'WARMUP';
    const title =
      mins >= 45
        ? `${prefix}Longão (${mins} min)`
        : type === 'COOLDOWN'
          ? `${prefix}Desaquecimento (${mins} min)`
          : `${prefix}Aquecimento (${mins} min)`;
    out.push({
      index: out.length,
      title,
      targetLabel: `Leve: ${paces.easyRange}`,
      durationSeconds: mins * 60,
      type,
    });
    return;
  }

  if (/1 milha/i.test(segment)) {
    out.push({
      index: out.length,
      title: `${prefix}1 Milha (Limiar)`,
      targetLabel: `Alvo: ${paces.thresholdMile}`,
      durationSeconds: parseTimeToSec(paces.thresholdMile),
      type: 'WORK',
    });
  }
}

export function parseRunWorkoutSteps(workout: RunWorkout, paces: VdotPaces): RunStep[] {
  const raw = workout.prescription.trim();
  if (/dia da prova/i.test(raw)) {
    return [
      { index: 0, title: 'Aquecimento pré-prova', targetLabel: `Leve: ${paces.easyRange}`, durationSeconds: 20 * 60, type: 'WARMUP' },
      { index: 1, title: 'Acelerações de ativação', targetLabel: '4–6× 15–20s soltos', durationSeconds: 5 * 60, type: 'STRIDES' },
      { index: 2, title: 'Prova / Simulado Oficial', targetLabel: 'Ritmo máximo controlado', durationSeconds: 12 * 60, type: 'WORK' },
    ];
  }

  const steps: RunStep[] = [];
  const topParts = splitTopLevelPlus(raw);

  topParts.forEach((part, idx) => {
    const p = part.trim();
    if (!p) return;

    const seriesMatch = p.match(/^(\d+)\s*séries?\s+de\s*\((.+)\)$/i);
    if (seriesMatch) {
      const seriesCount = Math.min(10, Math.max(1, Number(seriesMatch[1]) || 1));
      const innerParts = seriesMatch[2]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      for (let s = 1; s <= seriesCount; s++) {
        innerParts.forEach((inner) => {
          appendSegmentSteps(steps, inner, paces, false, false, `Série ${s}/${seriesCount} · `);
        });
      }
      return;
    }

    appendSegmentSteps(steps, p, paces, idx === 0, idx === topParts.length - 1, '');
  });

  if (steps.length === 0) {
    steps.push({
      index: 0,
      title: 'Corrida Contínua',
      targetLabel: `Leve: ${paces.easyRange}`,
      durationSeconds: 45 * 60,
      type: 'WARMUP',
    });
  }

  return steps.map((s, i) => ({ ...s, index: i }));
}

import type { TafSimulado, WeakTestResult } from './types';

export function calcBarra(value: number, isMale: boolean): number {
  if (isMale) {
    if (value < 3) return 0;
    if (value < 4) return 2;
    if (value < 5) return 2.5;
    if (value < 6) return 3;
    if (value < 7) return 3.5;
    if (value < 8) return 4;
    if (value < 9) return 4.5;
    return 5;
  }
  if (value < 10) return 0;
  if (value < 13) return 2;
  if (value < 16) return 2.5;
  if (value < 19) return 3;
  if (value < 22) return 3.5;
  if (value < 25) return 4;
  if (value < 28) return 4.5;
  return 5;
}

export function calcAbdominal(value: number, isMale: boolean): number {
  if (isMale) {
    if (value < 35) return 0;
    if (value <= 38) return 2;
    if (value <= 42) return 2.5;
    if (value <= 46) return 3;
    if (value <= 50) return 3.5;
    if (value <= 54) return 4;
    if (value <= 58) return 4.5;
    return 5;
  }
  if (value < 28) return 0;
  if (value <= 30) return 2;
  if (value <= 33) return 2.5;
  if (value <= 36) return 3;
  if (value <= 39) return 3.5;
  if (value <= 42) return 4;
  if (value <= 45) return 4.5;
  return 5;
}

export function calcImpulsao(value: number, isMale: boolean): number {
  if (isMale) {
    if (value <= 2.0) return 0;
    if (value <= 2.05) return 2;
    if (value <= 2.1) return 2.5;
    if (value <= 2.15) return 3;
    if (value <= 2.2) return 3.5;
    if (value <= 2.25) return 4;
    if (value <= 2.3) return 4.5;
    return 5;
  }
  if (value <= 1.6) return 0;
  if (value <= 1.65) return 2;
  if (value <= 1.7) return 2.5;
  if (value <= 1.75) return 3;
  if (value <= 1.8) return 3.5;
  if (value <= 1.85) return 4;
  if (value <= 1.9) return 4.5;
  return 5;
}

export function calcCorrida(value: number, isMale: boolean): number {
  if (isMale) {
    if (value <= 2300) return 0;
    if (value <= 2400) return 2;
    if (value <= 2500) return 2.5;
    if (value <= 2600) return 3;
    if (value <= 2700) return 3.5;
    if (value <= 2800) return 4;
    if (value <= 2900) return 4.5;
    return 5;
  }
  if (value <= 2000) return 0;
  if (value <= 2100) return 2;
  if (value <= 2200) return 2.5;
  if (value <= 2300) return 3;
  if (value <= 2400) return 3.5;
  if (value <= 2500) return 4;
  if (value <= 2600) return 4.5;
  return 5;
}

export function calcShuttle(value: number, isMale: boolean): number {
  if (value <= 0) return 0;
  if (isMale) {
    if (value >= 14.0) return 0;
    if (value >= 13.5) return 2;
    if (value >= 13.0) return 2.5;
    if (value >= 12.5) return 3;
    if (value >= 12.0) return 3.5;
    if (value >= 11.5) return 4;
    if (value >= 11.0) return 4.5;
    return 5;
  }
  if (value >= 16.0) return 0;
  if (value >= 15.5) return 2;
  if (value >= 15.0) return 2.5;
  if (value >= 14.5) return 3;
  if (value >= 14.0) return 3.5;
  if (value >= 13.5) return 4;
  if (value >= 13.0) return 4.5;
  return 5;
}

export function buildSimulado(
  id: number,
  data: string,
  genero: string,
  barra: number,
  abdominal: number,
  impulsao: number,
  corrida: number,
  shuttle: number
): TafSimulado {
  const isMale = genero !== 'feminino';
  const ptsBarra = calcBarra(barra, isMale);
  const ptsAbdominal = calcAbdominal(abdominal, isMale);
  const ptsImpulsao = calcImpulsao(impulsao, isMale);
  const ptsCorrida = calcCorrida(corrida, isMale);
  const ptsShuttle = calcShuttle(shuttle, isMale);
  const totalPts = ptsBarra + ptsAbdominal + ptsImpulsao + ptsCorrida + ptsShuttle;
  return {
    id,
    data,
    genero: isMale ? 'masculino' : 'feminino',
    barra,
    abdominal,
    impulsao,
    corrida,
    shuttle,
    ptsBarra,
    ptsAbdominal,
    ptsImpulsao,
    ptsCorrida,
    ptsShuttle,
    totalPts,
  };
}

export function findWeakestTest(history: TafSimulado[]): WeakTestResult | null {
  if (!history.length) return null;
  const count = history.length;
  const latest = history[history.length - 1];
  const candidates: WeakTestResult[] = [
    {
      name: 'Barra Fixa',
      averagePts: history.reduce((acc, s) => acc + s.ptsBarra, 0) / count,
      lastPts: latest.ptsBarra,
    },
    {
      name: 'Abdominal',
      averagePts: history.reduce((acc, s) => acc + s.ptsAbdominal, 0) / count,
      lastPts: latest.ptsAbdominal,
    },
    {
      name: 'Impulsão',
      averagePts: history.reduce((acc, s) => acc + s.ptsImpulsao, 0) / count,
      lastPts: latest.ptsImpulsao,
    },
    {
      name: 'Corrida',
      averagePts: history.reduce((acc, s) => acc + s.ptsCorrida, 0) / count,
      lastPts: latest.ptsCorrida,
    },
    {
      name: 'Shuttle Run',
      averagePts: history.reduce((acc, s) => acc + s.ptsShuttle, 0) / count,
      lastPts: latest.ptsShuttle,
    },
  ];
  return candidates.reduce((min, cur) => (cur.averagePts < min.averagePts ? cur : min), candidates[0]);
}

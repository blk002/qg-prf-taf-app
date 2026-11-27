import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, Dumbbell, Plus, TrendingUp, X } from 'lucide-react';
import { ActionButton, MetadataLine, SegmentedControl } from '../components/UiKit';
import type { TafAppState } from '../domain/types';
import { calculateVdot, pacesForVdot } from '../domain/vdotCalculator';

interface VdotPoint {
  label: string;
  fullDate: string;
  vdot: number;
  source: string;
  thresholdKm: string;
  note?: string;
}

function parseBrDateToTime(dateStr: string): number {
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return 0;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
}

export function PerformanceDashboardScreen({
  state,
  isDark,
  onLogVdot,
  onCalculateVdotFromTest,
  onNavigateToTaf,
  onNavigateToRun,
  onNavigateToForca,
}: {
  state: TafAppState;
  isDark: boolean;
  onLogVdot: (vdot: number, source: 'manual' | 'teste', note?: string) => void;
  onCalculateVdotFromTest: (distanceMeters: number, timeSeconds: number) => number;
  onNavigateToTaf: () => void;
  onNavigateToRun: () => void;
  onNavigateToForca: () => void;
}) {
  const [tafChartMode, setTafChartMode] = useState<'TOTAL' | 'DISCIPLINES'>('TOTAL');
  const [selectedExerciseKey, setSelectedExerciseKey] = useState<string>('');
  const [exerciseMetric, setExerciseMetric] = useState<'LOAD' | 'BEST_SET' | 'VOLUME'>('LOAD');
  const [showVdotModal, setShowVdotModal] = useState(false);
  const [vdotModalMode, setVdotModalMode] = useState<'TESTE' | 'MANUAL'>('TESTE');
  const [testDist, setTestDist] = useState('2800');
  const [testMin, setTestMin] = useState('12');
  const [testSec, setTestSec] = useState('00');
  const [manualVdot, setManualVdot] = useState(String(state.vdot));
  const [manualNote, setManualNote] = useState('');

  // Editorial PRF Obsidian + Gold + Chalk chart tokens
  const chartGrid = isDark ? '#26262E' : '#DDD8CE';
  const chartAxis = isDark ? '#8A8A96' : '#6B6B76';
  const chartAxisStrong = isDark ? '#C4C4CC' : '#47474F';
  const chartNodeStroke = isDark ? '#121216' : '#FFFFFF';
  const chartPrimaryLine = isDark ? '#F5F4EF' : '#111114';
  const chartGold = isDark ? '#EAB308' : '#CA8A04';
  const chartSuccess = isDark ? '#22C55E' : '#15803D';
  const chartTooltipStyle = {
    backgroundColor: isDark ? '#121216' : '#FFFFFF',
    borderColor: isDark ? '#32323D' : '#D6D2C7',
    color: isDark ? '#F5F4EF' : '#111114',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'IBM Plex Mono',
  };
  const chartTooltipItemStyle = {
    color: isDark ? '#C4C4CC' : '#47474F',
  };
  const chartTooltipLabelStyle = {
    color: isDark ? '#8A8A96' : '#6B6B76',
    marginBottom: '4px',
  };
  const chartLegendStyle = {
    fontSize: '11px',
    paddingTop: '8px',
    fontFamily: 'IBM Plex Mono',
    color: isDark ? '#C4C4CC' : '#47474F',
  };

  const tafTrendData = useMemo(() => {
    return [...state.tafHistory]
      .sort((a, b) => {
        const ta = parseBrDateToTime(a.data);
        const tb = parseBrDateToTime(b.data);
        if (ta && tb && ta !== tb) return ta - tb;
        return a.id - b.id;
      })
      .map((sim) => ({
        dateShort: sim.data.slice(0, 5),
        fullDate: sim.data,
        totalPts: Number(sim.totalPts.toFixed(1)),
        barra: Number(sim.ptsBarra.toFixed(1)),
        abdominal: Number(sim.ptsAbdominal.toFixed(1)),
        impulsao: Number(sim.ptsImpulsao.toFixed(1)),
        corrida: Number(sim.ptsCorrida.toFixed(1)),
        shuttle: Number(sim.ptsShuttle.toFixed(1)),
        impliedVdot: Number(calculateVdot(sim.corrida, 12 * 60).toFixed(1)),
      }));
  }, [state.tafHistory]);

  const vdotSeries = useMemo<VdotPoint[]>(() => {
    const raw: { sortKey: number; id: number; point: VdotPoint }[] = [];

    (state.vdotHistory ?? []).forEach((cp) => {
      raw.push({
        sortKey: parseBrDateToTime(cp.dateStr) || cp.id,
        id: cp.id,
        point: {
          label: cp.dateStr.slice(0, 5),
          fullDate: cp.dateStr,
          vdot: cp.vdot,
          source: cp.source === 'teste' ? 'Teste de pista' : 'Registro manual',
          thresholdKm: pacesForVdot(cp.vdot).thresholdKm,
          note: cp.note,
        },
      });
    });

    state.tafHistory.forEach((sim) => {
      if (sim.corrida > 0) {
        const calc = Number(calculateVdot(sim.corrida, 12 * 60).toFixed(1));
        raw.push({
          sortKey: parseBrDateToTime(sim.data) || sim.id,
          id: sim.id,
          point: {
            label: sim.data.slice(0, 5),
            fullDate: sim.data,
            vdot: calc,
            source: 'Simulado 12 min',
            thresholdKm: pacesForVdot(calc).thresholdKm,
            note: `${sim.corrida}m em 12:00`,
          },
        });
      }
    });

    raw.sort((a, b) => (a.sortKey !== b.sortKey ? a.sortKey - b.sortKey : a.id - b.id));
    const list = raw.map((item) => item.point);

    if (list.length === 0) {
      list.push({
        label: 'Atual',
        fullDate: 'Nível atual configurado',
        vdot: state.vdot,
        source: 'Configuração atual',
        thresholdKm: pacesForVdot(state.vdot).thresholdKm,
      });
    }

    return list;
  }, [state.vdotHistory, state.tafHistory, state.vdot]);

  const disciplineComparison = useMemo(() => {
    if (state.tafHistory.length === 0) return [];
    const latest = tafTrendData[tafTrendData.length - 1];
    const best = {
      barra: Math.max(...tafTrendData.map((d) => d.barra)),
      abdominal: Math.max(...tafTrendData.map((d) => d.abdominal)),
      impulsao: Math.max(...tafTrendData.map((d) => d.impulsao)),
      corrida: Math.max(...tafTrendData.map((d) => d.corrida)),
      shuttle: Math.max(...tafTrendData.map((d) => d.shuttle)),
    };
    return [
      { prova: 'Barra', ultimo: latest.barra, recorde: best.barra },
      { prova: 'Abdom.', ultimo: latest.abdominal, recorde: best.abdominal },
      { prova: 'Impulsão', ultimo: latest.impulsao, recorde: best.impulsao },
      { prova: 'Corrida', ultimo: latest.corrida, recorde: best.corrida },
      { prova: 'Shuttle', ultimo: latest.shuttle, recorde: best.shuttle },
    ];
  }, [state.tafHistory.length, tafTrendData]);

  const phaseProgressData = useMemo(() => {
    return ['II', 'III', 'IV'].map((ph) => {
      const items = state.runWorkouts.filter((r) => r.phase === ph);
      const feitos = items.filter((r) => r.status === 'FEITO').length;
      const parciais = items.filter((r) => r.status === 'PARCIAL').length;
      const pendentes = items.length - feitos - parciais;
      return {
        fase: `Fase ${ph}`,
        feitos,
        parciais,
        pendentes,
        total: items.length,
      };
    });
  }, [state.runWorkouts]);

  const currentPaces = useMemo(() => pacesForVdot(state.vdot), [state.vdot]);
  const vdotDelta =
    vdotSeries.length >= 2
      ? Number((vdotSeries[vdotSeries.length - 1].vdot - vdotSeries[0].vdot).toFixed(1))
      : null;

  const latestTaf = tafTrendData[tafTrendData.length - 1] ?? null;
  const prevTaf = tafTrendData.length >= 2 ? tafTrendData[tafTrendData.length - 2] : null;
  const tafDelta =
    latestTaf && prevTaf ? Number((latestTaf.totalPts - prevTaf.totalPts).toFixed(1)) : null;

  const passCount = state.tafHistory.filter((s) => s.totalPts >= 12).length;
  const passRate =
    state.tafHistory.length > 0 ? Math.round((passCount / state.tafHistory.length) * 100) : 0;

  const completedRuns = state.runWorkouts.filter(
    (r) => r.status === 'FEITO' || r.status === 'PARCIAL'
  ).length;
  const totalRuns = Math.max(1, state.runWorkouts.length);
  const runAdherence = Math.round((completedRuns / totalRuns) * 100);

  const totalStrengthVolume = state.strengthHistory.reduce((acc, s) => acc + s.totalVolumeKg, 0);

  const exerciseProgressionMap = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        isTimed: boolean;
        points: {
          dateShort: string;
          fullDate: string;
          maxWeightKg: number;
          bestRepsOrSec: number;
          totalRepsOrSec: number;
          volumeKg: number;
          setsCount: number;
        }[];
      }
    >();

    const chronologicalSessions = [...state.strengthHistory].sort((a, b) => a.id - b.id);
    chronologicalSessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        if (!ex.sets.length) return;
        const key = ex.exerciseId || ex.exerciseName;
        const entry = map.get(key) ?? {
          id: key,
          name: ex.exerciseName,
          isTimed: ex.isTimed,
          points: [],
        };
        const maxWeightKg = Math.max(...ex.sets.map((s) => s.weightKg));
        const bestRepsOrSec = Math.max(...ex.sets.map((s) => s.repsOrSeconds));
        const totalRepsOrSec = ex.sets.reduce((acc, s) => acc + s.repsOrSeconds, 0);
        const volumeKg = Math.round(
          ex.sets.reduce((acc, s) => acc + s.weightKg * s.repsOrSeconds, 0)
        );
        entry.points.push({
          dateShort: session.dateStr.slice(0, 5),
          fullDate: session.dateStr,
          maxWeightKg,
          bestRepsOrSec,
          totalRepsOrSec,
          volumeKg,
          setsCount: ex.sets.length,
        });
        map.set(key, entry);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.points.length - a.points.length);
  }, [state.strengthHistory]);

  const activeExerciseAnalytics =
    exerciseProgressionMap.find((e) => e.id === selectedExerciseKey) ??
    exerciseProgressionMap[0] ??
    null;

  const activeExerciseHasLoad = activeExerciseAnalytics
    ? activeExerciseAnalytics.points.some((p) => p.maxWeightKg > 0)
    : false;
  const effectiveExerciseMetric =
    exerciseMetric === 'LOAD' && !activeExerciseHasLoad ? 'BEST_SET' : exerciseMetric;

  const vdotDomainMin = Math.max(
    25,
    Math.floor(Math.min(...vdotSeries.map((p) => p.vdot), state.vdot) - 3)
  );
  const vdotDomainMax = Math.min(
    70,
    Math.ceil(Math.max(...vdotSeries.map((p) => p.vdot), state.vdot, 46) + 3)
  );

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D6D2C7] dark:border-[#26262E] pb-5">
        <div>
          <MetadataLine
            items={['ANÁLISE LONGITUDINAL VDOT', 'TENDÊNCIAS TAF PRF', 'PROGRESSÃO DE CARGA']}
          />
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-[0.01em] text-[#111114] dark:text-[#F5F4EF] mt-1 leading-none">
            Painel de Desempenho
          </h1>
        </div>
        <ActionButton
          text="Registrar Marco VDOT"
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          onClick={() => {
            setManualVdot(String(state.vdot));
            setManualNote('');
            setShowVdotModal(true);
          }}
          className="self-start sm:self-auto"
        />
      </div>

      {/* 2x2 Hairline KPI Ticker */}
      <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] grid grid-cols-2 divide-y divide-x divide-[#D6D2C7] dark:divide-[#26262E]">
        <div className="p-4 sm:p-5 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#6B6B76] dark:text-[#8A8A96] block">
            VDOT Atual
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold text-[#CA8A04] dark:text-[#EAB308] leading-none tabular-nums">
              {state.vdot}
            </span>
            {vdotDelta !== null && (
              <span
                className={`font-mono text-xs font-bold tabular-nums ${
                  vdotDelta >= 0
                    ? 'text-[#15803D] dark:text-[#22C55E]'
                    : 'text-[#DC2626] dark:text-[#EF4444]'
                }`}
              >
                {vdotDelta >= 0 ? `+${vdotDelta}` : vdotDelta}
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96] block tabular-nums">
            Limiar {currentPaces.thresholdKm}
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#6B6B76] dark:text-[#8A8A96] block">
            Último Simulado TAF
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold text-[#111114] dark:text-[#F5F4EF] leading-none tabular-nums">
              {latestTaf ? latestTaf.totalPts.toFixed(1) : '—'}
            </span>
            {tafDelta !== null && (
              <span
                className={`font-mono text-xs font-bold tabular-nums ${
                  tafDelta >= 0
                    ? 'text-[#15803D] dark:text-[#22C55E]'
                    : 'text-[#DC2626] dark:text-[#EF4444]'
                }`}
              >
                {tafDelta >= 0 ? `+${tafDelta.toFixed(1)}` : tafDelta.toFixed(1)} pts
              </span>
            )}
          </div>
          <span className="text-xs text-[#6B6B76] dark:text-[#8A8A96] block">
            {latestTaf
              ? latestTaf.totalPts >= 12
                ? `Apto em ${latestTaf.fullDate}`
                : `Abaixo do corte em ${latestTaf.fullDate}`
              : 'Nenhum simulado registrado'}
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#6B6B76] dark:text-[#8A8A96] block">
            Taxa de Aprovação
          </span>
          <span className="font-display text-4xl font-extrabold text-[#111114] dark:text-[#F5F4EF] leading-none tabular-nums block">
            {state.tafHistory.length > 0 ? `${passRate}%` : '—'}
          </span>
          <span className="text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96] block tabular-nums">
            {passCount} de {state.tafHistory.length} acima de 12.0 pts
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#6B6B76] dark:text-[#8A8A96] block">
            Adesão na Corrida
          </span>
          <span className="font-display text-4xl font-extrabold text-[#111114] dark:text-[#F5F4EF] leading-none tabular-nums block">
            {runAdherence}%
          </span>
          <span className="text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96] block tabular-nums">
            {completedRuns}/{totalRuns} sessões concluídas
          </span>
        </div>
      </section>

      {/* Primary Charts Stack */}
      <div className="space-y-5">
        {/* Chart 1: TAF Score Trends */}
        <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-4 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div>
              <h2 className="font-display text-2xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF]">
                Evolução da Pontuação TAF
              </h2>
              <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] mt-0.5">
                {tafChartMode === 'TOTAL'
                  ? 'Pontuação geral de 0 a 25 pts com linha de corte oficial em 12.0'
                  : 'Comparativo longitudinal das 5 provas (escala 0 a 5.0 pts)'}
              </p>
            </div>
            <SegmentedControl
              options={[
                { key: 'TOTAL', label: 'Total' },
                { key: 'DISCIPLINES', label: 'Por prova' },
              ]}
              selectedKey={tafChartMode}
              onSelect={(k) => setTafChartMode(k as 'TOTAL' | 'DISCIPLINES')}
            />
          </div>

          {tafTrendData.length === 0 ? (
            <div className="flex-1 min-h-[260px] rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-dashed border-[#D6D2C7] dark:border-[#2E2E38] flex flex-col items-center justify-center text-center p-6 space-y-3">
              <TrendingUp className="w-6 h-6 text-[#8A8A96]" />
              <div className="space-y-1 max-w-sm">
                <p className="text-sm font-semibold text-[#111114] dark:text-[#F5F4EF]">
                  Sem simulados para plotar tendência
                </p>
                <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] leading-relaxed">
                  Registre seu primeiro simulado na aba TAF para visualizar a curva evolutiva geral e por disciplina.
                </p>
              </div>
              <ActionButton
                text="Ir para Simulados TAF"
                variant="navy"
                icon={<ArrowUpRight className="w-4 h-4" />}
                onClick={onNavigateToTaf}
              />
            </div>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                {tafChartMode === 'TOTAL' ? (
                  <AreaChart
                    data={tafTrendData}
                    margin={{ top: 12, right: 16, left: -12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="tafScoreFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartGold} stopOpacity={isDark ? 0.35 : 0.25} />
                        <stop offset="95%" stopColor={chartGold} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                    <XAxis
                      dataKey="dateShort"
                      tick={{ fontSize: 11, fill: chartAxis, fontFamily: 'IBM Plex Mono' }}
                      axisLine={{ stroke: chartGrid }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 25]}
                      ticks={[0, 5, 12, 18, 25]}
                      tick={{ fontSize: 11, fill: chartAxis, fontFamily: 'IBM Plex Mono' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine
                      y={12}
                      stroke={chartGold}
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: 'Corte 12.0',
                        position: 'insideTopRight',
                        fill: chartGold,
                        fontSize: 11,
                        fontFamily: 'IBM Plex Mono',
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const row = payload[0].payload as (typeof tafTrendData)[number];
                        return (
                          <div className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#32323D] p-3 shadow-lg text-xs space-y-1.5">
                            <div className="flex items-center justify-between gap-4 border-b border-[#E4E0D7] dark:border-[#26262E] pb-1.5">
                              <span className="font-mono font-semibold text-[#6B6B76] dark:text-[#8A8A96]">
                                {row.fullDate}
                              </span>
                              <span
                                className={`font-mono font-bold ${
                                  row.totalPts >= 12
                                    ? 'text-[#15803D] dark:text-[#22C55E]'
                                    : 'text-[#DC2626] dark:text-[#EF4444]'
                                }`}
                              >
                                {row.totalPts.toFixed(1)} / 25 pts
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-[11px] text-[#47474F] dark:text-[#C4C4CC]">
                              <span>Barra: {row.barra.toFixed(1)}</span>
                              <span>Abdom.: {row.abdominal.toFixed(1)}</span>
                              <span>Impulsão: {row.impulsao.toFixed(1)}</span>
                              <span>Corrida: {row.corrida.toFixed(1)}</span>
                              <span>Shuttle: {row.shuttle.toFixed(1)}</span>
                              <span className="text-[#CA8A04] dark:text-[#EAB308]">
                                VDOT: {row.impliedVdot}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalPts"
                      name="Total TAF"
                      stroke={chartPrimaryLine}
                      strokeWidth={2.5}
                      fill="url(#tafScoreFill)"
                      dot={{ r: 4, fill: chartPrimaryLine, stroke: chartNodeStroke, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: chartGold, stroke: chartNodeStroke, strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <LineChart
                    data={tafTrendData}
                    margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                    <XAxis
                      dataKey="dateShort"
                      tick={{ fontSize: 11, fill: chartAxis, fontFamily: 'IBM Plex Mono' }}
                      axisLine={{ stroke: chartGrid }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      tick={{ fontSize: 11, fill: chartAxis, fontFamily: 'IBM Plex Mono' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={chartTooltipItemStyle}
                      labelStyle={chartTooltipLabelStyle}
                    />
                    <Legend wrapperStyle={chartLegendStyle} />
                    <Line
                      type="monotone"
                      dataKey="barra"
                      name="Barra"
                      stroke={chartPrimaryLine}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="abdominal"
                      name="Abdominal"
                      stroke="#A1A1AA"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="impulsao"
                      name="Impulsão"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="corrida"
                      name="Corrida"
                      stroke={chartGold}
                      strokeWidth={2.5}
                      dot={{ r: 3.5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="shuttle"
                      name="Shuttle"
                      stroke={chartSuccess}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Chart 2: VDOT Progress Over Time */}
        <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-4 flex flex-col justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF]">
              Progresso de VDOT
            </h2>
            <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] mt-0.5">
              Histórico combinado de testes de pista, ajustes manuais e simulados de 12 min
            </p>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={vdotSeries}
                margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="vdotFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartGold} stopOpacity={isDark ? 0.32 : 0.24} />
                    <stop offset="95%" stopColor={chartGold} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: chartAxis, fontFamily: 'IBM Plex Mono' }}
                  axisLine={{ stroke: chartGrid }}
                  tickLine={false}
                />
                <YAxis
                  domain={[vdotDomainMin, vdotDomainMax]}
                  tick={{ fontSize: 11, fill: chartAxis, fontFamily: 'IBM Plex Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine
                  y={45}
                  stroke={chartSuccess}
                  strokeDasharray="4 4"
                  strokeWidth={1.25}
                  label={{
                    value: 'Meta VDOT 45',
                    position: 'insideTopRight',
                    fill: chartSuccess,
                    fontSize: 10,
                    fontFamily: 'IBM Plex Mono',
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0].payload as VdotPoint;
                    return (
                      <div className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#32323D] p-3 shadow-lg text-xs space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-mono text-[#6B6B76] dark:text-[#8A8A96]">
                            {p.fullDate}
                          </span>
                          <span className="font-mono font-bold text-[#CA8A04] dark:text-[#EAB308]">
                            VDOT {p.vdot}
                          </span>
                        </div>
                        <p className="font-semibold text-[#111114] dark:text-[#F5F4EF]">
                          {p.source}
                        </p>
                        <p className="font-mono text-[11px] text-[#47474F] dark:text-[#C4C4CC]">
                          Limiar (T): {p.thresholdKm}
                        </p>
                        {p.note && (
                          <p className="text-[11px] text-[#6B6B76] dark:text-[#8A8A96]">{p.note}</p>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="vdot"
                  name="VDOT"
                  stroke={chartGold}
                  strokeWidth={2.5}
                  fill="url(#vdotFill)"
                  dot={{ r: 4.5, fill: chartGold, stroke: chartNodeStroke, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: chartPrimaryLine, stroke: chartNodeStroke, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {vdotSeries.length <= 1 && (
            <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] border-t border-[#E4E0D7] dark:border-[#26262E] pt-3">
              Registre novos testes de pista ou simulados de 12 minutos para traçar sua curva completa de evolução aeróbica.
            </p>
          )}
        </section>
      </div>

      {/* Secondary Analytics Stack */}
      <div className="space-y-5">
        {/* Chart 3: Discipline Balance */}
        <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-4 flex flex-col justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF]">
              Equilíbrio por Prova TAF
            </h2>
            <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] mt-0.5">
              Último simulado comparado ao recorde pessoal em cada exercício (0 a 5.0 pts)
            </p>
          </div>

          {disciplineComparison.length === 0 ? (
            <div className="flex-1 min-h-[240px] rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-dashed border-[#D6D2C7] dark:border-[#2E2E38] flex flex-col items-center justify-center text-center p-6 space-y-2">
              <p className="text-sm font-semibold text-[#111114] dark:text-[#F5F4EF]">
                Aguardando dados das 5 provas
              </p>
              <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] max-w-xs">
                Assim que um simulado for salvo, você verá aqui o equilíbrio entre Barra, Abdominal, Impulsão, Corrida e Shuttle.
              </p>
            </div>
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={disciplineComparison}
                  margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                  <XAxis
                    dataKey="prova"
                    tick={{ fontSize: 11, fill: chartAxisStrong, fontWeight: 600 }}
                    axisLine={{ stroke: chartGrid }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    tick={{ fontSize: 11, fill: chartAxis, fontFamily: 'IBM Plex Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine
                    y={2.4}
                    stroke={isDark ? '#52525B' : '#A1A1AA'}
                    strokeDasharray="3 3"
                  />
                  <Tooltip
                    cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(17, 17, 20, 0.04)' }}
                    contentStyle={chartTooltipStyle}
                    itemStyle={chartTooltipItemStyle}
                    labelStyle={chartTooltipLabelStyle}
                  />
                  <Legend wrapperStyle={chartLegendStyle} />
                  <Bar
                    dataKey="ultimo"
                    name="Último"
                    fill={chartGold}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey="recorde"
                    name="Recorde"
                    fill={isDark ? '#F5F4EF' : '#111114'}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Chart 4: Jack Daniels Phase Completion */}
        <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-4 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF]">
                Execução do Ciclo de Corrida
              </h2>
              <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] mt-0.5">
                Distribuição real de treinos concluídos, parciais e pendentes por fase
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToRun}
              className="text-xs font-mono font-bold uppercase text-[#CA8A04] dark:text-[#EAB308] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Abrir plano
            </button>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={phaseProgressData}
                margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis
                  dataKey="fase"
                  tick={{ fontSize: 11, fill: chartAxisStrong, fontWeight: 600 }}
                  axisLine={{ stroke: chartGrid }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: chartAxis, fontFamily: 'IBM Plex Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(17, 17, 20, 0.04)' }}
                  contentStyle={chartTooltipStyle}
                  itemStyle={chartTooltipItemStyle}
                  labelStyle={chartTooltipLabelStyle}
                />
                <Legend wrapperStyle={chartLegendStyle} />
                <Bar
                  dataKey="feitos"
                  name="Feitos"
                  stackId="runs"
                  fill={chartSuccess}
                  maxBarSize={44}
                />
                <Bar
                  dataKey="parciais"
                  name="Parciais"
                  stackId="runs"
                  fill={chartGold}
                  maxBarSize={44}
                />
                <Bar
                  dataKey="pendentes"
                  name="Pendentes"
                  stackId="runs"
                  fill={isDark ? '#2E2E38' : '#D6D2C7'}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-[#E4E0D7] dark:border-[#26262E] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B6B76] dark:text-[#8A8A96]">
            <span>
              Sessões de força registradas:{' '}
              <strong className="font-mono text-[#111114] dark:text-[#F5F4EF]">
                {state.strengthHistory.length}
              </strong>
            </span>
            <span>
              Volume acumulado:{' '}
              <strong className="font-mono text-[#111114] dark:text-[#F5F4EF] tabular-nums">
                {Math.round(totalStrengthVolume)} kg
              </strong>
            </span>
          </div>
        </section>
      </div>

      {/* Tertiary Analytics Row: Per-Exercise Strength Progression */}
      <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF]">
              Evolução por Exercício de Força
            </h2>
            <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] mt-0.5">
              Acompanhe recordes pessoais de carga, repetições ou tempo sustentado em cada exercício
            </p>
          </div>

          {exerciseProgressionMap.length > 0 && activeExerciseAnalytics && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                aria-label="Selecionar exercício de força"
                value={activeExerciseAnalytics.id}
                onChange={(e) => setSelectedExerciseKey(e.target.value)}
                className="h-10 rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-xs font-semibold text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
              >
                {exerciseProgressionMap.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.points.length}×)
                  </option>
                ))}
              </select>
              <SegmentedControl
                options={[
                  ...(activeExerciseHasLoad ? [{ key: 'LOAD', label: 'Carga (kg)' }] : []),
                  {
                    key: 'BEST_SET',
                    label: activeExerciseAnalytics.isTimed ? 'Melhor (s)' : 'Melhor Série',
                  },
                  ...(activeExerciseHasLoad ? [{ key: 'VOLUME', label: 'Volume' }] : []),
                ]}
                selectedKey={effectiveExerciseMetric}
                onSelect={(k) => setExerciseMetric(k as 'LOAD' | 'BEST_SET' | 'VOLUME')}
              />
            </div>
          )}
        </div>

        {!activeExerciseAnalytics ? (
          <div className="min-h-[210px] rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-dashed border-[#D6D2C7] dark:border-[#2E2E38] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Dumbbell className="w-6 h-6 text-[#8A8A96]" />
            <div className="space-y-1 max-w-sm">
              <p className="text-sm font-semibold text-[#111114] dark:text-[#F5F4EF]">
                Nenhuma sessão de força concluída ainda
              </p>
              <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] leading-relaxed">
                Finalize um treino na aba Treinos para acompanhar a curva de evolução de barra fixa, abdominal, búlgaro e exercícios personalizados.
              </p>
            </div>
            <ActionButton
              text="Abrir Treinos de Força"
              variant="navy"
              icon={<ArrowUpRight className="w-4 h-4" />}
              onClick={onNavigateToForca}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] p-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-[#6B6B76] dark:text-[#8A8A96] block">
                  {activeExerciseHasLoad ? 'Recorde de Carga' : 'Melhor Série'}
                </span>
                <span className="font-mono text-lg sm:text-xl font-bold text-[#111114] dark:text-[#F5F4EF] tabular-nums">
                  {activeExerciseHasLoad
                    ? `${Math.max(...activeExerciseAnalytics.points.map((p) => p.maxWeightKg))} kg`
                    : `${Math.max(...activeExerciseAnalytics.points.map((p) => p.bestRepsOrSec))} ${
                        activeExerciseAnalytics.isTimed ? 's' : 'reps'
                      }`}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-[#6B6B76] dark:text-[#8A8A96] block">
                  {activeExerciseHasLoad ? 'Melhor Série' : 'Total Máx./Sessão'}
                </span>
                <span className="font-mono text-lg sm:text-xl font-bold text-[#CA8A04] dark:text-[#EAB308] tabular-nums">
                  {activeExerciseHasLoad
                    ? `${Math.max(...activeExerciseAnalytics.points.map((p) => p.bestRepsOrSec))} ${
                        activeExerciseAnalytics.isTimed ? 's' : 'reps'
                      }`
                    : `${Math.max(...activeExerciseAnalytics.points.map((p) => p.totalRepsOrSec))} ${
                        activeExerciseAnalytics.isTimed ? 's' : 'reps'
                      }`}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-[#6B6B76] dark:text-[#8A8A96] block">
                  Sessões
                </span>
                <span className="font-mono text-lg sm:text-xl font-bold text-[#111114] dark:text-[#F5F4EF] tabular-nums">
                  {activeExerciseAnalytics.points.length}
                </span>
              </div>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activeExerciseAnalytics.points}
                  margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="strengthExFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartSuccess} stopOpacity={isDark ? 0.3 : 0.2} />
                      <stop offset="95%" stopColor={chartSuccess} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                  <XAxis
                    dataKey="dateShort"
                    tick={{ fontSize: 11, fill: chartAxis, fontFamily: 'IBM Plex Mono' }}
                    axisLine={{ stroke: chartGrid }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: chartAxis, fontFamily: 'IBM Plex Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    itemStyle={chartTooltipItemStyle}
                    labelStyle={chartTooltipLabelStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey={
                      effectiveExerciseMetric === 'LOAD'
                        ? 'maxWeightKg'
                        : effectiveExerciseMetric === 'VOLUME'
                          ? 'volumeKg'
                          : 'bestRepsOrSec'
                    }
                    name={
                      effectiveExerciseMetric === 'LOAD'
                        ? 'Carga Máx (kg)'
                        : effectiveExerciseMetric === 'VOLUME'
                          ? 'Volume (kg)'
                          : activeExerciseAnalytics.isTimed
                            ? 'Melhor Série (s)'
                            : 'Melhor Série (reps)'
                    }
                    stroke={chartSuccess}
                    strokeWidth={2.5}
                    fill="url(#strengthExFill)"
                    dot={{ r: 4, fill: chartSuccess, stroke: chartNodeStroke, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: chartGold, stroke: chartNodeStroke, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>

      {/* Modal: Log VDOT Checkpoint */}
      {showVdotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] rounded-t-[6px] sm:rounded-[6px] p-5 sm:p-6 space-y-5 safe-bottom shadow-2xl">
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#D6D2C7] dark:bg-[#2E2E38] mx-auto -mt-1 mb-1" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <MetadataLine items={['HISTÓRICO DE EVOLUÇÃO']} />
                <h3 className="font-display text-3xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-1">
                  Registrar Marco VDOT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVdotModal(false)}
                aria-label="Fechar"
                className="min-w-[44px] min-h-[44px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-[#F3F1EC] dark:bg-[#1A1A20] flex items-center justify-center text-[#6B6B76] dark:text-[#8A8A96] hover:text-[#111114] dark:hover:text-[#F5F4EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <SegmentedControl
              options={[
                { key: 'TESTE', label: 'Por Teste de Pista' },
                { key: 'MANUAL', label: 'Valor Direto' },
              ]}
              selectedKey={vdotModalMode}
              onSelect={(k) => setVdotModalMode(k as 'TESTE' | 'MANUAL')}
            />

            {vdotModalMode === 'TESTE' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                      Distância (m)
                    </label>
                    <input
                      type="number"
                      value={testDist}
                      onChange={(e) => setTestDist(e.target.value)}
                      className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                      Minutos
                    </label>
                    <input
                      type="number"
                      value={testMin}
                      onChange={(e) => setTestMin(e.target.value)}
                      className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                      Segundos
                    </label>
                    <input
                      type="number"
                      value={testSec}
                      onChange={(e) => setTestSec(e.target.value)}
                      className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                    />
                  </div>
                </div>
                <ActionButton
                  text="Calcular e Salvar no Gráfico"
                  onClick={() => {
                    const d = Number(testDist) || 2800;
                    const s = (Number(testMin) || 12) * 60 + (Number(testSec) || 0);
                    onCalculateVdotFromTest(d, s);
                    setShowVdotModal(false);
                  }}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                    Índice VDOT (30 a 65)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={65}
                    value={manualVdot}
                    onChange={(e) => setManualVdot(e.target.value)}
                    className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                    Observação (opcional)
                  </label>
                  <input
                    type="text"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    placeholder="Ex.: Pós-semana 12, pista oficial..."
                    className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm text-[#111114] dark:text-[#F5F4EF] placeholder:text-[#8A8A96] outline-none focus:border-[#EAB308]"
                  />
                </div>
                <ActionButton
                  text="Salvar Marco VDOT"
                  onClick={() => {
                    onLogVdot(Number(manualVdot) || state.vdot, 'manual', manualNote);
                    setShowVdotModal(false);
                  }}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

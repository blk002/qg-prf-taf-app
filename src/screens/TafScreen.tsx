import { useEffect, useState } from 'react';
import { ClipboardCheck, Edit2, Pause, Play, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import examArenaImg from '../assets/images/prf_exam_arena_1795657968474.jpg';
import {
  ActionButton,
  LinearProgressBar,
  MetadataLine,
  TafLineChart,
} from '../components/UiKit';
import { buildSimulado, findWeakestTest } from '../domain/prfTafScoring';
import type { TafAppState, TafSimulado } from '../domain/types';

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TafScreen({
  state,
  todayBr,
  onStartGuidedExam,
  onSaveSimulado,
  onDeleteSimulado,
}: {
  state: TafAppState;
  todayBr: string;
  onStartGuidedExam: () => void;
  onSaveSimulado: (
    editingId: number | null,
    data: string,
    genero: string,
    barra: number,
    abdominal: number,
    impulsao: number,
    corrida: number,
    shuttle: number
  ) => void;
  onDeleteSimulado: (id: number) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingSim, setEditingSim] = useState<TafSimulado | null>(null);

  const [timerMode, setTimerMode] = useState<'CORRIDA' | 'ABDOMINAL' | 'SHUTTLE'>('CORRIDA');
  const [timerSec, setTimerSec] = useState(12 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  const [dataStr, setDataStr] = useState(todayBr);
  const [genero, setGenero] = useState('masculino');
  const [barra, setBarra] = useState('5');
  const [abdominal, setAbdominal] = useState('45');
  const [impulsao, setImpulsao] = useState('2.15');
  const [corrida, setCorrida] = useState('2650');
  const [shuttle, setShuttle] = useState('12.0');

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerSec((prev) => {
        if (timerMode === 'SHUTTLE') return prev + 1;
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, timerMode]);

  const switchTimerMode = (mode: 'CORRIDA' | 'ABDOMINAL' | 'SHUTTLE') => {
    setTimerRunning(false);
    setTimerMode(mode);
    setTimerSec(mode === 'CORRIDA' ? 12 * 60 : mode === 'ABDOMINAL' ? 60 : 0);
  };

  const openNewModal = () => {
    setEditingSim(null);
    setDataStr(todayBr);
    setGenero('masculino');
    setBarra('5');
    setAbdominal('45');
    setImpulsao('2.15');
    setCorrida('2650');
    setShuttle('12.0');
    setShowModal(true);
  };

  const openEditModal = (sim: TafSimulado) => {
    setEditingSim(sim);
    setDataStr(sim.data);
    setGenero(sim.genero);
    setBarra(String(sim.barra));
    setAbdominal(String(sim.abdominal));
    setImpulsao(String(sim.impulsao));
    setCorrida(String(sim.corrida));
    setShuttle(String(sim.shuttle));
    setShowModal(true);
  };

  const count = state.tafHistory.length;
  const media = count > 0 ? state.tafHistory.reduce((acc, s) => acc + s.totalPts, 0) / count : 0;
  const recorde = state.tafHistory.reduce((max, s) => Math.max(max, s.totalPts), 0);
  const latestSim = state.tafHistory[state.tafHistory.length - 1] ?? null;
  const weakest = findWeakestTest(state.tafHistory);

  const previewSim = buildSimulado(
    0,
    dataStr,
    genero,
    Number(barra) || 0,
    Number(abdominal) || 0,
    Number(impulsao.replace(',', '.')) || 0,
    Number(corrida) || 0,
    Number(shuttle.replace(',', '.')) || 0
  );

  const latestDisciplines = latestSim
    ? [
        {
          name: 'Barra Fixa',
          raw: `${latestSim.barra} ${latestSim.genero === 'feminino' ? 's' : 'reps'}`,
          pts: latestSim.ptsBarra,
        },
        { name: 'Abdominal', raw: `${latestSim.abdominal} reps`, pts: latestSim.ptsAbdominal },
        {
          name: 'Impulsão Horizontal',
          raw: `${latestSim.impulsao.toFixed(2)} m`,
          pts: latestSim.ptsImpulsao,
        },
        { name: 'Corrida 12 min', raw: `${latestSim.corrida} m`, pts: latestSim.ptsCorrida },
        { name: 'Shuttle Run', raw: `${latestSim.shuttle.toFixed(1)} s`, pts: latestSim.ptsShuttle },
      ]
    : [];

  return (
    <div className="space-y-7">
      {/* Official Twilight Stadium Arena Scoreboard Header */}
      <section className="relative rounded-[6px] overflow-hidden bg-[#0E0E12] border border-[#26262E] text-[#F5F4EF]">
        <img
          src={examArenaImg}
          alt="Estádio de atletismo com pista e caixa de salto sob refletores"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C]/95 via-[#0A0A0C]/80 to-[#0A0A0C]/45"
        />
        <div className="relative z-10 p-5 space-y-5">
          <div className="space-y-3.5">
            <MetadataLine
              items={['TABELA OFICIAL PRF', 'CORTE 12.0 PTS', 'ESCALA 0 A 25.0']}
              tone="gold"
            />
            <h1 className="font-display text-4xl font-extrabold uppercase tracking-[0.01em] text-[#F5F4EF] leading-[0.95]">
              Avaliação Oficial TAF PRF
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <ActionButton
                text="Simulado Oficial Guiado"
                icon={<ClipboardCheck className="w-4 h-4" />}
                onClick={onStartGuidedExam}
              />
              <button
                type="button"
                onClick={openNewModal}
                className="min-h-[44px] px-4 rounded-[4px] bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-[#F5F4EF] inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Lançar Manual</span>
              </button>
            </div>
          </div>

          <div className="rounded-[4px] bg-[#0A0A0C]/80 backdrop-blur-md border border-white/15 p-4 space-y-3.5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#A1A1AA] block">
                  Recorde Geral
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`font-display text-5xl sm:text-6xl font-extrabold leading-none tabular-nums ${
                      count === 0
                        ? 'text-[#F5F4EF]'
                        : recorde >= 12
                          ? 'text-[#22C55E]'
                          : 'text-[#EF4444]'
                    }`}
                  >
                    {recorde.toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-[#8A8A96]">/ 25.0 PTS</span>
                </div>
              </div>
              <div className="text-right font-mono text-xs space-y-1">
                <p className="text-[#C4C4CC]">
                  Média <strong className="text-[#F5F4EF] tabular-nums">{media.toFixed(1)}</strong>
                </p>
                <p className="text-[#C4C4CC]">
                  Provas <strong className="text-[#F5F4EF] tabular-nums">{count}</strong>
                </p>
                <p className="text-[#EAB308] font-bold truncate max-w-[140px]">
                  {weakest ? `Foco: ${weakest.name}` : 'Sem gargalo'}
                </p>
              </div>
            </div>
            <LinearProgressBar
              value={recorde}
              max={25}
              cutoff={12}
              barColor={recorde >= 12 ? '#22C55E' : '#EAB308'}
              heightClass="h-1.5"
              onDarkSurface
            />
            <p className="text-[11px] font-mono text-[#A1A1AA]">
              {count === 0
                ? 'Nenhum simulado registrado ainda'
                : recorde >= 12
                  ? `APTO · +${(recorde - 12).toFixed(1)} pts acima da linha de corte`
                  : `ABAIXO DO CORTE · faltam ${(12 - recorde).toFixed(1)} pts`}
            </p>
          </div>
        </div>
      </section>

      {/* Mobile Stacked 5-Discipline Breakdown & Curve + Matte Carbon Chronograph */}
      <div className="space-y-5">
        <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-4 space-y-5">
          {latestDisciplines.length > 0 ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="uppercase tracking-[0.06em] font-bold text-[#111114] dark:text-[#F5F4EF]">
                  Último simulado ({latestSim?.data})
                </span>
                <span className="text-[#6B6B76] dark:text-[#8A8A96]">0–5 PTS</span>
              </div>
              <div className="space-y-3">
                {latestDisciplines.map((d) => (
                  <div
                    key={d.name}
                    className="grid grid-cols-[8.5rem_1fr_3rem] items-center gap-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[#111114] dark:text-[#F5F4EF] block truncate">
                        {d.name}
                      </span>
                      <span className="font-mono text-[11px] text-[#6B6B76] dark:text-[#8A8A96] tabular-nums">
                        {d.raw}
                      </span>
                    </div>
                    <LinearProgressBar
                      value={d.pts}
                      max={5}
                      barColor={d.pts >= 2.5 ? '#22C55E' : '#EAB308'}
                    />
                    <span className="font-mono font-bold text-right text-[#111114] dark:text-[#F5F4EF] tabular-nums">
                      {d.pts.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-5 text-center space-y-2">
              <p className="font-display text-2xl font-bold uppercase text-[#111114] dark:text-[#F5F4EF]">
                Aguardando primeiro simulado
              </p>
              <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96]">
                Execute o Simulado Oficial Guiado ou lance manualmente suas marcas para gerar o diagnóstico das 5 provas.
              </p>
            </div>
          )}

          {state.tafHistory.length > 0 && (
            <div className="pt-4 border-t border-[#E4E0D7] dark:border-[#26262E]">
              <TafLineChart scores={state.tafHistory.map((s) => [s.data, s.totalPts])} />
            </div>
          )}
        </section>

        {/* Matte Carbon Hardware Chronograph Instrument */}
        <section className="rounded-[4px] bg-[#111114] dark:bg-[#121216] text-[#F5F4EF] border border-[#26262E] p-4 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <MetadataLine items={['INSTRUMENTO DE PISTA']} className="text-[#8A8A96]" />
              <h2 className="font-display text-3xl font-extrabold uppercase mt-0.5 text-[#F5F4EF]">
                Cronômetro Oficial
              </h2>
            </div>
            <span className="font-mono text-[10px] tracking-[0.08em] text-[#EAB308] font-bold">
              {timerMode === 'SHUTTLE' ? 'PROGRESSIVO' : 'REGRESSIVO'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 rounded-[4px] bg-[#0A0A0C] border border-[#26262E]">
            {[
              { key: 'CORRIDA', label: '12 min' },
              { key: 'ABDOMINAL', label: '1 min' },
              { key: 'SHUTTLE', label: 'Shuttle' },
            ].map((opt) => {
              const active = timerMode === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => switchTimerMode(opt.key as 'CORRIDA' | 'ABDOMINAL' | 'SHUTTLE')}
                  className={`min-h-[36px] rounded-[3px] text-xs font-mono font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#EAB308] text-[#0A0A0C]'
                      : 'text-[#A1A1AA] hover:text-[#F5F4EF]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Recessed Obsidian LCD Readout */}
          <div className="rounded-[4px] bg-[#050507] border border-[#26262E] py-8 px-4 text-center">
            <span className="font-mono text-6xl font-bold tracking-tight text-[#F5F4EF] tabular-nums block">
              {formatTimer(timerSec)}
            </span>
            <span className="text-[11px] font-mono text-[#8A8A96] mt-3 block">
              {timerMode === 'CORRIDA'
                ? 'Teste de 12 minutos · Corrida de resistência'
                : timerMode === 'ABDOMINAL'
                  ? 'Flexão abdominal · Máximo em 60 segundos'
                  : 'Ir e Vir (Shuttle Run) · Tempo cronometrado'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => switchTimerMode(timerMode)}
              aria-label="Zerar cronômetro"
              className="min-w-[48px] min-h-[48px] rounded-[4px] bg-[#1A1A20] hover:bg-[#26262E] border border-[#2E2E38] flex items-center justify-center text-[#F5F4EF] cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <ActionButton
              text={timerRunning ? 'Pausar' : 'Iniciar Cronômetro'}
              icon={
                timerRunning ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )
              }
              onClick={() => setTimerRunning((r) => !r)}
              className="flex-1"
            />
          </div>
        </section>
      </div>

      {/* Bottom Full-Width Simulados Comparison Ledger */}
      <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#D6D2C7] dark:border-[#26262E] bg-[#EAE7DF] dark:bg-[#1A1A20] flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-[0.08em] font-bold text-[#111114] dark:text-[#F5F4EF]">
            Histórico Comparativo de Simulados ({count})
          </h2>
          {count > 0 && (
            <span className="text-[11px] font-mono text-[#6B6B76] dark:text-[#8A8A96]">
              Pontuação por prova
            </span>
          )}
        </div>

        {count === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-[#111114] dark:text-[#F5F4EF]">
              Nenhum simulado registrado ainda
            </p>
            <p className="text-xs text-[#6B6B76] dark:text-[#8A8A96] max-w-md mx-auto">
              Lance suas marcas nas 5 provas oficiais para calcular a nota automática pela tabela PRF e descobrir onde ganhar pontos mais rápido.
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
              <ActionButton
                text="Iniciar Simulado Guiado"
                icon={<ClipboardCheck className="w-4 h-4" />}
                onClick={onStartGuidedExam}
              />
              <ActionButton
                text="Lançar Manualmente"
                variant="secondary"
                icon={<Plus className="w-4 h-4" />}
                onClick={openNewModal}
              />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-[#D6D2C7] dark:border-[#26262E] text-[10px] font-mono uppercase tracking-[0.08em] font-semibold text-[#6B6B76] dark:text-[#8A8A96]">
                  <th className="py-2.5 px-5">Data</th>
                  <th className="py-2.5 px-3">Sexo</th>
                  <th className="py-2.5 px-3 text-right">Barra</th>
                  <th className="py-2.5 px-3 text-right">Abdom.</th>
                  <th className="py-2.5 px-3 text-right">Impulsão</th>
                  <th className="py-2.5 px-3 text-right">Corrida</th>
                  <th className="py-2.5 px-3 text-right">Shuttle</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                  <th className="py-2.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D7] dark:divide-[#202028] text-xs">
                {[...state.tafHistory].reverse().map((sim) => {
                  const pass = sim.totalPts >= 12;
                  return (
                    <tr
                      key={sim.id}
                      className="hover:bg-[#F3F1EC] dark:hover:bg-[#1A1A20]/60 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono font-semibold text-[#111114] dark:text-[#F5F4EF] tabular-nums">
                        {sim.data}
                      </td>
                      <td className="py-3.5 px-3 text-[#6B6B76] dark:text-[#8A8A96]">
                        {sim.genero === 'feminino' ? 'Fem.' : 'Masc.'}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-right text-[#47474F] dark:text-[#C4C4CC] tabular-nums">
                        {sim.ptsBarra.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-right text-[#47474F] dark:text-[#C4C4CC] tabular-nums">
                        {sim.ptsAbdominal.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-right text-[#47474F] dark:text-[#C4C4CC] tabular-nums">
                        {sim.ptsImpulsao.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-right text-[#47474F] dark:text-[#C4C4CC] tabular-nums">
                        {sim.ptsCorrida.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-right text-[#47474F] dark:text-[#C4C4CC] tabular-nums">
                        {sim.ptsShuttle.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            pass
                              ? 'text-[#15803D] dark:text-[#22C55E]'
                              : 'text-[#DC2626] dark:text-[#EF4444]'
                          }`}
                        >
                          {sim.totalPts.toFixed(1)} pts
                        </span>
                        <span className="block font-mono text-[10px] uppercase text-[#6B6B76] dark:text-[#8A8A96]">
                          {pass ? 'Apto' : 'Abaixo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(sim)}
                            aria-label="Editar simulado"
                            className="w-9 h-9 rounded-[4px] hover:bg-[#EAE7DF] dark:hover:bg-[#24242C] inline-flex items-center justify-center text-[#47474F] dark:text-[#8A8A96] hover:text-[#111114] dark:hover:text-[#F5F4EF] cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSimulado(sim.id)}
                            aria-label="Excluir simulado"
                            className="w-9 h-9 rounded-[4px] hover:bg-[#FEF2F2] dark:hover:bg-[#EF4444]/15 inline-flex items-center justify-center text-[#47474F] dark:text-[#8A8A96] hover:text-[#DC2626] dark:hover:text-[#EF4444] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Calculadora Oficial Simulado */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] rounded-t-[6px] sm:rounded-[6px] p-5 sm:p-6 space-y-5 safe-bottom max-h-[90dvh] overflow-y-auto shadow-2xl">
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#D6D2C7] dark:bg-[#2E2E38] mx-auto -mt-1 mb-1" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <MetadataLine items={['CALCULADORA OFICIAL PRF']} />
                <h3 className="font-display text-3xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-1">
                  {editingSim ? 'Editar Simulado' : 'Novo Simulado TAF'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Fechar"
                className="min-w-[44px] min-h-[44px] rounded-[4px] border border-[#D6D2C7] dark:border-[#26262E] bg-[#F3F1EC] dark:bg-[#1A1A20] flex items-center justify-center text-[#6B6B76] dark:text-[#8A8A96] hover:text-[#111114] dark:hover:text-[#F5F4EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-[4px] bg-[#111114] dark:bg-[#0A0A0C] border border-[#26262E] p-4 flex items-center justify-between text-[#F5F4EF]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#8A8A96] block">
                  Nota Prevista
                </span>
                <span className="text-xs text-[#C4C4CC]">
                  {previewSim.totalPts >= 12 ? 'Acima do corte (12.0)' : 'Abaixo do corte (12.0)'}
                </span>
              </div>
              <span
                className={`font-display text-3xl font-extrabold tabular-nums ${
                  previewSim.totalPts >= 12 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
              >
                {previewSim.totalPts.toFixed(1)} / 25
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1">
                  Data
                </label>
                <input
                  type="text"
                  value={dataStr}
                  onChange={(e) => setDataStr(e.target.value)}
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1">
                  Sexo
                </label>
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                >
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#47474F] dark:text-[#C4C4CC] block mb-1">
                  Barra ({genero === 'feminino' ? 'seg' : 'reps'}) ·{' '}
                  <span className="font-mono font-bold text-[#CA8A04] dark:text-[#EAB308]">
                    {previewSim.ptsBarra.toFixed(1)}
                  </span>
                </label>
                <input
                  type="number"
                  step="1"
                  value={barra}
                  onChange={(e) => setBarra(e.target.value)}
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#47474F] dark:text-[#C4C4CC] block mb-1">
                  Abdominal ·{' '}
                  <span className="font-mono font-bold text-[#CA8A04] dark:text-[#EAB308]">
                    {previewSim.ptsAbdominal.toFixed(1)}
                  </span>
                </label>
                <input
                  type="number"
                  value={abdominal}
                  onChange={(e) => setAbdominal(e.target.value)}
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#47474F] dark:text-[#C4C4CC] block mb-1">
                  Impulsão (m) ·{' '}
                  <span className="font-mono font-bold text-[#CA8A04] dark:text-[#EAB308]">
                    {previewSim.ptsImpulsao.toFixed(1)}
                  </span>
                </label>
                <input
                  type="text"
                  value={impulsao}
                  onChange={(e) => setImpulsao(e.target.value)}
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#47474F] dark:text-[#C4C4CC] block mb-1">
                  Corrida 12m (m) ·{' '}
                  <span className="font-mono font-bold text-[#CA8A04] dark:text-[#EAB308]">
                    {previewSim.ptsCorrida.toFixed(1)}
                  </span>
                </label>
                <input
                  type="number"
                  value={corrida}
                  onChange={(e) => setCorrida(e.target.value)}
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-[#47474F] dark:text-[#C4C4CC] block mb-1">
                  Shuttle Run (seg) ·{' '}
                  <span className="font-mono font-bold text-[#CA8A04] dark:text-[#EAB308]">
                    {previewSim.ptsShuttle.toFixed(1)}
                  </span>
                </label>
                <input
                  type="text"
                  value={shuttle}
                  onChange={(e) => setShuttle(e.target.value)}
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
            </div>

            <ActionButton
              text="Salvar Simulado"
              onClick={() => {
                onSaveSimulado(
                  editingSim?.id ?? null,
                  dataStr,
                  genero,
                  Number(barra) || 0,
                  Number(abdominal) || 0,
                  Number(impulsao.replace(',', '.')) || 0,
                  Number(corrida) || 0,
                  Number(shuttle.replace(',', '.')) || 0
                );
                setShowModal(false);
              }}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

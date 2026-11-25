import { useEffect, useState } from 'react';
import { Edit2, Pause, Play, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import tafArenaImg from '../assets/images/taf_shuttle_asphalt_1795625269685.jpg';
import {
  ActionButton,
  EditorialRule,
  MediaBanner,
  MetadataLine,
  PerformanceArcGauge,
  SectionKicker,
  SegmentedControl,
  TafEvolutionChart,
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
  onSaveSimulado,
  onDeleteSimulado,
}: {
  state: TafAppState;
  todayBr: string;
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

  // Timers oficiais
  const [timerMode, setTimerMode] = useState<'CORRIDA' | 'ABDOMINAL' | 'SHUTTLE'>('CORRIDA');
  const [timerSec, setTimerSec] = useState(12 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Form simulado
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
  const weakest = findWeakestTest(state.tafHistory);
  const arcColor = count === 0 ? '#8A93A5' : recorde >= 12 ? '#22C55E' : '#EF4444';

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

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Top Arena Banner */}
      <MediaBanner
        src={tafArenaImg}
        alt="Quadra asfaltada de avaliação física com marcações do Shuttle Run"
      >
        <div className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div className="space-y-2">
            <MetadataLine
              items={['Tabela Oficial PRF', 'Corte 12.0 pts', 'Máximo 25.0 pts']}
              className="text-[#D1D5DB]"
            />
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#F5F7FA] leading-none text-balance">
              Simulados TAF PRF
            </h1>
          </div>
          <button
            type="button"
            onClick={openNewModal}
            className="self-start sm:self-auto min-h-[48px] px-5 rounded-xl bg-[#F5B700] hover:bg-[#FFCA2C] text-[#090B0E] font-bold text-sm inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Simulado</span>
          </button>
        </div>
      </MediaBanner>

      {/* 2-Column Main Dashboard: Score & Chart (7 cols) + Official Timers (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Official Record + KPIs + Evolution */}
        <div className="lg:col-span-7 rounded-2xl bg-[#12151B] border border-white/[0.08] p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <PerformanceArcGauge
              progress={recorde / 25}
              valueText={recorde.toFixed(1)}
              unitText="de 25 pts"
              label="Recorde Geral"
              arcColor={arcColor}
              size={168}
              strokeWidth={10}
            />

            <div className="flex-1 w-full grid grid-cols-3 gap-4 sm:gap-5 text-center sm:text-left">
              <div>
                <SectionKicker>Média</SectionKicker>
                <p className="font-display text-3xl font-bold text-[#F5F7FA] mt-1 tabular-nums">
                  {media.toFixed(1)}
                </p>
              </div>
              <div>
                <SectionKicker>Simulados</SectionKicker>
                <p className="font-display text-3xl font-bold text-[#F5F7FA] mt-1 tabular-nums">
                  {count}
                </p>
              </div>
              <div>
                <SectionKicker>Gargalo</SectionKicker>
                <p className="text-sm font-bold text-[#F5B700] mt-2 truncate">
                  {weakest?.name ?? '—'}
                </p>
              </div>
            </div>
          </div>

          {state.tafHistory.length > 0 && (
            <>
              <EditorialRule />
              <TafEvolutionChart scores={state.tafHistory.map((s) => [s.data, s.totalPts])} />
            </>
          )}
        </div>

        {/* Right: Official Timers */}
        <div className="lg:col-span-5 rounded-2xl bg-[#12151B] border border-white/[0.08] p-5 sm:p-6 space-y-5">
          <div>
            <SectionKicker>Provas cronometradas</SectionKicker>
            <h2 className="font-display text-2xl font-bold text-[#F5F7FA] mt-0.5">
              Cronômetros Oficiais
            </h2>
          </div>

          <SegmentedControl
            options={[
              { key: 'CORRIDA', label: '12 min' },
              { key: 'ABDOMINAL', label: '1 min' },
              { key: 'SHUTTLE', label: 'Shuttle' },
            ]}
            selectedKey={timerMode}
            onSelect={(k) => switchTimerMode(k as 'CORRIDA' | 'ABDOMINAL' | 'SHUTTLE')}
          />

          <div className="py-5 text-center">
            <span className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-[#F5F7FA] tabular-nums">
              {formatTimer(timerSec)}
            </span>
            <p className="text-xs text-[#8A93A5] mt-2">
              {timerMode === 'CORRIDA'
                ? 'Contagem regressiva · Teste de 12 minutos'
                : timerMode === 'ABDOMINAL'
                  ? 'Contagem regressiva · Flexão abdominal (1 min)'
                  : 'Cronômetro progressivo · Ir e Vir (Shuttle Run)'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => switchTimerMode(timerMode)}
              aria-label="Reiniciar cronômetro"
              className="min-w-[48px] min-h-[48px] rounded-xl bg-[#1A1E26] border border-white/[0.08] hover:bg-[#232833] flex items-center justify-center text-[#9CA3B2] hover:text-[#F5F7FA] cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <ActionButton
              text={timerRunning ? 'Pausar' : 'Iniciar Cronômetro'}
              icon={
                timerRunning ? (
                  <Pause className="w-4 h-4 fill-[#090B0E]" />
                ) : (
                  <Play className="w-4 h-4 fill-[#090B0E]" />
                )
              }
              onClick={() => setTimerRunning((r) => !r)}
            />
          </div>
        </div>
      </div>

      {/* Recorded Simulados History */}
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <SectionKicker>Histórico oficial</SectionKicker>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7FA] mt-0.5">
              Simulados Registrados ({count})
            </h2>
          </div>
        </div>

        {count === 0 ? (
          <div className="rounded-2xl bg-[#12151B] border border-white/[0.08] p-8 text-center space-y-3">
            <p className="text-sm font-medium text-[#D1D5DB]">
              Nenhum simulado registrado ainda.
            </p>
            <p className="text-xs text-[#8A93A5] max-w-md mx-auto leading-relaxed">
              Registre seu primeiro simulado para acompanhar a evolução de cada prova e identificar seu principal gargalo de pontuação.
            </p>
            <div className="pt-2 max-w-xs mx-auto">
              <ActionButton
                text="Registrar Primeiro Simulado"
                icon={<Plus className="w-4 h-4" />}
                onClick={openNewModal}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...state.tafHistory].reverse().map((sim) => {
              const pass = sim.totalPts >= 12;
              const tests = [
                { label: 'Barra', pts: sim.ptsBarra },
                { label: 'Abdom.', pts: sim.ptsAbdominal },
                { label: 'Impulsão', pts: sim.ptsImpulsao },
                { label: 'Corrida', pts: sim.ptsCorrida },
                { label: 'Shuttle', pts: sim.ptsShuttle },
              ];
              return (
                <div
                  key={sim.id}
                  className="rounded-2xl bg-[#12151B] border border-white/[0.08] p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <MetadataLine
                        items={[
                          sim.data,
                          sim.genero === 'feminino' ? 'Feminino' : 'Masculino',
                          pass ? 'Apto' : 'Abaixo do corte',
                        ]}
                      />
                      <p
                        className={`font-display text-3xl font-bold leading-none tabular-nums ${
                          pass ? 'text-[#22C55E]' : 'text-[#EF4444]'
                        }`}
                      >
                        {sim.totalPts.toFixed(1)}{' '}
                        <span className="text-sm font-sans font-medium text-[#8A93A5]">/ 25 pts</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(sim)}
                        aria-label="Editar simulado"
                        className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-[#9CA3B2] hover:text-[#F5F7FA] cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSimulado(sim.id)}
                        aria-label="Excluir simulado"
                        className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-[#EF4444]/10 flex items-center justify-center text-[#9CA3B2] hover:text-[#EF4444] cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 5-Test Score Breakdown */}
                  <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/[0.06]">
                    {tests.map((t) => (
                      <div key={t.label} className="space-y-1.5">
                        <span className="text-[11px] text-[#8A93A5] block truncate">{t.label}</span>
                        <span className="font-mono text-xs font-bold text-[#F5F7FA] block tabular-nums">
                          {t.pts.toFixed(1)}
                        </span>
                        <div className="h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(6, Math.min(100, (t.pts / 5) * 100))}%`,
                              backgroundColor: t.pts >= 2 ? '#F5B700' : '#EF4444',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Simulado */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#12151B] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-5 safe-bottom max-h-[90dvh] overflow-y-auto">
            <div className="sm:hidden w-10 h-1.5 rounded-full bg-white/15 mx-auto -mt-1 mb-2" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionKicker>Calculadora oficial PRF</SectionKicker>
                <h3 className="font-display text-2xl font-bold text-[#F5F7FA] mt-0.5">
                  {editingSim ? 'Editar Simulado' : 'Novo Simulado TAF'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Fechar"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[#1A1E26] border border-white/[0.08] flex items-center justify-center text-[#9CA3B2] hover:text-[#F5F7FA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-[#090B0E] border border-white/[0.08] p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#8A93A5] block">Pontuação Prevista</span>
                <span className="text-xs font-semibold text-[#9CA3B2]">
                  {previewSim.totalPts >= 12 ? 'Acima do corte oficial' : 'Abaixo do corte (12.0)'}
                </span>
              </div>
              <span
                className={`font-display text-3xl font-bold tabular-nums ${
                  previewSim.totalPts >= 12 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
              >
                {previewSim.totalPts.toFixed(1)} / 25
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#9CA3B2] block mb-1.5">Data</label>
                <input
                  type="text"
                  value={dataStr}
                  onChange={(e) => setDataStr(e.target.value)}
                  className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3 text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#9CA3B2] block mb-1.5">Sexo</label>
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3 text-sm text-[#F5F7FA] outline-none focus:border-[#F5B700]"
                >
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9CA3B2] block mb-1.5">
                  Barra ({genero === 'feminino' ? 'seg' : 'reps'}) ·{' '}
                  <span className="font-mono text-[#F5B700]">{previewSim.ptsBarra.toFixed(1)}</span>
                </label>
                <input
                  type="number"
                  step="1"
                  value={barra}
                  onChange={(e) => setBarra(e.target.value)}
                  className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3 text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
                />
              </div>
              <div>
                <label className="text-xs text-[#9CA3B2] block mb-1.5">
                  Abdominal ·{' '}
                  <span className="font-mono text-[#F5B700]">
                    {previewSim.ptsAbdominal.toFixed(1)}
                  </span>
                </label>
                <input
                  type="number"
                  value={abdominal}
                  onChange={(e) => setAbdominal(e.target.value)}
                  className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3 text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
                />
              </div>
              <div>
                <label className="text-xs text-[#9CA3B2] block mb-1.5">
                  Impulsão (m) ·{' '}
                  <span className="font-mono text-[#F5B700]">
                    {previewSim.ptsImpulsao.toFixed(1)}
                  </span>
                </label>
                <input
                  type="text"
                  value={impulsao}
                  onChange={(e) => setImpulsao(e.target.value)}
                  className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3 text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
                />
              </div>
              <div>
                <label className="text-xs text-[#9CA3B2] block mb-1.5">
                  Corrida 12m (m) ·{' '}
                  <span className="font-mono text-[#F5B700]">
                    {previewSim.ptsCorrida.toFixed(1)}
                  </span>
                </label>
                <input
                  type="number"
                  value={corrida}
                  onChange={(e) => setCorrida(e.target.value)}
                  className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3 text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[#9CA3B2] block mb-1.5">
                  Shuttle Run (seg) ·{' '}
                  <span className="font-mono text-[#F5B700]">
                    {previewSim.ptsShuttle.toFixed(1)}
                  </span>
                </label>
                <input
                  type="text"
                  value={shuttle}
                  onChange={(e) => setShuttle(e.target.value)}
                  className="w-full h-11 rounded-xl bg-[#090B0E] border border-white/[0.1] px-3 text-sm font-mono text-[#F5F7FA] outline-none focus:border-[#F5B700]"
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
            />
          </div>
        </div>
      )}
    </div>
  );
}

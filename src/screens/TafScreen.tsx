import { useEffect, useState } from 'react';
import { Cloud, Edit2, Loader2, Pause, Play, Plus, RotateCcw, Trash2, User, X } from 'lucide-react';
import {
  EditorialRule,
  EditorialTabRow,
  MicroKicker,
  MonochromePillButton,
  StatusDotPill,
  TafEvolutionChart,
  WhoopArcGauge,
} from '../components/UiKit';
import type { SyncUiState } from '../data/useTafStore';
import { buildSimulado, findWeakestTest } from '../domain/prfTafScoring';
import type { TafAppState, TafSimulado } from '../domain/types';

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TafScreen({
  state,
  isLoggedIn,
  syncState,
  todayBr,
  onSaveSimulado,
  onDeleteSimulado,
  onOpenAccountModal,
}: {
  state: TafAppState;
  isLoggedIn: boolean;
  syncState: SyncUiState;
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
  onOpenAccountModal: () => void;
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
  const arcColor = count === 0 ? '#A4A4AE' : recorde >= 12 ? '#00F19F' : '#FF4D57';

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
    <div className="px-5 pt-4 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <MicroKicker>TABELA OFICIAL · CORTE 12 PTS</MicroKicker>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">TAF PRF</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAccountModal}
            className="w-10 h-10 rounded-full bg-[#101012] border border-[#232329] flex items-center justify-center cursor-pointer"
          >
            {syncState.isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : isLoggedIn ? (
              <Cloud className="w-4 h-4 text-[#00F19F]" />
            ) : (
              <User className="w-4 h-4 text-[#A4A4AE]" />
            )}
          </button>
          <button
            type="button"
            onClick={openNewModal}
            className="h-10 px-4 rounded-full bg-white text-black font-bold text-xs inline-flex items-center gap-1 cursor-pointer hover:bg-[#E5E5EA]"
          >
            <Plus className="w-4 h-4" />
            <span>NOVO</span>
          </button>
        </div>
      </div>

      {/* Recorde Geral Gauge + 3 colunas */}
      <div className="flex flex-col items-center gap-4">
        <WhoopArcGauge
          progress={recorde / 25}
          valueText={recorde.toFixed(1)}
          unitText="de 25 pts"
          label="RECORDE GERAL"
          arcColor={arcColor}
          size={172}
          strokeWidth={11}
        />

        <div className="w-full grid grid-cols-3 divide-x divide-[#232329] text-center">
          <div>
            <MicroKicker>MÉDIA</MicroKicker>
            <p className="font-mono text-base font-bold text-white mt-1">{media.toFixed(1)}</p>
          </div>
          <div>
            <MicroKicker>SIMULADOS</MicroKicker>
            <p className="font-mono text-base font-bold text-white mt-1">{count}</p>
          </div>
          <div>
            <MicroKicker>GARGALO</MicroKicker>
            <p className="text-xs font-bold text-[#FFBE2E] mt-1.5 truncate px-1">
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

      <EditorialRule />

      {/* Cronômetros Oficiais */}
      <div className="space-y-3">
        <MicroKicker>CRONÔMETROS OFICIAIS</MicroKicker>
        <EditorialTabRow
          options={[
            { key: 'CORRIDA', label: '12 min' },
            { key: 'ABDOMINAL', label: '1 min' },
            { key: 'SHUTTLE', label: 'Shuttle' },
          ]}
          selectedKey={timerMode}
          onSelect={(k) => switchTimerMode(k as 'CORRIDA' | 'ABDOMINAL' | 'SHUTTLE')}
        />
        <div className="rounded-2xl bg-[#101012] border border-[#232329] p-4 flex items-center justify-between">
          <span className="font-mono text-3xl font-extrabold text-white">
            {formatTimer(timerSec)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchTimerMode(timerMode)}
              className="w-10 h-10 rounded-full bg-[#1C1C21] border border-[#232329] flex items-center justify-center text-[#A4A4AE] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className="h-10 px-4 rounded-full bg-white text-black font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-black" />}
              <span>{timerRunning ? 'Pausar' : 'Iniciar'}</span>
            </button>
          </div>
        </div>
      </div>

      <EditorialRule />

      <MicroKicker>SIMULADOS REGISTRADOS ({count})</MicroKicker>

      {count === 0 ? (
        <p className="text-xs text-[#6D6D76] leading-relaxed">
          Nenhum simulado registrado ainda. Toque em &quot;+ NOVO&quot; ou conecte sua conta no ícone acima.
        </p>
      ) : (
        <div className="space-y-3">
          {[...state.tafHistory].reverse().map((sim) => {
            const pass = sim.totalPts >= 12;
            return (
              <div
                key={sim.id}
                className="rounded-2xl bg-[#101012] border border-[#232329] p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <StatusDotPill
                    text={`${sim.data} · ${sim.genero === 'feminino' ? 'FEM' : 'MASC'}`}
                    color={pass ? '#00F19F' : '#FF4D57'}
                  />
                  <div className="flex items-center gap-1">
                    <span
                      className={`font-mono text-sm font-extrabold mr-2 ${
                        pass ? 'text-[#00F19F]' : 'text-[#FF4D57]'
                      }`}
                    >
                      {sim.totalPts.toFixed(1)} pts
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditModal(sim)}
                      className="p-1.5 text-[#A4A4AE] hover:text-white cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSimulado(sim.id)}
                      className="p-1.5 text-[#A4A4AE] hover:text-[#FF4D57] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-mono text-[#A4A4AE]">
                  <div>
                    <span className="text-[#6D6D76] block">BAR</span>
                    {sim.ptsBarra.toFixed(1)}
                  </div>
                  <div>
                    <span className="text-[#6D6D76] block">ABD</span>
                    {sim.ptsAbdominal.toFixed(1)}
                  </div>
                  <div>
                    <span className="text-[#6D6D76] block">IMP</span>
                    {sim.ptsImpulsao.toFixed(1)}
                  </div>
                  <div>
                    <span className="text-[#6D6D76] block">COR</span>
                    {sim.ptsCorrida.toFixed(1)}
                  </div>
                  <div>
                    <span className="text-[#6D6D76] block">SHU</span>
                    {sim.ptsShuttle.toFixed(1)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Simulado */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#101012] border border-[#232329] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 safe-bottom max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <MicroKicker>CALCULADORA OFICIAL PRF</MicroKicker>
                <h3 className="text-lg font-bold text-white">
                  {editingSim ? 'Editar Simulado' : 'Novo Simulado TAF'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[#1C1C21] flex items-center justify-center text-[#A4A4AE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-black border border-[#232329] p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-[#A4A4AE]">Pontuação Prevista</span>
              <span
                className={`font-mono text-xl font-extrabold ${
                  previewSim.totalPts >= 12 ? 'text-[#00F19F]' : 'text-[#FF4D57]'
                }`}
              >
                {previewSim.totalPts.toFixed(1)} / 25 pts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-[#6D6D76] block mb-1">Data</label>
                <input
                  type="text"
                  value={dataStr}
                  onChange={(e) => setDataStr(e.target.value)}
                  className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6D6D76] block mb-1">Sexo</label>
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-xs text-white"
                >
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-[#6D6D76] block mb-1">
                  Barra ({genero === 'feminino' ? 'seg' : 'reps'}) · {previewSim.ptsBarra.toFixed(1)} pts
                </label>
                <input
                  type="number"
                  step="1"
                  value={barra}
                  onChange={(e) => setBarra(e.target.value)}
                  className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-sm font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6D6D76] block mb-1">
                  Abdominal (reps) · {previewSim.ptsAbdominal.toFixed(1)} pts
                </label>
                <input
                  type="number"
                  value={abdominal}
                  onChange={(e) => setAbdominal(e.target.value)}
                  className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-sm font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6D6D76] block mb-1">
                  Impulsão (m) · {previewSim.ptsImpulsao.toFixed(1)} pts
                </label>
                <input
                  type="text"
                  value={impulsao}
                  onChange={(e) => setImpulsao(e.target.value)}
                  className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-sm font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6D6D76] block mb-1">
                  Corrida 12m (m) · {previewSim.ptsCorrida.toFixed(1)} pts
                </label>
                <input
                  type="number"
                  value={corrida}
                  onChange={(e) => setCorrida(e.target.value)}
                  className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-sm font-mono text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-[#6D6D76] block mb-1">
                  Shuttle Run (seg) · {previewSim.ptsShuttle.toFixed(1)} pts
                </label>
                <input
                  type="text"
                  value={shuttle}
                  onChange={(e) => setShuttle(e.target.value)}
                  className="w-full h-10 rounded-xl bg-black border border-[#232329] px-3 text-sm font-mono text-white"
                />
              </div>
            </div>

            <MonochromePillButton
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

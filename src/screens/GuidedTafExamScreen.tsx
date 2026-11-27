import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shield,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ActionButton, LinearProgressBar, MetadataLine, SegmentedControl } from '../components/UiKit';
import { notifyStepAlert, speakPtBr, stopSpeaking } from '../data/voiceCoach';
import {
  buildSimulado,
  calcAbdominal,
  calcBarra,
  calcCorrida,
  calcImpulsao,
  calcShuttle,
} from '../domain/prfTafScoring';
import { pacesForVdot } from '../domain/vdotCalculator';

const EXAM_STEPS = [
  { key: 'SETUP', label: 'Preparação', short: 'Início' },
  { key: 'BARRA', label: 'Barra Fixa', short: '1. Barra' },
  { key: 'IMPULSAO', label: 'Impulsão Horizontal', short: '2. Impulsão' },
  { key: 'ABDOMINAL', label: 'Abdominal (1 min)', short: '3. Abdom.' },
  { key: 'SHUTTLE', label: 'Shuttle Run', short: '4. Shuttle' },
  { key: 'CORRIDA', label: 'Corrida 12 min', short: '5. Corrida' },
  { key: 'RESULTADO', label: 'Boletim Oficial', short: 'Resultado' },
] as const;

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GuidedTafExamScreen({
  todayBr,
  vdot,
  onComplete,
  onDiscard,
}: {
  todayBr: string;
  vdot: number;
  onComplete: (
    data: string,
    genero: string,
    barra: number,
    abdominal: number,
    impulsao: number,
    corrida: number,
    shuttle: number
  ) => void;
  onDiscard: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [genero, setGenero] = useState<'masculino' | 'feminino'>('masculino');
  const [dataStr, setDataStr] = useState(todayBr);

  const [barraVal, setBarraVal] = useState('5');
  const [isoRunning, setIsoRunning] = useState(false);
  const [isoTenths, setIsoTenths] = useState(0);

  const [imp1, setImp1] = useState('2.05');
  const [imp2, setImp2] = useState('');

  const [abdTimerSec, setAbdTimerSec] = useState(60);
  const [abdRunning, setAbdRunning] = useState(false);
  const [abdCount, setAbdCount] = useState(0);

  const [shuttleRunning, setShuttleRunning] = useState(false);
  const [shuttleMs, setShuttleMs] = useState(0);
  const shuttleStartRef = useRef<number | null>(null);
  const [shuttleT1, setShuttleT1] = useState('');
  const [shuttleT2, setShuttleT2] = useState('');

  const [runTimerSec, setRunTimerSec] = useState(12 * 60);
  const [runRunning, setRunRunning] = useState(false);
  const [runMeters, setRunMeters] = useState('2600');

  const isMasc = genero === 'masculino';
  const paces = pacesForVdot(vdot);

  useEffect(() => {
    if (!isoRunning) return;
    const id = window.setInterval(() => {
      setIsoTenths((prev) => prev + 1);
    }, 100);
    return () => window.clearInterval(id);
  }, [isoRunning]);

  useEffect(() => {
    if (!abdRunning) return;
    const id = window.setInterval(() => {
      setAbdTimerSec((prev) => {
        const next = prev - 1;
        if (next === 30 && voiceEnabled) speakPtBr('Trinta segundos restantes');
        if (next === 10 && voiceEnabled) speakPtBr('Dez segundos');
        if (next <= 0) {
          setAbdRunning(false);
          notifyStepAlert();
          if (voiceEnabled) speakPtBr('Tempo esgotado no abdominal!');
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [abdRunning, voiceEnabled]);

  useEffect(() => {
    if (!shuttleRunning) return;
    shuttleStartRef.current = performance.now() - shuttleMs;
    const id = window.setInterval(() => {
      if (shuttleStartRef.current !== null) {
        setShuttleMs(performance.now() - shuttleStartRef.current);
      }
    }, 30);
    return () => window.clearInterval(id);
  }, [shuttleRunning]);

  useEffect(() => {
    if (!runRunning) return;
    const id = window.setInterval(() => {
      setRunTimerSec((prev) => {
        const next = prev - 1;
        if (next === 9 * 60 && voiceEnabled) speakPtBr('Três minutos concluídos. Faltam nove minutos.');
        if (next === 6 * 60 && voiceEnabled) speakPtBr('Metade da prova! Seis minutos restantes.');
        if (next === 3 * 60 && voiceEnabled) speakPtBr('Faltam três minutos. Mantenha a cadência.');
        if (next === 60 && voiceEnabled) speakPtBr('Último minuto! Acelere até o apito final.');
        if (next <= 0) {
          setRunRunning(false);
          notifyStepAlert();
          if (voiceEnabled) speakPtBr('Fim dos doze minutos! Registre sua distância em metros.');
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [runRunning, voiceEnabled]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const parsedBarra = Math.max(0, Number(barraVal.replace(',', '.')) || 0);
  const parsedImp1 = Math.max(0, Number(imp1.replace(',', '.')) || 0);
  const parsedImp2 = Math.max(0, Number(imp2.replace(',', '.')) || 0);
  const bestImpulsao = Math.max(parsedImp1, parsedImp2);

  const parsedShuttle1 = Number(shuttleT1.replace(',', '.')) || 0;
  const parsedShuttle2 = Number(shuttleT2.replace(',', '.')) || 0;
  const validShuttles = [parsedShuttle1, parsedShuttle2].filter((t) => t > 0);
  const bestShuttle = validShuttles.length > 0 ? Math.min(...validShuttles) : 12.0;

  const parsedCorrida = Math.max(0, Number(runMeters) || 0);

  const livePtsBarra = calcBarra(parsedBarra, isMasc);
  const livePtsImp = calcImpulsao(bestImpulsao, isMasc);
  const livePtsAbd = calcAbdominal(abdCount, isMasc);
  const livePtsShuttle = validShuttles.length > 0 ? calcShuttle(bestShuttle, isMasc) : 0;
  const livePtsCorrida = calcCorrida(parsedCorrida, isMasc);

  const finalSimulado = buildSimulado(
    0,
    dataStr,
    genero,
    parsedBarra,
    abdCount,
    bestImpulsao,
    parsedCorrida,
    bestShuttle
  );

  const goStep = (next: number) => {
    setIsoRunning(false);
    setAbdRunning(false);
    setShuttleRunning(false);
    setRunRunning(false);
    setStepIdx(Math.max(0, Math.min(EXAM_STEPS.length - 1, next)));
  };

  const handleDiscard = () => {
    stopSpeaking();
    onDiscard();
  };

  const currentStep = EXAM_STEPS[stepIdx];

  return (
    <div className="min-h-dvh bg-[#F3F1EC] dark:bg-[#0A0A0C] text-[#111114] dark:text-[#F5F4EF] flex flex-col safe-top safe-bottom">
      {/* Top Official Exam Header */}
      <header className="sticky top-0 z-20 bg-[#111114] dark:bg-[#0A0A0C] text-[#F5F4EF] border-b border-[#26262E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[3px] bg-[#EAB308] text-[#0A0A0C] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <MetadataLine
                items={[
                  'SIMULADO OFICIAL PRF',
                  `ETAPA ${stepIdx + 1}/${EXAM_STEPS.length}`,
                  genero === 'feminino' ? 'FEMININO' : 'MASCULINO',
                ]}
                className="text-[#A1A1AA]"
              />
              <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase text-[#F5F4EF] truncate leading-none mt-0.5">
                {currentStep.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setVoiceEnabled((v) => !v)}
              aria-label={voiceEnabled ? 'Desativar voz' : 'Ativar voz'}
              className="min-w-[44px] min-h-[44px] rounded-[4px] bg-white/10 hover:bg-white/15 flex items-center justify-center text-[#F5F4EF] cursor-pointer transition-colors"
            >
              {voiceEnabled ? (
                <Volume2 className="w-4 h-4 text-[#EAB308]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#8A8A96]" />
              )}
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              aria-label="Sair do simulado guiado"
              className="min-w-[44px] min-h-[44px] rounded-[4px] bg-white/10 hover:bg-[#DC2626] flex items-center justify-center text-[#F5F4EF] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-3 space-y-2">
          <LinearProgressBar
            value={stepIdx}
            max={EXAM_STEPS.length - 1}
            barColor="#EAB308"
            heightClass="h-1"
          />
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5">
            {EXAM_STEPS.map((st, idx) => (
              <button
                key={st.key}
                type="button"
                onClick={() => goStep(idx)}
                className={`text-[11px] font-mono whitespace-nowrap px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer ${
                  idx === stepIdx
                    ? 'bg-[#EAB308] text-[#0A0A0C] font-bold'
                    : idx < stepIdx
                      ? 'text-[#22C55E]'
                      : 'text-[#8A8A96] hover:text-[#F5F4EF]'
                }`}
              >
                {st.short}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Step Workspace */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col justify-between gap-6">
        {stepIdx === 0 && (
          <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <MetadataLine
                items={['PROTOCOLO COMPLETO DO EDITAL PRF']}
                className="text-[#CA8A04] dark:text-[#EAB308]"
              />
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF]">
                Simulado Oficial Passo a Passo
              </h2>
              <p className="text-sm text-[#47474F] dark:text-[#A1A1AA] leading-relaxed">
                Execute as 5 provas na ordem oficial com cronômetros integrados, 2 tentativas para Impulsão e Shuttle Run e cálculo automático pela tabela PRF (corte mínimo de 12.0 pts).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                  Tabela Oficial
                </label>
                <SegmentedControl
                  options={[
                    { key: 'masculino', label: 'Masculino' },
                    { key: 'feminino', label: 'Feminino' },
                  ]}
                  selectedKey={genero}
                  onSelect={(k) => {
                    const next = k as 'masculino' | 'feminino';
                    setGenero(next);
                    setBarraVal(next === 'feminino' ? '15' : '5');
                    setImp1(next === 'feminino' ? '1.60' : '2.05');
                    setRunMeters(next === 'feminino' ? '2200' : '2600');
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                  Data do Simulado
                </label>
                <input
                  type="text"
                  value={dataStr}
                  onChange={(e) => setDataStr(e.target.value)}
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
            </div>

            <div className="border-t border-[#E4E0D7] dark:border-[#26262E] pt-4">
              <p className="text-xs font-mono uppercase tracking-[0.06em] font-bold text-[#111114] dark:text-[#F5F4EF] mb-3">
                Sequência das 5 provas oficiais:
              </p>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#47474F] dark:text-[#C4C4CC]">
                <li className="rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] px-3.5 py-2.5">
                  <strong className="font-mono text-[#CA8A04] dark:text-[#EAB308] mr-1.5">01</strong>
                  Barra Fixa ({isMasc ? 'Dinâmica · reps' : 'Isometria · seg'})
                </li>
                <li className="rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] px-3.5 py-2.5">
                  <strong className="font-mono text-[#CA8A04] dark:text-[#EAB308] mr-1.5">02</strong>
                  Impulsão Horizontal (2 tentativas)
                </li>
                <li className="rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] px-3.5 py-2.5">
                  <strong className="font-mono text-[#CA8A04] dark:text-[#EAB308] mr-1.5">03</strong>
                  Abdominal Remador (1:00 minuto)
                </li>
                <li className="rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] px-3.5 py-2.5">
                  <strong className="font-mono text-[#CA8A04] dark:text-[#EAB308] mr-1.5">04</strong>
                  Shuttle Run (2 tentativas · seg)
                </li>
                <li className="sm:col-span-2 rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] px-3.5 py-2.5">
                  <strong className="font-mono text-[#CA8A04] dark:text-[#EAB308] mr-1.5">05</strong>
                  Corrida de 12 Minutos (avisos de voz a cada 3 min + meta VDOT {vdot})
                </li>
              </ol>
            </div>
          </section>
        )}

        {stepIdx === 1 && (
          <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <MetadataLine
                  items={['PROVA 1 DE 5', isMasc ? 'FLEXÃO DINÂMICA' : 'ISOMETRIA']}
                />
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-0.5">
                  Teste de Barra Fixa
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono uppercase text-[#6B6B76] dark:text-[#8A8A96] block">
                  Nota parcial
                </span>
                <span className="font-mono text-3xl font-bold text-[#CA8A04] dark:text-[#EAB308] tabular-nums">
                  {livePtsBarra.toFixed(1)}
                </span>
                <span className="text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96]"> / 5.0</span>
              </div>
            </div>

            {isMasc ? (
              <div className="rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#26262E] p-6 flex flex-col items-center gap-5">
                <span className="text-xs font-semibold text-[#6B6B76] dark:text-[#8A8A96]">
                  Repetições válidas (queixo acima da barra, extensão total na descida)
                </span>
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setBarraVal(String(Math.max(0, parsedBarra - 1)))}
                    aria-label="Diminuir repetição"
                    className="w-14 h-14 rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-white dark:bg-[#1A1A20] flex items-center justify-center text-[#111114] dark:text-[#F5F4EF] cursor-pointer"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="font-mono text-6xl font-bold text-[#111114] dark:text-[#F5F4EF] tabular-nums min-w-[4.5rem] text-center">
                    {Math.round(parsedBarra)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBarraVal(String(parsedBarra + 1))}
                    aria-label="Somar repetição"
                    className="w-14 h-14 rounded-[4px] bg-[#EAB308] hover:bg-[#FACC15] text-[#0A0A0C] flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
                <p className="text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96]">
                  Mínimo pontuável: 3 reps (2.0 pts) · Nota máxima: 9 reps (5.0 pts)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[4px] bg-[#050507] border border-[#26262E] p-6 text-center space-y-4">
                  <span className="text-xs font-mono text-[#8A8A96] block">
                    Cronômetro de Isometria (queixo acima da barra)
                  </span>
                  <span className="font-mono text-6xl font-bold text-[#F5F4EF] tabular-nums block">
                    {(isoTenths / 10).toFixed(1)}s
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsoRunning(false);
                        setIsoTenths(0);
                      }}
                      className="min-w-[48px] min-h-[48px] rounded-[4px] bg-[#1A1A20] hover:bg-[#26262E] text-[#F5F4EF] flex items-center justify-center cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <ActionButton
                      text={isoRunning ? 'Parar' : 'Iniciar Isometria'}
                      icon={isoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      onClick={() => {
                        if (isoRunning) {
                          setIsoRunning(false);
                          setBarraVal(String(Math.floor(isoTenths / 10)));
                        } else {
                          setIsoRunning(true);
                        }
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                    Tempo registrado (segundos)
                  </label>
                  <input
                    type="number"
                    value={barraVal}
                    onChange={(e) => setBarraVal(e.target.value)}
                    className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {stepIdx === 2 && (
          <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <MetadataLine items={['PROVA 2 DE 5', 'MELHOR DE 2 TENTATIVAS']} />
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-0.5">
                  Impulsão Horizontal
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono uppercase text-[#6B6B76] dark:text-[#8A8A96] block">
                  Nota parcial
                </span>
                <span className="font-mono text-3xl font-bold text-[#CA8A04] dark:text-[#EAB308] tabular-nums">
                  {livePtsImp.toFixed(1)}
                </span>
                <span className="text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96]"> / 5.0</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                  1ª Tentativa (metros)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={imp1}
                  onChange={(e) => setImp1(e.target.value)}
                  placeholder="Ex.: 2.10"
                  className="w-full h-12 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-4 text-lg font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                  2ª Tentativa (metros · opcional)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={imp2}
                  onChange={(e) => setImp2(e.target.value)}
                  placeholder="Ex.: 2.18"
                  className="w-full h-12 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-4 text-lg font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
            </div>

            <div className="rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] p-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC]">
                Melhor marca válida considerada
              </span>
              <span className="font-mono text-xl font-bold text-[#111114] dark:text-[#F5F4EF] tabular-nums">
                {bestImpulsao.toFixed(2)} m
              </span>
            </div>
          </section>
        )}

        {stepIdx === 3 && (
          <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <MetadataLine items={['PROVA 3 DE 5', 'TEMPO OFICIAL 01:00']} />
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-0.5">
                  Abdominal Remador
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono uppercase text-[#6B6B76] dark:text-[#8A8A96] block">
                  Nota parcial
                </span>
                <span className="font-mono text-3xl font-bold text-[#CA8A04] dark:text-[#EAB308] tabular-nums">
                  {livePtsAbd.toFixed(1)}
                </span>
                <span className="text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96]"> / 5.0</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-[4px] bg-[#050507] border border-[#26262E] p-6 text-center space-y-4">
                <span className="text-xs font-mono text-[#8A8A96] block">Cronômetro Regressivo</span>
                <span className="font-mono text-6xl font-bold text-[#F5F4EF] tabular-nums block">
                  {formatClock(abdTimerSec)}
                </span>
                <div className="flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAbdRunning(false);
                      setAbdTimerSec(60);
                    }}
                    aria-label="Reiniciar 1 minuto"
                    className="min-w-[46px] min-h-[46px] rounded-[4px] bg-[#1A1A20] hover:bg-[#26262E] text-[#F5F4EF] flex items-center justify-center cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <ActionButton
                    text={abdRunning ? 'Pausar' : 'Iniciar 1:00'}
                    icon={abdRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    onClick={() => {
                      if (!abdRunning && abdTimerSec === 60 && voiceEnabled) {
                        speakPtBr('Atenção. Valendo um minuto de abdominal!');
                      }
                      setAbdRunning((r) => !r);
                    }}
                  />
                </div>
              </div>

              <div className="rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] p-6 flex flex-col items-center justify-between gap-4">
                <span className="text-xs font-mono uppercase text-[#6B6B76] dark:text-[#8A8A96]">
                  Contador de Repetições
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setAbdCount((c) => Math.max(0, c - 1))}
                    aria-label="Remover repetição"
                    className="w-12 h-12 rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-white dark:bg-[#121216] flex items-center justify-center text-[#111114] dark:text-[#F5F4EF] cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={abdCount}
                    onChange={(e) => setAbdCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-24 h-14 rounded-[4px] bg-white dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] text-center font-mono text-3xl font-bold text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                  />
                  <button
                    type="button"
                    onClick={() => setAbdCount((c) => c + 1)}
                    aria-label="Somar repetição"
                    className="w-14 h-14 rounded-[4px] bg-[#EAB308] hover:bg-[#FACC15] text-[#0A0A0C] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                  >
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </button>
                </div>
                <span className="text-[11px] font-mono text-[#6B6B76] dark:text-[#8A8A96]">
                  Toque em + ou digite o total ao fim do minuto
                </span>
              </div>
            </div>
          </section>
        )}

        {stepIdx === 4 && (
          <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <MetadataLine items={['PROVA 4 DE 5', 'MENOR TEMPO EM ATÉ 2 TENTATIVAS']} />
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-0.5">
                  Shuttle Run (Ir e Vir)
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono uppercase text-[#6B6B76] dark:text-[#8A8A96] block">
                  Nota parcial
                </span>
                <span className="font-mono text-3xl font-bold text-[#CA8A04] dark:text-[#EAB308] tabular-nums">
                  {livePtsShuttle.toFixed(1)}
                </span>
                <span className="text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96]"> / 5.0</span>
              </div>
            </div>

            <div className="rounded-[4px] bg-[#050507] border border-[#26262E] p-6 text-center space-y-4">
              <span className="text-xs font-mono text-[#8A8A96] block">
                Cronômetro de Precisão (9,14 m × 4)
              </span>
              <span className="font-mono text-6xl font-bold text-[#F5F4EF] tabular-nums block">
                {(shuttleMs / 1000).toFixed(2)}s
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShuttleRunning(false);
                    setShuttleMs(0);
                  }}
                  aria-label="Zerar cronômetro Shuttle"
                  className="min-w-[46px] min-h-[46px] rounded-[4px] bg-[#1A1A20] hover:bg-[#26262E] text-[#F5F4EF] flex items-center justify-center cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <ActionButton
                  text={shuttleRunning ? 'Parar e Gravar' : 'Iniciar Shuttle'}
                  icon={shuttleRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  onClick={() => {
                    if (shuttleRunning) {
                      setShuttleRunning(false);
                      const captured = (shuttleMs / 1000).toFixed(2);
                      if (!shuttleT1) setShuttleT1(captured);
                      else setShuttleT2(captured);
                    } else {
                      setShuttleMs(0);
                      setShuttleRunning(true);
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                  1ª Tentativa (segundos)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={shuttleT1}
                  onChange={(e) => setShuttleT1(e.target.value)}
                  placeholder="Ex.: 11.45"
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block mb-1.5">
                  2ª Tentativa (segundos · opcional)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={shuttleT2}
                  onChange={(e) => setShuttleT2(e.target.value)}
                  placeholder="Ex.: 11.12"
                  className="w-full h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-3 text-sm font-mono text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
              </div>
            </div>
          </section>
        )}

        {stepIdx === 5 && (
          <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <MetadataLine items={['PROVA 5 DE 5', `LIMIAR VDOT ${vdot}: ${paces.thresholdKm}`]} />
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-0.5">
                  Corrida de 12 Minutos
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono uppercase text-[#6B6B76] dark:text-[#8A8A96] block">
                  Nota parcial
                </span>
                <span className="font-mono text-3xl font-bold text-[#CA8A04] dark:text-[#EAB308] tabular-nums">
                  {livePtsCorrida.toFixed(1)}
                </span>
                <span className="text-xs font-mono text-[#6B6B76] dark:text-[#8A8A96]"> / 5.0</span>
              </div>
            </div>

            <div className="rounded-[4px] bg-[#050507] border border-[#26262E] p-6 text-center space-y-4">
              <span className="text-xs font-mono text-[#8A8A96] block">
                Cronômetro Oficial 12:00 · Avisos de voz em 3, 6, 9 e 11 min
              </span>
              <span className="font-mono text-6xl sm:text-7xl font-bold text-[#F5F4EF] tabular-nums block">
                {formatClock(runTimerSec)}
              </span>
              <div className="max-w-md mx-auto">
                <LinearProgressBar
                  value={12 * 60 - runTimerSec}
                  max={12 * 60}
                  barColor="#EAB308"
                  heightClass="h-1.5"
                />
              </div>
              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setRunRunning(false);
                    setRunTimerSec(12 * 60);
                  }}
                  aria-label="Reiniciar 12 minutos"
                  className="min-w-[46px] min-h-[46px] rounded-[4px] bg-[#1A1A20] hover:bg-[#26262E] text-[#F5F4EF] flex items-center justify-center cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <ActionButton
                  text={runRunning ? 'Pausar' : 'Iniciar 12:00'}
                  icon={runRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  onClick={() => {
                    if (!runRunning && runTimerSec === 12 * 60 && voiceEnabled) {
                      speakPtBr('Largada autorizada! Doze minutos de corrida valendo.');
                    }
                    setRunRunning((r) => !r);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#47474F] dark:text-[#C4C4CC] block">
                Distância total percorrida (metros)
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setRunMeters(String(Math.max(0, parsedCorrida - 50)))}
                  className="min-h-[44px] px-3 rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-[#F3F1EC] dark:bg-[#1A1A20] font-mono text-xs font-bold text-[#111114] dark:text-[#F5F4EF] cursor-pointer"
                >
                  -50m
                </button>
                <input
                  type="number"
                  value={runMeters}
                  onChange={(e) => setRunMeters(e.target.value)}
                  className="flex-1 h-11 rounded-[4px] bg-[#F3F1EC] dark:bg-[#0A0A0C] border border-[#D6D2C7] dark:border-[#2E2E38] px-4 text-center text-lg font-mono font-bold text-[#111114] dark:text-[#F5F4EF] outline-none focus:border-[#EAB308]"
                />
                <button
                  type="button"
                  onClick={() => setRunMeters(String(parsedCorrida + 50))}
                  className="min-h-[44px] px-3 rounded-[4px] border border-[#D6D2C7] dark:border-[#2E2E38] bg-[#F3F1EC] dark:bg-[#1A1A20] font-mono text-xs font-bold text-[#111114] dark:text-[#F5F4EF] cursor-pointer"
                >
                  +50m
                </button>
              </div>
            </div>
          </section>
        )}

        {stepIdx === 6 && (
          <section className="rounded-[4px] bg-white dark:bg-[#121216] border border-[#D6D2C7] dark:border-[#26262E] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E0D7] dark:border-[#26262E] pb-5">
              <div>
                <MetadataLine items={['BOLETIM OFICIAL PRF', dataStr, isMasc ? 'MASCULINO' : 'FEMININO']} />
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-[#111114] dark:text-[#F5F4EF] mt-1">
                  Resultado do Simulado
                </h2>
              </div>
              <div className="text-left sm:text-right">
                <span
                  className={`font-display text-5xl sm:text-6xl font-extrabold tabular-nums leading-none ${
                    finalSimulado.totalPts >= 12
                      ? 'text-[#15803D] dark:text-[#22C55E]'
                      : 'text-[#DC2626] dark:text-[#EF4444]'
                  }`}
                >
                  {finalSimulado.totalPts.toFixed(1)}
                </span>
                <span className="font-mono text-sm text-[#6B6B76] dark:text-[#8A8A96]"> / 25.0 pts</span>
                <p
                  className={`text-xs font-mono font-bold mt-1 ${
                    finalSimulado.totalPts >= 12
                      ? 'text-[#15803D] dark:text-[#22C55E]'
                      : 'text-[#DC2626] dark:text-[#EF4444]'
                  }`}
                >
                  {finalSimulado.totalPts >= 12
                    ? 'APTO — ACIMA DO CORTE OFICIAL (12.0 PTS)'
                    : `ABAIXO DO CORTE — FALTAM ${(12 - finalSimulado.totalPts).toFixed(1)} PTS`}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  name: '1. Barra Fixa',
                  mark: `${finalSimulado.barra} ${isMasc ? 'reps' : 'seg'}`,
                  pts: finalSimulado.ptsBarra,
                },
                {
                  name: '2. Impulsão Horizontal',
                  mark: `${finalSimulado.impulsao.toFixed(2)} m`,
                  pts: finalSimulado.ptsImpulsao,
                },
                {
                  name: '3. Abdominal Remador',
                  mark: `${finalSimulado.abdominal} reps`,
                  pts: finalSimulado.ptsAbdominal,
                },
                {
                  name: '4. Shuttle Run',
                  mark: `${finalSimulado.shuttle.toFixed(2)} s`,
                  pts: finalSimulado.ptsShuttle,
                },
                {
                  name: '5. Corrida 12 Minutos',
                  mark: `${finalSimulado.corrida} m`,
                  pts: finalSimulado.ptsCorrida,
                },
              ].map((row) => (
                <div
                  key={row.name}
                  className="grid grid-cols-[1fr_5.5rem_3.5rem] items-center gap-3 rounded-[4px] bg-[#F3F1EC] dark:bg-[#1A1A20] border border-[#D6D2C7] dark:border-[#26262E] px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-[#111114] dark:text-[#F5F4EF]">{row.name}</span>
                  <span className="font-mono text-xs text-right text-[#6B6B76] dark:text-[#8A8A96] tabular-nums">
                    {row.mark}
                  </span>
                  <span
                    className={`font-mono font-bold text-right tabular-nums ${
                      row.pts >= 2
                        ? 'text-[#15803D] dark:text-[#22C55E]'
                        : 'text-[#DC2626] dark:text-[#EF4444]'
                    }`}
                  >
                    {row.pts.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            <ActionButton
              text="Salvar Simulado Oficial no Histórico"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => {
                stopSpeaking();
                onComplete(
                  dataStr,
                  genero,
                  finalSimulado.barra,
                  finalSimulado.abdominal,
                  finalSimulado.impulsao,
                  finalSimulado.corrida,
                  finalSimulado.shuttle
                );
              }}
              className="w-full"
            />
          </section>
        )}

        {/* Bottom Step Navigation Footer */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <ActionButton
            text={stepIdx === 0 ? 'Cancelar' : 'Anterior'}
            variant="secondary"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => (stepIdx === 0 ? handleDiscard() : goStep(stepIdx - 1))}
          />

          {stepIdx < EXAM_STEPS.length - 1 ? (
            <ActionButton
              text={stepIdx === 0 ? 'Começar Prova 1' : stepIdx === 5 ? 'Ver Boletim Oficial' : 'Próxima Prova'}
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => goStep(stepIdx + 1)}
            />
          ) : (
            <ActionButton
              text="Concluir e Salvar"
              icon={<Check className="w-4 h-4" />}
              onClick={() => {
                stopSpeaking();
                onComplete(
                  dataStr,
                  genero,
                  finalSimulado.barra,
                  finalSimulado.abdominal,
                  finalSimulado.impulsao,
                  finalSimulado.corrida,
                  finalSimulado.shuttle
                );
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

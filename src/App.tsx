import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Dumbbell, Footprints, Trophy } from 'lucide-react';
import { AppToolsModal, OfflineIndicator } from './components/PWAControls';
import { AccountSyncModal, WorkspaceShell } from './components/UiKit';
import { useTrainingReminders } from './data/usePWAInstall';
import { useTafStore } from './data/useTafStore';
import { findWeakestTest } from './domain/prfTafScoring';
import type { ExerciseGuide, RunWorkout } from './domain/types';
import { ActiveWorkoutScreen } from './screens/ActiveWorkoutScreen';
import { CorridaScreen } from './screens/CorridaScreen';
import { ExerciseGuideModal } from './screens/ExerciseGuideModal';
import { ForcaScreen } from './screens/ForcaScreen';
import { GuidedRunCoachScreen } from './screens/GuidedRunCoachScreen';
import { GuidedTafExamScreen } from './screens/GuidedTafExamScreen';
import { HojeScreen } from './screens/HojeScreen';
import { PerformanceDashboardScreen } from './screens/PerformanceDashboardScreen';
import { TafScreen } from './screens/TafScreen';

type AppTab = 'HOJE' | 'CORRIDA' | 'FORCA' | 'TAF' | 'DESEMPENHO';

const THEME_STORAGE_KEY = 'qg_prf_taf_theme_v1';

const SECTION_TITLES: Record<AppTab, string> = {
  HOJE: 'Agenda & Prontidão',
  CORRIDA: 'Plano de Corrida',
  FORCA: 'Treinos de Força',
  TAF: 'Simulados & Cronômetros',
  DESEMPENHO: 'Painel de Desempenho',
};

export function App() {
  const store = useTafStore();
  const [currentTab, setCurrentTab] = useState<AppTab>('HOJE');
  const [selectedRunWorkout, setSelectedRunWorkout] = useState<RunWorkout | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showAppToolsModal, setShowAppToolsModal] = useState(false);
  const [isGuidedExamActive, setIsGuidedExamActive] = useState(false);
  const [activeGuide, setActiveGuide] = useState<ExerciseGuide | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light') return false;
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#0A0A0C' : '#F3F1EC');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const todaySlotTitle = useMemo(() => {
    const slot = store.weeklyPlan.find((s) => s.dayKey === store.todayDayKey);
    if (!slot || slot.type === 'DESCANSO' || slot.type === 'CORRIDA_REAGENDADA') return null;
    return slot.title;
  }, [store.weeklyPlan, store.todayDayKey]);

  const reminders = useTrainingReminders(
    store.state.preferredTrainingStartMin,
    todaySlotTitle,
    store.isDoneToday
  );

  const recommendedTemplate = useMemo(() => {
    const templates = store.state.strengthTemplates;
    const weakest = findWeakestTest(store.state.tafHistory)?.name;
    const id =
      weakest === 'Corrida'
        ? 'fort_corrida'
        : weakest === 'Impulsão'
          ? 'esp_impulsao'
          : weakest === 'Shuttle Run'
            ? 'esp_shuttle'
            : weakest === 'Barra Fixa' || weakest === 'Abdominal'
              ? 'forca_barra_core'
              : 'fort_corrida';
    return templates.find((t) => t.id === id) ?? templates[0];
  }, [store.state.tafHistory, store.state.strengthTemplates]);

  const sidebarStats = useMemo(() => {
    const bestScore = store.state.tafHistory.reduce((max, s) => Math.max(max, s.totalPts), 0);
    const totalRuns = store.state.runWorkouts.length;
    const completedRuns = store.state.runWorkouts.filter(
      (r) => r.status === 'FEITO' || r.status === 'PARCIAL'
    ).length;
    return {
      bestScore,
      vdot: store.state.vdot,
      completedRuns,
      totalRuns,
      isDoneToday: store.isDoneToday,
    };
  }, [store.state.tafHistory, store.state.runWorkouts, store.state.vdot, store.isDoneToday]);

  const navTabs = [
    { key: 'HOJE', label: 'Hoje', icon: <CalendarDays className="w-[18px] h-[18px]" /> },
    { key: 'CORRIDA', label: 'Corrida', icon: <Footprints className="w-[18px] h-[18px]" /> },
    { key: 'FORCA', label: 'Treinos', icon: <Dumbbell className="w-[18px] h-[18px]" /> },
    { key: 'TAF', label: 'TAF', icon: <Trophy className="w-[18px] h-[18px]" /> },
    {
      key: 'DESEMPENHO',
      label: 'Desempenho',
      mobileLabel: 'Painel',
      icon: <BarChart3 className="w-[18px] h-[18px]" />,
    },
  ];

  return (
    <>
      {isGuidedExamActive ? (
        <GuidedTafExamScreen
          todayBr={store.todayBr}
          vdot={store.state.vdot}
          onComplete={(data, genero, barra, abdominal, impulsao, corrida, shuttle) => {
            store.saveSimulado(null, data, genero, barra, abdominal, impulsao, corrida, shuttle);
            setIsGuidedExamActive(false);
            setCurrentTab('TAF');
          }}
          onDiscard={() => setIsGuidedExamActive(false)}
        />
      ) : store.activeGuidedRun ? (
        <GuidedRunCoachScreen
          guided={store.activeGuidedRun}
          onTogglePlay={store.toggleGuidedRunPlaying}
          onNextStep={store.nextGuidedStep}
          onPreviousStep={store.previousGuidedStep}
          onToggleVoice={store.toggleGuidedVoice}
          onFinish={store.finishGuidedRun}
          onDiscard={store.discardGuidedRun}
        />
      ) : store.activeWorkout ? (
        <ActiveWorkoutScreen
          activeWorkout={store.activeWorkout}
          onUpdateSet={store.updateActiveSetInputs}
          onToggleSetDone={store.toggleActiveSetCompleted}
          onAddSet={store.addActiveSet}
          onAdjustRest={store.adjustRestTimer}
          onSkipRest={store.skipRestTimer}
          onOpenExerciseGuide={setActiveGuide}
          onDiscard={store.discardActiveWorkout}
          onFinish={store.finishActiveWorkout}
        />
      ) : (
        <WorkspaceShell
          tabs={navTabs}
          selectedKey={currentTab}
          onSelect={(k) => setCurrentTab(k as AppTab)}
          sectionTitle={SECTION_TITLES[currentTab]}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          isLoggedIn={store.isLoggedIn}
          userEmail={store.authConfig.userEmail}
          isSyncing={store.syncState.isSyncing}
          reminderEnabled={reminders.enabled}
          sidebarStats={sidebarStats}
          onOpenAccount={() => setShowAccountModal(true)}
          onOpenAppTools={() => setShowAppToolsModal(true)}
        >
          {currentTab === 'HOJE' && (
            <HojeScreen
              state={store.state}
              isDoneToday={store.isDoneToday}
              todayDayKey={store.todayDayKey}
              todayReadiness={store.effectiveTodayReadiness}
              weeklyPlan={store.weeklyPlan}
              onToggleDoneToday={store.toggleTodayTafDone}
              onSelectReadiness={store.setTodayReadiness}
              onSelectSplitPreset={store.setWeeklySplitPreset}
              onSelectTrainingStartMin={store.setPreferredTrainingStartMin}
              onStartGuidedRun={store.startGuidedRun}
              onOpenRunWorkout={(run) => {
                setSelectedRunWorkout(run);
                setCurrentTab('CORRIDA');
              }}
              onStartStrengthWorkout={store.startStrengthWorkout}
              onNavigateToRun={() => setCurrentTab('CORRIDA')}
              onNavigateToTaf={() => setCurrentTab('TAF')}
            />
          )}

          {currentTab === 'CORRIDA' && (
            <CorridaScreen
              state={store.state}
              selectedWorkoutForEdit={selectedRunWorkout}
              onSelectWorkout={setSelectedRunWorkout}
              onStartGuidedRun={store.startGuidedRun}
              onSaveWorkout={store.updateRunWorkout}
              onUpdateVdot={store.updateVdot}
              onCalculateVdotFromTest={store.updateVdotFromTest}
            />
          )}

          {currentTab === 'FORCA' && (
            <ForcaScreen
              state={store.state}
              recommendedTemplate={recommendedTemplate}
              onStartWorkout={store.startStrengthWorkout}
              onOpenExerciseGuide={setActiveGuide}
              onSaveTemplate={store.saveStrengthTemplate}
              onDeleteTemplate={store.deleteStrengthTemplate}
              onResetTemplates={store.resetStrengthTemplates}
            />
          )}

          {currentTab === 'TAF' && (
            <TafScreen
              state={store.state}
              todayBr={store.todayBr}
              onStartGuidedExam={() => setIsGuidedExamActive(true)}
              onSaveSimulado={store.saveSimulado}
              onDeleteSimulado={store.deleteSimulado}
            />
          )}

          {currentTab === 'DESEMPENHO' && (
            <PerformanceDashboardScreen
              state={store.state}
              isDark={isDark}
              onLogVdot={store.logVdotCheckpoint}
              onCalculateVdotFromTest={store.updateVdotFromTest}
              onNavigateToTaf={() => setCurrentTab('TAF')}
              onNavigateToRun={() => setCurrentTab('CORRIDA')}
              onNavigateToForca={() => setCurrentTab('FORCA')}
            />
          )}
        </WorkspaceShell>
      )}

      <OfflineIndicator />

      {showAccountModal && (
        <AccountSyncModal
          authConfig={store.authConfig}
          isLoggedIn={store.isLoggedIn}
          syncState={store.syncState}
          lastSyncedAt={store.state.lastSyncedAt}
          onClose={() => setShowAccountModal(false)}
          onSignInAndSync={store.signInAndSync}
          onSyncNow={store.syncNow}
          onSignOut={store.signOutSupabase}
        />
      )}

      {showAppToolsModal && (
        <AppToolsModal
          state={store.state}
          reminderEnabled={reminders.enabled}
          reminderSupported={reminders.isSupported}
          reminderPermission={reminders.permission}
          onToggleReminder={reminders.toggleEnabled}
          onSendTestReminder={reminders.sendTestReminder}
          onImportBackup={store.importAppStateBackup}
          onClose={() => setShowAppToolsModal(false)}
        />
      )}

      {activeGuide && (
        <ExerciseGuideModal guide={activeGuide} onClose={() => setActiveGuide(null)} />
      )}
    </>
  );
}

export default App;

import { useMemo, useState } from 'react';
import { CalendarDays, Dumbbell, Footprints, Trophy } from 'lucide-react';
import { AccountSyncModal, AppNavigation } from './components/UiKit';
import { useTafStore } from './data/useTafStore';
import { findWeakestTest } from './domain/prfTafScoring';
import type { ExerciseGuide, RunWorkout } from './domain/types';
import { ActiveWorkoutScreen } from './screens/ActiveWorkoutScreen';
import { CorridaScreen } from './screens/CorridaScreen';
import { ExerciseGuideModal } from './screens/ExerciseGuideModal';
import { ForcaScreen } from './screens/ForcaScreen';
import { GuidedRunCoachScreen } from './screens/GuidedRunCoachScreen';
import { HojeScreen } from './screens/HojeScreen';
import { TafScreen } from './screens/TafScreen';

type AppTab = 'HOJE' | 'CORRIDA' | 'FORCA' | 'TAF';

export function App() {
  const store = useTafStore();
  const [currentTab, setCurrentTab] = useState<AppTab>('HOJE');
  const [selectedRunWorkout, setSelectedRunWorkout] = useState<RunWorkout | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [activeGuide, setActiveGuide] = useState<ExerciseGuide | null>(null);

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

  const navTabs = [
    { key: 'HOJE', label: 'Hoje', icon: <CalendarDays className="w-5 h-5" /> },
    { key: 'CORRIDA', label: 'Corrida', icon: <Footprints className="w-5 h-5" /> },
    { key: 'FORCA', label: 'Treinos', icon: <Dumbbell className="w-5 h-5" /> },
    { key: 'TAF', label: 'TAF', icon: <Trophy className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-dvh bg-[#090B0E] text-[#F5F7FA]">
      {store.activeGuidedRun ? (
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
        <div className="min-h-dvh flex flex-col">
          <AppNavigation
            tabs={navTabs}
            selectedKey={currentTab}
            onSelect={(k) => setCurrentTab(k as AppTab)}
            isLoggedIn={store.isLoggedIn}
            userEmail={store.authConfig.userEmail}
            isSyncing={store.syncState.isSyncing}
            onOpenAccount={() => setShowAccountModal(true)}
          />

          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:pt-8 lg:pb-12">
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
              />
            )}

            {currentTab === 'TAF' && (
              <TafScreen
                state={store.state}
                todayBr={store.todayBr}
                onSaveSimulado={store.saveSimulado}
                onDeleteSimulado={store.deleteSimulado}
              />
            )}
          </main>
        </div>
      )}

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

      {activeGuide && (
        <ExerciseGuideModal guide={activeGuide} onClose={() => setActiveGuide(null)} />
      )}
    </div>
  );
}

export default App;

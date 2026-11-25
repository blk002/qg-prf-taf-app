import { useMemo, useState } from 'react';
import { CalendarDays, Dumbbell, Footprints, Trophy } from 'lucide-react';
import { AccountSyncModal, FloatingCapsuleDock } from './components/UiKit';
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

  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="max-w-md mx-auto min-h-dvh relative safe-top">
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
          <>
            {currentTab === 'HOJE' && (
              <HojeScreen
                state={store.state}
                isLoggedIn={store.isLoggedIn}
                syncState={store.syncState}
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
                onOpenAccountModal={() => setShowAccountModal(true)}
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
                isLoggedIn={store.isLoggedIn}
                syncState={store.syncState}
                todayBr={store.todayBr}
                onSaveSimulado={store.saveSimulado}
                onDeleteSimulado={store.deleteSimulado}
                onOpenAccountModal={() => setShowAccountModal(true)}
              />
            )}

            <FloatingCapsuleDock
              tabs={[
                { key: 'HOJE', label: 'Hoje', icon: <CalendarDays className="w-4 h-4" /> },
                { key: 'CORRIDA', label: 'Corrida', icon: <Footprints className="w-4 h-4" /> },
                { key: 'FORCA', label: 'Treinos', icon: <Dumbbell className="w-4 h-4" /> },
                { key: 'TAF', label: 'TAF', icon: <Trophy className="w-4 h-4" /> },
              ]}
              selectedKey={currentTab}
              onSelect={(k) => setCurrentTab(k as AppTab)}
            />
          </>
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
    </div>
  );
}

export default App;

export type RunStatus = 'PENDENTE' | 'FEITO' | 'PARCIAL' | 'PULADO';

export interface RunWorkout {
  id: string;
  phase: string;
  week: number;
  code: string;
  prescription: string;
  status: RunStatus;
  notes: string;
  completedDate: string | null;
  durationMin: number | null;
  startMin: number | null;
}

export interface VdotPaces {
  vdot: number;
  easyRange: string;
  moderateRange: string;
  rep200: string;
  rep300: string;
  rep400: string;
  rep600: string;
  interval800: string;
  thresholdMile: string;
  thresholdKm: string;
}

export interface TafSimulado {
  id: number;
  data: string;
  genero: string;
  barra: number;
  abdominal: number;
  impulsao: number;
  corrida: number;
  shuttle: number;
  ptsBarra: number;
  ptsAbdominal: number;
  ptsImpulsao: number;
  ptsCorrida: number;
  ptsShuttle: number;
  totalPts: number;
}

export interface TafTrainingStatus {
  lastDoneDate: string | null;
}

export interface WeakTestResult {
  name: string;
  averagePts: number;
  lastPts: number;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  sets: number;
  targetRepsOrTime: string;
  restSeconds: number;
  isTimed: boolean;
  cue: string;
}

export interface WorkoutTemplate {
  id: string;
  title: string;
  category: string;
  targetTest: string;
  subtitle: string;
  recommendedScheduleHint: string;
  exercises: ExerciseTemplate[];
}

export interface LoggedSet {
  setNumber: number;
  weightKg: number;
  repsOrSeconds: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  isTimed: boolean;
  restSeconds: number;
  cue: string;
  sets: LoggedSet[];
}

export interface StrengthSession {
  id: number;
  templateId: string;
  title: string;
  category: string;
  dateStr: string;
  durationSeconds: number;
  totalVolumeKg: number;
  exercises: ExerciseLog[];
  dateIso: string | null;
  startedAtMin: number | null;
}

export interface RoutineTrainingBlock {
  id: string;
  dayKey: string;
  dateIso: string;
  label: string;
  startMin: number;
  endMin: number;
  durationMin: number;
  note: string;
  category: string;
  source: string;
  isPlanned: boolean;
}

export type WeeklySplitPreset = 'SEG_QUA_SEX' | 'TER_QUI_SAB' | 'TER_QUI_DOM';

export type PlannedDayType =
  | 'CORRIDA_Q1'
  | 'CORRIDA_Q2'
  | 'CORRIDA_Q3'
  | 'CORRIDA_REAGENDADA'
  | 'FORCA_BARRA'
  | 'FORT_CORRIDA'
  | 'ESPECIFICO_TAF'
  | 'DESCANSO';

export interface PlannedDaySlot {
  dayKey: string;
  shortLabel: string;
  type: PlannedDayType;
  title: string;
  subtitle: string;
  estimatedMin: number;
  linkedRunId: string | null;
  linkedTemplateId: string | null;
  coachReason: string;
  runStatus?: RunStatus;
  isRescheduled?: boolean;
  rescheduledTargetDayKey?: string | null;
}

export type ReadinessLevel = 'ALTA' | 'NORMAL' | 'CANSADO';

export interface CoachGapInsight {
  testName: string;
  currentPts: number;
  nextPts: number;
  actionTip: string;
}

export interface ExerciseGuide {
  exerciseId: string;
  title: string;
  muscles: string;
  youtubeQuery: string;
  youtubeShortsQuery: string;
  setup: string;
  steps: string[];
  commonMistakes: string[];
}

export type RunStepType = 'WARMUP' | 'WORK' | 'RECOVERY' | 'STRIDES' | 'COOLDOWN';

export interface RunStep {
  index: number;
  title: string;
  targetLabel: string;
  durationSeconds: number;
  type: RunStepType;
}

export interface VdotCheckpoint {
  id: number;
  dateStr: string;
  vdot: number;
  source: 'manual' | 'teste';
  note?: string;
}

export interface TafAppState {
  vdot: number;
  vdotHistory?: VdotCheckpoint[];
  runWorkouts: RunWorkout[];
  strengthTemplates: WorkoutTemplate[];
  strengthHistory: StrengthSession[];
  tafHistory: TafSimulado[];
  tafTrainingStatus: TafTrainingStatus;
  routineBlocks: RoutineTrainingBlock[];
  weeklySplitPreset: WeeklySplitPreset;
  preferredTrainingStartMin: number;
  todayReadiness: ReadinessLevel;
  todayReadinessDate: string | null;
  deletedTafIds: number[];
  lastSyncedAt: string | null;
}

export interface RemoteTafAppData {
  vdot?: number | null;
  runWorkouts?: RunWorkout[];
  strengthTemplates?: WorkoutTemplate[];
  strengthHistory?: StrengthSession[];
  routineBlocks?: RoutineTrainingBlock[];
  weeklySplitPreset?: WeeklySplitPreset | null;
  preferredTrainingStartMin?: number | null;
  deletedTafIds?: number[];
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  userEmail: string;
  accessToken: string;
  refreshToken: string;
}

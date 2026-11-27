import assert from 'node:assert/strict';
import { readFileSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const tmpDir = resolve('.tmp-test-out');
mkdirSync(tmpDir, { recursive: true });

try {
  await build({
    entryPoints: [
      'src/domain/prfTafScoring.ts',
      'src/domain/vdotCalculator.ts',
      'src/domain/jackDanielsPlan.ts',
      'src/domain/runStepParser.ts',
      'src/domain/weeklyPlannerEngine.ts',
      'src/domain/exerciseGuides.ts',
      'src/domain/strengthModels.ts',
    ],
    outdir: tmpDir,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  });

  const scoring = await import(`file://${resolve(tmpDir, 'prfTafScoring.js')}`);
  const vdot = await import(`file://${resolve(tmpDir, 'vdotCalculator.js')}`);
  const jd = await import(`file://${resolve(tmpDir, 'jackDanielsPlan.js')}`);
  const parser = await import(`file://${resolve(tmpDir, 'runStepParser.js')}`);
  const planner = await import(`file://${resolve(tmpDir, 'weeklyPlannerEngine.js')}`);
  const guides = await import(`file://${resolve(tmpDir, 'exerciseGuides.js')}`);
  const strength = await import(`file://${resolve(tmpDir, 'strengthModels.js')}`);

  // 1. PRF Scoring
  assert.equal(scoring.calcBarra(2, true), 0);
  assert.equal(scoring.calcBarra(3, true), 2);
  assert.equal(scoring.calcBarra(9, true), 5);
  const simF = scoring.buildSimulado(1, '23/11/2026', 'feminino', 16, 33, 1.6, 2350, 14.0);
  assert.equal(simF.totalPts, 12.5);
  assert.equal(scoring.findWeakestTest([simF])?.name, 'Impulsão');

  // 2. VDOT Calculator
  assert.equal(Math.round(vdot.calculateVdot(3050, 16 * 60 + 22)), 34);
  const p34 = vdot.pacesForVdot(34);
  assert.equal(p34.easyRange, '6:45–7:31/km');
  assert.equal(p34.rep400, '2:00');
  assert.equal(p34.thresholdKm, '5:48/km');

  // 3. Jack Daniels 54 workouts
  const plan = jd.defaultJackDanielsWorkouts();
  assert.equal(plan.length, 54);
  assert.equal(plan.filter((w) => w.status === 'FEITO').length, 4);
  assert.equal(plan.filter((w) => w.status === 'PARCIAL').length, 1);
  assert.equal(plan.filter((w) => w.status === 'PULADO').length, 1);
  assert.equal(plan.filter((w) => w.status === 'PENDENTE').length, 48);
  assert.equal(plan.find((w) => w.status === 'PENDENTE')?.id, 'II-9-Q1');

  // 4. Run Step Parser
  const q2 = plan.find((w) => w.id === 'II-7-Q2');
  const steps = parser.parseRunWorkoutSteps(q2, p34);
  assert.equal(steps.length, 18);
  assert.equal(steps.filter((s) => s.type === 'WORK').length, 8);

  // 5. Weekly Planner + Planned Routine Blocks
  const templates = strength.defaultPrfTemplates();

  // 5a. On Monday (2026-11-23), all 3 runs Q1/Q2/Q3 are scheduled across Seg/Qua/Sex (6 training days total)
  const mondayRef = new Date(2026, 10, 23);
  const mondayPlan = planner.buildWeeklyPlan('SEG_QUA_SEX', plan, [], templates, mondayRef);
  assert.equal(mondayPlan.find((d) => d.dayKey === 'seg')?.linkedRunId, 'II-9-Q1');
  assert.equal(mondayPlan.find((d) => d.dayKey === 'qua')?.linkedRunId, 'II-9-Q2');
  assert.equal(mondayPlan.find((d) => d.dayKey === 'sex')?.linkedRunId, 'II-9-Q3');

  const plannedAllMonday = planner.buildPlannedRoutineBlocks(
    'SEG_QUA_SEX',
    plan,
    [],
    templates,
    390,
    [],
    mondayRef
  );
  assert.equal(plannedAllMonday.length, 6);
  assert.ok(
    plannedAllMonday.every((b) => b.isPlanned && b.source === 'taf_app' && b.category === 'training')
  );

  // 5b. On Wednesday (2026-11-25), if Q1 was NOT completed on Monday, today (Qua) MUST prescribe Q1 (not Q2)
  const wedRef = new Date(2026, 10, 25);
  const wedPlanMissedQ1 = planner.buildWeeklyPlan('SEG_QUA_SEX', plan, [], templates, wedRef);
  assert.equal(wedPlanMissedQ1.find((d) => d.dayKey === 'seg')?.type, 'CORRIDA_REAGENDADA');
  assert.equal(wedPlanMissedQ1.find((d) => d.dayKey === 'seg')?.linkedRunId, null);
  assert.equal(wedPlanMissedQ1.find((d) => d.dayKey === 'qua')?.linkedRunId, 'II-9-Q1');
  assert.equal(wedPlanMissedQ1.find((d) => d.dayKey === 'qua')?.type, 'CORRIDA_Q1');
  assert.equal(wedPlanMissedQ1.find((d) => d.dayKey === 'qua')?.isRescheduled, true);
  assert.equal(wedPlanMissedQ1.find((d) => d.dayKey === 'sex')?.linkedRunId, 'II-9-Q2');

  // 5c. On Wednesday (2026-11-25), once Q1 IS completed on Monday, today (Qua) advances to Q2
  const planWithQ1Done = plan.map((w) =>
    w.id === 'II-9-Q1' ? { ...w, status: 'FEITO', completedDate: '2026-11-23' } : w
  );
  const wedPlanQ1Done = planner.buildWeeklyPlan('SEG_QUA_SEX', planWithQ1Done, [], templates, wedRef);
  assert.equal(wedPlanQ1Done.find((d) => d.dayKey === 'seg')?.linkedRunId, 'II-9-Q1');
  assert.equal(wedPlanQ1Done.find((d) => d.dayKey === 'qua')?.linkedRunId, 'II-9-Q2');
  assert.equal(wedPlanQ1Done.find((d) => d.dayKey === 'qua')?.isRescheduled, false);
  assert.equal(wedPlanQ1Done.find((d) => d.dayKey === 'sex')?.linkedRunId, 'II-9-Q3');

  // 5d. On Wednesday (2026-11-25), if Q1 was completed TODAY, Qua keeps showing Q1 as done and Sex gets Q2
  const planWithQ1DoneToday = plan.map((w) =>
    w.id === 'II-9-Q1' ? { ...w, status: 'FEITO', completedDate: '2026-11-25' } : w
  );
  const wedPlanQ1Today = planner.buildWeeklyPlan(
    'SEG_QUA_SEX',
    planWithQ1DoneToday,
    [],
    templates,
    wedRef
  );
  assert.equal(wedPlanQ1Today.find((d) => d.dayKey === 'qua')?.linkedRunId, 'II-9-Q1');
  assert.equal(wedPlanQ1Today.find((d) => d.dayKey === 'qua')?.runStatus, 'FEITO');
  assert.equal(wedPlanQ1Today.find((d) => d.dayKey === 'sex')?.linkedRunId, 'II-9-Q2');

  const plannedRemaining = planner.buildPlannedRoutineBlocks(
    'SEG_QUA_SEX',
    plan,
    [],
    templates,
    390,
    [
      {
        id: 'taf_run_II-9-Q1',
        dayKey: 'seg',
        dateIso: '2026-11-23',
        label: 'Corrida Sem 9 · Q1',
        startMin: 400,
        endMin: 460,
        durationMin: 60,
        note: '60 min',
        category: 'training',
        source: 'taf_app',
        isPlanned: false,
      },
    ],
    mondayRef
  );
  assert.equal(plannedRemaining.length, 5);

  // 6. Exercise Guides (20/20)
  const allEx = templates.flatMap((t) => t.exercises);
  assert.equal(allEx.length, 20);
  assert.equal(guides.ExerciseGuides.all().length, 20);

  // Sanity check SQL file exists
  assert.ok(readFileSync('supabase/taf_sync_rpc.sql', 'utf8').includes('sync_taf_payload'));

  console.log('ALL_DOMAIN_TESTS_PASSED (6/6 suites)');
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

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
  const refDate = new Date(2026, 10, 24); // Tuesday, Monday = 2026-11-23
  const plannedAll = planner.buildPlannedRoutineBlocks(
    'SEG_QUA_SEX',
    plan,
    [],
    templates,
    390,
    [],
    refDate
  );
  assert.equal(plannedAll.length, 6);
  assert.ok(plannedAll.every((b) => b.isPlanned && b.source === 'taf_app' && b.category === 'training'));

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
    refDate
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

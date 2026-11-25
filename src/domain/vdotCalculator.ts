import type { VdotPaces } from './types';

export function calculateVdot(distanceMeters: number, timeSeconds: number): number {
  if (distanceMeters <= 0 || timeSeconds <= 0) return 34;
  const timeMin = timeSeconds / 60;
  const velocity = distanceMeters / timeMin;
  const vo2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
  const fraction =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMin) +
    0.2989558 * Math.exp(-0.1932605 * timeMin);
  return Math.min(85, Math.max(20, vo2 / fraction));
}

function secondsPerKmForFraction(vdot: number, fractionOfVdot: number): number {
  const targetVo2 = vdot * fractionOfVdot;
  const a = 0.000104;
  const b = 0.182258;
  const c = -(4.6 + targetVo2);
  const discriminant = Math.max(0, b * b - 4 * a * c);
  const velocityMPerMin = (-b + Math.sqrt(discriminant)) / (2 * a);
  const secPerKm = (1000 / velocityMPerMin) * 60;
  return Math.round(secPerKm);
}

export function formatSec(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function pacesForVdot(rawVdot: number): VdotPaces {
  const vdot = Math.min(65, Math.max(30, Math.round(rawVdot)));
  if (vdot === 34) {
    return {
      vdot: 34,
      easyRange: '6:45–7:31/km',
      moderateRange: '6:30–6:50/km',
      rep200: '1:00',
      rep300: '1:30',
      rep400: '2:00',
      rep600: '3:00',
      interval800: '4:16',
      thresholdMile: '9:20',
      thresholdKm: '5:48/km',
    };
  }

  const easySlowSecPerKm = secondsPerKmForFraction(vdot, 0.59);
  const easyFastSecPerKm = secondsPerKmForFraction(vdot, 0.68);
  const modSlowSecPerKm = Math.max(easyFastSecPerKm, easyFastSecPerKm + 5);
  const modFastSecPerKm = Math.max(180, easyFastSecPerKm - 15);

  const thresholdSecPerKm = secondsPerKmForFraction(vdot, 0.88);
  const thresholdMileSec = Math.round(thresholdSecPerKm * 1.60934);

  const intervalSecPerKm = secondsPerKmForFraction(vdot, 0.985);
  const interval800Sec = Math.round(intervalSecPerKm * 0.8);

  const repSecPerKm = secondsPerKmForFraction(vdot, 1.07);
  const rep400Sec = Math.round(repSecPerKm * 0.4);
  const rep200Sec = Math.round(rep400Sec * 0.5);
  const rep300Sec = Math.round(rep400Sec * 0.75);
  const rep600Sec = Math.round(rep400Sec * 1.5);

  return {
    vdot,
    easyRange: `${formatSec(easyFastSecPerKm)}–${formatSec(easySlowSecPerKm)}/km`,
    moderateRange: `${formatSec(modFastSecPerKm)}–${formatSec(modSlowSecPerKm)}/km`,
    rep200: formatSec(rep200Sec),
    rep300: formatSec(rep300Sec),
    rep400: formatSec(rep400Sec),
    rep600: formatSec(rep600Sec),
    interval800: formatSec(interval800Sec),
    thresholdMile: formatSec(thresholdMileSec),
    thresholdKm: `${formatSec(thresholdSecPerKm)}/km`,
  };
}

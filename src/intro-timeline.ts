export const INTRO_DURATION = 10400;

export function progress(time: number, from: number, to: number) {
  const value = Math.max(0, Math.min(1, (time - from) / (to - from)));
  return value * value * (3 - 2 * value);
}

export function introFrame(time: number) {
  const world = progress(time, 1300, 2900);
  const walk = progress(time, 2800, 4900);
  const capture = progress(time, 4650, 5250);
  const report = progress(time, 6000, 7550);
  const resolve = progress(time, 8450, INTRO_DURATION);
  return {
    world,
    walk,
    capture,
    report,
    resolve,
    x: 450 - 230 * world + 116 * walk,
    y: 390 + 46 * world,
    scale: 1.3 - 0.52 * world,
    stride: Math.sin(walk * Math.PI * 8) * Math.sin(walk * Math.PI),
    flash: Math.max(0, 1 - Math.abs(time - 5580) / 180),
    caption: time < 2400 ? 0 : time < 5500 ? 1 : time < 8250 ? 2 : 3,
  };
}

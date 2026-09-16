export function randomFakeEngagementBase(): number {
  return randomInt(100, 500);
}

export function pickSpaSeedFakeCount(): number {
  if (Math.random() < 0.05) {
    return randomInt(200, 600);
  }
  return randomFakeEngagementBase();
}

export function pickDealSeedFakeCount(): number {
  return randomFakeEngagementBase();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

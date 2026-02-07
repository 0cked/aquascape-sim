export const TANK = {
  width: 6,
  depth: 3.6,
  height: 4,
  glass: 0.06,
} as const;

export const TANK_INNER = {
  width: TANK.width - TANK.glass * 2,
  depth: TANK.depth - TANK.glass * 2,
  height: TANK.height - TANK.glass,
} as const;


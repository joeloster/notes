import { SNAP_GRID } from '@/types/canvas';

export function snapToGrid(value: number, grid: number = SNAP_GRID): number {
  return Math.round(value / grid) * grid;
}

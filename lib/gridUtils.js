// lib/gridUtils.js
// Canonical Grid Indexing & Schema Constants for Phase 3.1

export const GRID_MIN_X = -3500000;
export const GRID_MAX_X = 3500000;
export const GRID_MIN_Y = -3500000;
export const GRID_MAX_Y = 3500000;
export const GRID_CELL_SIZE_M = 25000; // 25 km

export const GRID_COLUMNS = Math.floor((GRID_MAX_X - GRID_MIN_X) / GRID_CELL_SIZE_M); // 280
export const GRID_ROWS = Math.floor((GRID_MAX_Y - GRID_MIN_Y) / GRID_CELL_SIZE_M); // 280
export const GRID_TOTAL_CELLS = GRID_COLUMNS * GRID_ROWS; // 78,400

/**
 * Returns the canonical 1D index for a given grid row and column.
 * Uses column-major ordering matching earlier implementations (col * GRID_ROWS + row).
 */
export function cellIndex(row, col) {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLUMNS) {
    return null;
  }
  return col * GRID_ROWS + row;
}

/**
 * Reverses the canonical 1D index back to row/col.
 */
export function indexToRowCol(index) {
  if (index < 0 || index >= GRID_TOTAL_CELLS) {
    return null;
  }
  const row = index % GRID_ROWS;
  const col = Math.floor(index / GRID_ROWS);
  return { row, col };
}

/**
 * Returns canonical grid coordinates (col, row) for a given EPSG:3031 projected point.
 */
export function getColRowFromXY(x, y) {
  if (x < GRID_MIN_X || x >= GRID_MAX_X || y < GRID_MIN_Y || y >= GRID_MAX_Y) {
    return null;
  }
  const col = Math.floor((x - GRID_MIN_X) / GRID_CELL_SIZE_M);
  const row = Math.floor((y - GRID_MIN_Y) / GRID_CELL_SIZE_M);
  return { col, row };
}

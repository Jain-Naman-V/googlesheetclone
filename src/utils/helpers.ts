import { CellValue } from '../types';

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Convert column index to letter (0 -> A, 1 -> B, etc.)
export const indexToColumn = (index: number): string => {
  let column = '';
  let temp = index + 1;
  
  while (temp > 0) {
    const remainder = (temp - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    temp = Math.floor((temp - remainder) / 26);
  }
  
  return column;
};

// Convert column letter to index (A -> 0, B -> 1, etc.)
export const columnToIndex = (column: string): number => {
  let index = 0;
  for (let i = 0; i < column.length; i++) {
    index = index * 26 + column.charCodeAt(i) - 64;
  }
  return index - 1;
};

// Parse cell reference (e.g., "A1" -> { row: 0, col: 0 })
export const parseCellReference = (ref: string): { row: number; col: number } | null => {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  const colStr = match[1];
  const rowStr = match[2];
  
  const col = columnToIndex(colStr);
  const row = parseInt(rowStr) - 1;
  
  return { row, col };
};

// Format cell reference (e.g., { row: 0, col: 0 } -> "A1")
export const formatCellReference = (row: number, col: number): string => {
  return `${indexToColumn(col)}${row + 1}`;
};

// Check if a value is numeric
export const isNumeric = (value: CellValue): boolean => {
  if (value === null) return false;
  if (typeof value === 'number') return true;
  return !isNaN(Number(value));
};

// Convert a value to number if possible
export const toNumber = (value: CellValue): number => {
  if (value === null) return 0;
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Format number with commas
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Debounce function
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
): ((...args: Parameters<F>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
};

// Get range of cells from selection
export const getCellRangeFromSelection = (
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): string => {
  const startRef = formatCellReference(startRow, startCol);
  const endRef = formatCellReference(endRow, endCol);
  return `${startRef}:${endRef}`;
};

// Check if point is in rectangle
export const isPointInRect = (
  x: number,
  y: number,
  rect: { left: number; top: number; right: number; bottom: number }
): boolean => {
  return (
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom
  );
};

// Clamp a value between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};
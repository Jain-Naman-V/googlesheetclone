export type CellValue = string | number | null;

export type CellStyle = {
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
};

export type Cell = {
  id: string;
  value: CellValue;
  displayValue?: string;
  formula?: string;
  style: CellStyle;
  dependencies?: string[];
  dependents?: string[];
};

export type Row = {
  id: string;
  index: number;
  height: number;
  cells: Record<string, Cell>;
};

export type Column = {
  id: string;
  index: number;
  width: number;
};

export type Selection = {
  startRowIndex: number;
  startColIndex: number;
  endRowIndex: number;
  endColIndex: number;
};

export type ActiveCell = {
  rowIndex: number;
  colIndex: number;
};

export type SheetData = {
  rows: Record<string, Row>;
  columns: Record<string, Column>;
  selection: Selection | null;
  activeCell: ActiveCell | null;
  editingCell: boolean;
  editValue: string;
  undoStack: SheetState[];
  redoStack: SheetState[];
  clipboard: {
    data: Cell[][];
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null;
};

export type SheetState = {
  rows: Record<string, Row>;
  columns: Record<string, Column>;
};

export type FunctionType = 'math' | 'dataQuality';

export type SheetFunction = {
  name: string;
  type: FunctionType;
  description: string;
  execute: (args: CellValue[]) => CellValue;
};
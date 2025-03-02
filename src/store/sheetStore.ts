import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { 
  SheetData, 
  Cell, 
  Row, 
  Column, 
  CellValue, 
  Selection, 
  ActiveCell,
  SheetState
} from '../types';
import { generateId } from '../utils/helpers';
import { evaluateFormula } from '../utils/formulaEvaluator';

const DEFAULT_ROW_COUNT = 100;
const DEFAULT_COL_COUNT = 26;
const DEFAULT_ROW_HEIGHT = 25;
const DEFAULT_COL_WIDTH = 100;

const createInitialState = (): SheetData => {
  const rows: Record<string, Row> = {};
  const columns: Record<string, Column> = {};

  // Create initial rows
  for (let i = 0; i < DEFAULT_ROW_COUNT; i++) {
    const rowId = generateId();
    rows[rowId] = {
      id: rowId,
      index: i,
      height: DEFAULT_ROW_HEIGHT,
      cells: {}
    };
  }

  // Create initial columns
  for (let i = 0; i < DEFAULT_COL_COUNT; i++) {
    const colId = generateId();
    columns[colId] = {
      id: colId,
      index: i,
      width: DEFAULT_COL_WIDTH
    };
  }

  return {
    rows,
    columns,
    selection: null,
    activeCell: null,
    editingCell: false,
    editValue: '',
    undoStack: [],
    redoStack: [],
    clipboard: null
  };
};

export const useSheetStore = create(
  immer<SheetData>((set, get) => ({
    ...createInitialState(),

    // Save current state for undo
    saveState: () => {
      set(state => {
        const currentState: SheetState = {
          rows: JSON.parse(JSON.stringify(state.rows)),
          columns: JSON.parse(JSON.stringify(state.columns))
        };
        state.undoStack.push(currentState);
        state.redoStack = [];
      });
    },

    // Undo last action
    undo: () => {
      set(state => {
        if (state.undoStack.length > 0) {
          const prevState = state.undoStack.pop();
          if (prevState) {
            const currentState: SheetState = {
              rows: JSON.parse(JSON.stringify(state.rows)),
              columns: JSON.parse(JSON.stringify(state.columns))
            };
            state.redoStack.push(currentState);
            state.rows = prevState.rows;
            state.columns = prevState.columns;
          }
        }
      });
    },

    // Redo last undone action
    redo: () => {
      set(state => {
        if (state.redoStack.length > 0) {
          const nextState = state.redoStack.pop();
          if (nextState) {
            const currentState: SheetState = {
              rows: JSON.parse(JSON.stringify(state.rows)),
              columns: JSON.parse(JSON.stringify(state.columns))
            };
            state.undoStack.push(currentState);
            state.rows = nextState.rows;
            state.columns = nextState.columns;
          }
        }
      });
    },

    // Get cell by row and column indices
    getCell: (rowIndex: number, colIndex: number): Cell | null => {
      const state = get();
      const rowId = Object.keys(state.rows).find(
        id => state.rows[id].index === rowIndex
      );
      const colId = Object.keys(state.columns).find(
        id => state.columns[id].index === colIndex
      );

      if (!rowId || !colId) return null;

      const row = state.rows[rowId];
      const cellId = `${rowId}:${colId}`;

      if (!row.cells[cellId]) {
        return {
          id: cellId,
          value: null,
          style: {},
          dependencies: [],
          dependents: []
        };
      }

      return row.cells[cellId];
    },

    // Set active cell
    setActiveCell: (rowIndex: number, colIndex: number) => {
      set(state => {
        state.activeCell = { rowIndex, colIndex };
        state.selection = {
          startRowIndex: rowIndex,
          startColIndex: colIndex,
          endRowIndex: rowIndex,
          endColIndex: colIndex
        };
        
        const cell = get().getCell(rowIndex, colIndex);
        state.editValue = cell?.formula || String(cell?.value || '');
        state.editingCell = false;
      });
    },

    // Start editing cell
    startEditingCell: () => {
      set(state => {
        state.editingCell = true;
      });
    },

    // Set cell value
    setCellValue: (rowIndex: number, colIndex: number, value: string, isFormula: boolean = false) => {
      set(state => {
        // Save current state for undo
        get().saveState();

        const rowId = Object.keys(state.rows).find(
          id => state.rows[id].index === rowIndex
        );
        const colId = Object.keys(state.columns).find(
          id => state.columns[id].index === colIndex
        );

        if (!rowId || !colId) return;

        const cellId = `${rowId}:${colId}`;
        const row = state.rows[rowId];

        // Create cell if it doesn't exist
        if (!row.cells[cellId]) {
          row.cells[cellId] = {
            id: cellId,
            value: null,
            style: {},
            dependencies: [],
            dependents: []
          };
        }

        const cell = row.cells[cellId];

        if (isFormula) {
          cell.formula = value;
          try {
            // Update cell dependencies
            if (cell.dependencies) {
              // Remove this cell from dependents of its dependencies
              cell.dependencies.forEach(depId => {
                const [depRowId, depColId] = depId.split(':');
                const depRow = state.rows[depRowId];
                if (depRow && depRow.cells[depId]) {
                  const depCell = depRow.cells[depId];
                  if (depCell.dependents) {
                    depCell.dependents = depCell.dependents.filter(id => id !== cellId);
                  }
                }
              });
            }

            // Calculate new value and update dependencies
            const { result, dependencies } = evaluateFormula(value.substring(1), get().getCell);
            cell.value = result;
            cell.displayValue = String(result);
            cell.dependencies = dependencies;

            // Add this cell to dependents of its dependencies
            dependencies.forEach(depId => {
              const [depRowId, depColId] = depId.split(':');
              const depRow = state.rows[depRowId];
              if (depRow && depRow.cells[depId]) {
                const depCell = depRow.cells[depId];
                if (!depCell.dependents) {
                  depCell.dependents = [];
                }
                if (!depCell.dependents.includes(cellId)) {
                  depCell.dependents.push(cellId);
                }
              }
            });

            // Update dependent cells
            if (cell.dependents) {
              cell.dependents.forEach(depId => {
                const [depRowId, depColId] = depId.split(':');
                const depRow = state.rows[depRowId];
                if (depRow && depRow.cells[depId] && depRow.cells[depId].formula) {
                  const depCell = depRow.cells[depId];
                  try {
                    const { result } = evaluateFormula(
                      depCell.formula!.substring(1),
                      get().getCell
                    );
                    depCell.value = result;
                    depCell.displayValue = String(result);
                  } catch (error) {
                    depCell.value = '#ERROR!';
                    depCell.displayValue = '#ERROR!';
                  }
                }
              });
            }
          } catch (error) {
            cell.value = '#ERROR!';
            cell.displayValue = '#ERROR!';
          }
        } else {
          // Handle non-formula input
          cell.formula = undefined;
          
          // Try to convert to number if possible
          const numValue = Number(value);
          if (!isNaN(numValue) && value.trim() !== '') {
            cell.value = numValue;
          } else {
            cell.value = value === '' ? null : value;
          }
          
          cell.displayValue = value;
          
          // Update dependent cells if any
          if (cell.dependents) {
            cell.dependents.forEach(depId => {
              const [depRowId, depColId] = depId.split(':');
              const depRow = state.rows[depRowId];
              if (depRow && depRow.cells[depId] && depRow.cells[depId].formula) {
                const depCell = depRow.cells[depId];
                try {
                  const { result } = evaluateFormula(
                    depCell.formula!.substring(1),
                    get().getCell
                  );
                  depCell.value = result;
                  depCell.displayValue = String(result);
                } catch (error) {
                  depCell.value = '#ERROR!';
                  depCell.displayValue = '#ERROR!';
                }
              }
            });
          }
        }

        state.editingCell = false;
      });
    },

    // Set selection
    setSelection: (selection: Selection) => {
      set(state => {
        state.selection = selection;
      });
    },

    // Update selection while dragging
    updateSelection: (rowIndex: number, colIndex: number) => {
      set(state => {
        if (state.selection) {
          state.selection.endRowIndex = rowIndex;
          state.selection.endColIndex = colIndex;
        }
      });
    },

    // Set cell style
    setCellStyle: (style: Partial<Cell['style']>) => {
      set(state => {
        // Save current state for undo
        get().saveState();

        if (!state.selection) return;

        const { startRowIndex, startColIndex, endRowIndex, endColIndex } = state.selection;
        
        const minRow = Math.min(startRowIndex, endRowIndex);
        const maxRow = Math.max(startRowIndex, endRowIndex);
        const minCol = Math.min(startColIndex, endColIndex);
        const maxCol = Math.max(startColIndex, endColIndex);

        for (let i = minRow; i <= maxRow; i++) {
          for (let j = minCol; j <= maxCol; j++) {
            const rowId = Object.keys(state.rows).find(
              id => state.rows[id].index === i
            );
            const colId = Object.keys(state.columns).find(
              id => state.columns[id].index === j
            );

            if (!rowId || !colId) continue;

            const cellId = `${rowId}:${colId}`;
            const row = state.rows[rowId];

            // Create cell if it doesn't exist
            if (!row.cells[cellId]) {
              row.cells[cellId] = {
                id: cellId,
                value: null,
                style: {},
                dependencies: [],
                dependents: []
              };
            }

            // Update style
            row.cells[cellId].style = {
              ...row.cells[cellId].style,
              ...style
            };
          }
        }
      });
    },

    // Add row
    addRow: (afterIndex: number) => {
      set(state => {
        // Save current state for undo
        get().saveState();

        // Shift all rows after the insertion point
        Object.keys(state.rows).forEach(id => {
          if (state.rows[id].index > afterIndex) {
            state.rows[id].index += 1;
          }
        });

        // Create new row
        const newRowId = generateId();
        state.rows[newRowId] = {
          id: newRowId,
          index: afterIndex + 1,
          height: DEFAULT_ROW_HEIGHT,
          cells: {}
        };
      });
    },

    // Delete row
    deleteRow: (index: number) => {
      set(state => {
        // Save current state for undo
        get().saveState();

        // Find row to delete
        const rowId = Object.keys(state.rows).find(
          id => state.rows[id].index === index
        );

        if (!rowId) return;

        // Delete row
        delete state.rows[rowId];

        // Shift all rows after the deleted row
        Object.keys(state.rows).forEach(id => {
          if (state.rows[id].index > index) {
            state.rows[id].index -= 1;
          }
        });
      });
    },

    // Add column
    addColumn: (afterIndex: number) => {
      set(state => {
        // Save current state for undo
        get().saveState();

        // Shift all columns after the insertion point
        Object.keys(state.columns).forEach(id => {
          if (state.columns[id].index > afterIndex) {
            state.columns[id].index += 1;
          }
        });

        // Create new column
        const newColId = generateId();
        state.columns[newColId] = {
          id: newColId,
          index: afterIndex + 1,
          width: DEFAULT_COL_WIDTH
        };
      });
    },

    // Delete column
    deleteColumn: (index: number) => {
      set(state => {
        // Save current state for undo
        get().saveState();

        // Find column to delete
        const colId = Object.keys(state.columns).find(
          id => state.columns[id].index === index
        );

        if (!colId) return;

        // Delete column
        delete state.columns[colId];

        // Shift all columns after the deleted column
        Object.keys(state.columns).forEach(id => {
          if (state.columns[id].index > index) {
            state.columns[id].index -= 1;
          }
        });
      });
    },

    // Resize row
    resizeRow: (index: number, height: number) => {
      set(state => {
        // Save current state for undo
        get().saveState();

        // Find row to resize
        const rowId = Object.keys(state.rows).find(
          id => state.rows[id].index === index
        );

        if (!rowId) return;

        // Update height
        state.rows[rowId].height = height;
      });
    },

    // Resize column
    resizeColumn: (index: number, width: number) => {
      set(state => {
        // Save current state for undo
        get().saveState();

        // Find column to resize
        const colId = Object.keys(state.columns).find(
          id => state.columns[id].index === index
        );

        if (!colId) return;

        // Update width
        state.columns[colId].width = width;
      });
    },

    // Copy selection to clipboard
    copySelection: () => {
      set(state => {
        if (!state.selection) return;

        const { startRowIndex, startColIndex, endRowIndex, endColIndex } = state.selection;
        
        const minRow = Math.min(startRowIndex, endRowIndex);
        const maxRow = Math.max(startRowIndex, endRowIndex);
        const minCol = Math.min(startColIndex, endColIndex);
        const maxCol = Math.max(startColIndex, endColIndex);

        const data: Cell[][] = [];

        for (let i = minRow; i <= maxRow; i++) {
          const row: Cell[] = [];
          for (let j = minCol; j <= maxCol; j++) {
            const cell = get().getCell(i, j);
            row.push(cell || {
              id: '',
              value: null,
              style: {},
              dependencies: [],
              dependents: []
            });
          }
          data.push(row);
        }

        state.clipboard = {
          data,
          startRow: minRow,
          startCol: minCol,
          endRow: maxRow,
          endCol: maxCol
        };
      });
    },

    // Paste from clipboard
    pasteFromClipboard: (targetRowIndex: number, targetColIndex: number) => {
      set(state => {
        const clipboard = get().clipboard;
        if (!clipboard) return;

        // Save current state for undo
        get().saveState();

        const { data } = clipboard;
        const rowCount = data.length;
        const colCount = data[0].length;

        for (let i = 0; i < rowCount; i++) {
          for (let j = 0; j < colCount; j++) {
            const sourceCell = data[i][j];
            const targetRow = targetRowIndex + i;
            const targetCol = targetColIndex + j;

            const rowId = Object.keys(state.rows).find(
              id => state.rows[id].index === targetRow
            );
            const colId = Object.keys(state.columns).find(
              id => state.columns[id].index === targetCol
            );

            if (!rowId || !colId) continue;

            const cellId = `${rowId}:${colId}`;
            const row = state.rows[rowId];

            // Create cell if it doesn't exist
            if (!row.cells[cellId]) {
              row.cells[cellId] = {
                id: cellId,
                value: null,
                style: {},
                dependencies: [],
                dependents: []
              };
            }

            // Copy cell properties
            const targetCell = row.cells[cellId];
            targetCell.value = sourceCell.value;
            targetCell.displayValue = sourceCell.displayValue;
            targetCell.formula = sourceCell.formula;
            targetCell.style = { ...sourceCell.style };

            // Update formula and dependencies if needed
            if (targetCell.formula) {
              try {
                const { result, dependencies } = evaluateFormula(
                  targetCell.formula.substring(1),
                  get().getCell
                );
                targetCell.value = result;
                targetCell.displayValue = String(result);
                targetCell.dependencies = dependencies;
              } catch (error) {
                targetCell.value = '#ERROR!';
                targetCell.displayValue = '#ERROR!';
              }
            }
          }
        }

        // Update selection to pasted area
        state.selection = {
          startRowIndex: targetRowIndex,
          startColIndex: targetColIndex,
          endRowIndex: targetRowIndex + rowCount - 1,
          endColIndex: targetColIndex + colCount - 1
        };
      });
    },

    // Cut selection
    cutSelection: () => {
      set(state => {
        // First copy
        get().copySelection();
        
        // Then clear
        if (!state.selection) return;

        // Save current state for undo
        get().saveState();

        const { startRowIndex, startColIndex, endRowIndex, endColIndex } = state.selection;
        
        const minRow = Math.min(startRowIndex, endRowIndex);
        const maxRow = Math.max(startRowIndex, endRowIndex);
        const minCol = Math.min(startColIndex, endColIndex);
        const maxCol = Math.max(startColIndex, endColIndex);

        for (let i = minRow; i <= maxRow; i++) {
          for (let j = minCol; j <= maxCol; j++) {
            const rowId = Object.keys(state.rows).find(
              id => state.rows[id].index === i
            );
            const colId = Object.keys(state.columns).find(
              id => state.columns[id].index === j
            );

            if (!rowId || !colId) continue;

            const cellId = `${rowId}:${colId}`;
            const row = state.rows[rowId];

            if (row.cells[cellId]) {
              // Clear cell
              row.cells[cellId].value = null;
              row.cells[cellId].displayValue = undefined;
              row.cells[cellId].formula = undefined;
              
              // Update dependent cells
              if (row.cells[cellId].dependents) {
                row.cells[cellId].dependents.forEach(depId => {
                  const [depRowId, depColId] = depId.split(':');
                  const depRow = state.rows[depRowId];
                  if (depRow && depRow.cells[depId] && depRow.cells[depId].formula) {
                    const depCell = depRow.cells[depId];
                    try {
                      const { result } = evaluateFormula(
                        depCell.formula!.substring(1),
                        get().getCell
                      );
                      depCell.value = result;
                      depCell.displayValue = String(result);
                    } catch (error) {
                      depCell.value = '#ERROR!';
                      depCell.displayValue = '#ERROR!';
                    }
                  }
                });
              }
            }
          }
        }
      });
    },

    // Clear selection
    clearSelection: () => {
      set(state => {
        if (!state.selection) return;

        // Save current state for undo
        get().saveState();

        const { startRowIndex, startColIndex, endRowIndex, endColIndex } = state.selection;
        
        const minRow = Math.min(startRowIndex, endRowIndex);
        const maxRow = Math.max(startRowIndex, endRowIndex);
        const minCol = Math.min(startColIndex, endColIndex);
        const maxCol = Math.max(startColIndex, endColIndex);

        for (let i = minRow; i <= maxRow; i++) {
          for (let j = minCol; j <= maxCol; j++) {
            const rowId = Object.keys(state.rows).find(
              id => state.rows[id].index === i
            );
            const colId = Object.keys(state.columns).find(
              id => state.columns[id].index === j
            );

            if (!rowId || !colId) continue;

            const cellId = `${rowId}:${colId}`;
            const row = state.rows[rowId];

            if (row.cells[cellId]) {
              // Clear cell
              row.cells[cellId].value = null;
              row.cells[cellId].displayValue = undefined;
              row.cells[cellId].formula = undefined;
              
              // Update dependent cells
              if (row.cells[cellId].dependents) {
                row.cells[cellId].dependents.forEach(depId => {
                  const [depRowId, depColId] = depId.split(':');
                  const depRow = state.rows[depRowId];
                  if (depRow && depRow.cells[depId] && depRow.cells[depId].formula) {
                    const depCell = depRow.cells[depId];
                    try {
                      const { result } = evaluateFormula(
                        depCell.formula!.substring(1),
                        get().getCell
                      );
                      depCell.value = result;
                      depCell.displayValue = String(result);
                    } catch (error) {
                      depCell.value = '#ERROR!';
                      depCell.displayValue = '#ERROR!';
                    }
                  }
                });
              }
            }
          }
        }
      });
    },

    // Find and replace
    findAndReplace: (find: string, replace: string, matchCase: boolean = false) => {
      set(state => {
        // Save current state for undo
        get().saveState();

        let selection = state.selection;
        let searchArea: { minRow: number; maxRow: number; minCol: number; maxCol: number };

        if (selection) {
          const { startRowIndex, startColIndex, endRowIndex, endColIndex } = selection;
          searchArea = {
            minRow: Math.min(startRowIndex, endRowIndex),
            maxRow: Math.max(startRowIndex, endRowIndex),
            minCol: Math.min(startColIndex, endColIndex),
            maxCol: Math.max(startColIndex, endColIndex)
          };
        } else {
          // Search entire sheet if no selection
          const rowIndices = Object.values(state.rows).map(row => row.index);
          const colIndices = Object.values(state.columns).map(col => col.index);
          searchArea = {
            minRow: Math.min(...rowIndices),
            maxRow: Math.max(...rowIndices),
            minCol: Math.min(...colIndices),
            maxCol: Math.max(...colIndices)
          };
        }

        for (let i = searchArea.minRow; i <= searchArea.maxRow; i++) {
          for (let j = searchArea.minCol; j <= searchArea.maxCol; j++) {
            const rowId = Object.keys(state.rows).find(
              id => state.rows[id].index === i
            );
            const colId = Object.keys(state.columns).find(
              id => state.columns[id].index === j
            );

            if (!rowId || !colId) continue;

            const cellId = `${rowId}:${colId}`;
            const row = state.rows[rowId];

            if (row.cells[cellId]) {
              const cell = row.cells[cellId];
              if (cell.value !== null && typeof cell.value === 'string') {
                let cellValue = cell.value;
                let searchValue = find;
                
                if (!matchCase) {
                  cellValue = cellValue.toLowerCase();
                  searchValue = searchValue.toLowerCase();
                }

                if (cellValue.includes(searchValue)) {
                  // Replace in the original case
                  let newValue = '';
                  if (matchCase) {
                    newValue = (cell.value as string).replace(new RegExp(find, 'g'), replace);
                  } else {
                    newValue = (cell.value as string).replace(
                      new RegExp(find, 'gi'),
                      replace
                    );
                  }
                  
                  cell.value = newValue;
                  cell.displayValue = newValue;
                  
                  // Update dependent cells
                  if (cell.dependents) {
                    cell.dependents.forEach(depId => {
                      const [depRowId, depColId] = depId.split(':');
                      const depRow = state.rows[depRowId];
                      if (depRow && depRow.cells[depId] && depRow.cells[depId].formula) {
                        const depCell = depRow.cells[depId];
                        try {
                          const { result } = evaluateFormula(
                            depCell.formula!.substring(1),
                            get().getCell
                          );
                          depCell.value = result;
                          depCell.displayValue = String(result);
                        } catch (error) {
                          depCell.value = '#ERROR!';
                          depCell.displayValue = '#ERROR!';
                        }
                      }
                    });
                  }
                }
              }
            }
          }
        }
      });
    },

    // Remove duplicates
    removeDuplicates: () => {
      set(state => {
        if (!state.selection) return;

        // Save current state for undo
        get().saveState();

        const { startRowIndex, startColIndex, endRowIndex, endColIndex } = state.selection;
        
        const minRow = Math.min(startRowIndex, endRowIndex);
        const maxRow = Math.max(startRowIndex, endRowIndex);
        const minCol = Math.min(startColIndex, endColIndex);
        const maxCol = Math.max(startColIndex, endColIndex);

        // Get all rows in selection
        const rows: { rowIndex: number; values: string[] }[] = [];
        
        for (let i = minRow; i <= maxRow; i++) {
          const rowValues: string[] = [];
          
          for (let j = minCol; j <= maxCol; j++) {
            const cell = get().getCell(i, j);
            rowValues.push(cell?.value !== null ? String(cell?.value) : '');
          }
          
          rows.push({ rowIndex: i, values: rowValues });
        }

        // Find duplicates
        const uniqueRows = new Set<string>();
        const duplicateRowIndices = new Set<number>();
        
        rows.forEach(row => {
          const rowString = JSON.stringify(row.values);
          if (uniqueRows.has(rowString)) {
            duplicateRowIndices.add(row.rowIndex);
          } else {
            uniqueRows.add(rowString);
          }
        });

        // Clear duplicate rows
        duplicateRowIndices.forEach(rowIndex => {
          const rowId = Object.keys(state.rows).find(
            id => state.rows[id].index === rowIndex
          );
          
          if (!rowId) return;
          
          for (let j = minCol; j <= maxCol; j++) {
            const colId = Object.keys(state.columns).find(
              id => state.columns[id].index === j
            );
            
            if (!colId) continue;
            
            const cellId = `${rowId}:${colId}`;
            const row = state.rows[rowId];
            
            if (row.cells[cellId]) {
              // Clear cell
              row.cells[cellId].value = null;
              row.cells[cellId].displayValue = undefined;
              row.cells[cellId].formula = undefined;
            }
          }
        });
      });
    },

    // Save sheet data
    saveSheet: () => {
      try {
        const state = get();
        const data = {
          rows: state.rows,
          columns: state.columns
        };
        localStorage.setItem('sheetData', JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Failed to save sheet:', error);
        return false;
      }
    },

    // Load sheet data
    loadSheet: () => {
      try {
        const savedData = localStorage.getItem('sheetData');
        if (savedData) {
          const data = JSON.parse(savedData);
          set(state => {
            state.rows = data.rows;
            state.columns = data.columns;
            state.selection = null;
            state.activeCell = null;
            state.editingCell = false;
            state.editValue = '';
          });
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to load sheet:', error);
        return false;
      }
    }
  }))
);
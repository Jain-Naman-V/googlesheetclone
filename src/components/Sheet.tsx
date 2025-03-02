import React, { useState, useRef, useEffect } from 'react';
import { useSheetStore } from '../store/sheetStore';
import Cell from './Cell';
import { indexToColumn, clamp } from '../utils/helpers';

const Sheet: React.FC = () => {
  const rows = useSheetStore(state => state.rows);
  const columns = useSheetStore(state => state.columns);
  const activeCell = useSheetStore(state => state.activeCell);
  const selection = useSheetStore(state => state.selection);
  const editingCell = useSheetStore(state => state.editingCell);
  const editValue = useSheetStore(state => state.editValue);
  const getCell = useSheetStore(state => state.getCell);
  const setActiveCell = useSheetStore(state => state.setActiveCell);
  const startEditingCell = useSheetStore(state => state.startEditingCell);
  const setCellValue = useSheetStore(state => state.setCellValue);
  const setSelection = useSheetStore(state => state.setSelection);
  const updateSelection = useSheetStore(state => state.updateSelection);
  const pasteFromClipboard = useSheetStore(state => state.pasteFromClipboard);
  
  const [resizingRow, setResizingRow] = useState<number | null>(null);
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [startResizePos, setStartResizePos] = useState<number>(0);
  const [startSize, setStartSize] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Handle cell click
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setActiveCell(rowIndex, colIndex);
  };
  
  // Handle cell double click
  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    setActiveCell(rowIndex, colIndex);
    startEditingCell();
  };
  
  // Handle cell change
  const handleCellChange = (value: string) => {
    useSheetStore.setState({ editValue: value });
  };
  
  // Handle cell key down
  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!activeCell) return;
    
    const { rowIndex, colIndex } = activeCell;
    
    if (e.key === 'Enter') {
      const value = editValue;
      const isFormula = value.startsWith('=');
      setCellValue(rowIndex, colIndex, value, isFormula);
      
      // Move to the cell below
      setActiveCell(rowIndex + 1, colIndex);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      const value = editValue;
      const isFormula = value.startsWith('=');
      setCellValue(rowIndex, colIndex, value, isFormula);
      
      // Move to the next cell
      setActiveCell(rowIndex, colIndex + 1);
    } else if (e.key === 'Escape') {
      // Cancel editing
      useSheetStore.setState({ editingCell: false });
    }
  };
  
  // Handle mouse down on row resize handle
  const handleRowResizeMouseDown = (e: React.MouseEvent, rowIndex: number, height: number) => {
    e.preventDefault();
    setResizingRow(rowIndex);
    setStartResizePos(e.clientY);
    setStartSize(height);
    document.body.style.cursor = 'row-resize';
  };
  
  // Handle mouse down on column resize handle
  const handleColResizeMouseDown = (e: React.MouseEvent, colIndex: number, width: number) => {
    e.preventDefault();
    setResizingCol(colIndex);
    setStartResizePos(e.clientX);
    setStartSize(width);
    document.body.style.cursor = 'col-resize';
  };
  
  // Handle mouse move for resizing
  const handleMouseMove = (e: MouseEvent) => {
    if (resizingRow !== null) {
      const diff = e.clientY - startResizePos;
      const newHeight = Math.max(20, startSize + diff);
      
      const rowId = Object.keys(rows).find(
        id => rows[id].index === resizingRow
      );
      
      if (rowId) {
        useSheetStore.setState(state => {
          state.rows[rowId].height = newHeight;
        });
      }
    } else if (resizingCol !== null) {
      const diff = e.clientX - startResizePos;
      const newWidth = Math.max(40, startSize + diff);
      
      const colId = Object.keys(columns).find(
        id => columns[id].index === resizingCol
      );
      
      if (colId) {
        useSheetStore.setState(state => {
          state.columns[colId].width = newWidth;
        });
      }
    } else if (isDragging && selection) {
      if (!sheetRef.current) return;
      
      const rect = sheetRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Find the cell under the cursor
      let targetRowIndex = -1;
      let targetColIndex = -1;
      let currentTop = 0;
      let currentLeft = 0;
      
      // Find row
      for (const rowId in rows) {
        const row = rows[rowId];
        currentTop += row.height;
        if (y <= currentTop) {
          targetRowIndex = row.index;
          break;
        }
      }
      
      // Find column
      for (const colId in columns) {
        const col = columns[colId];
        currentLeft += col.width;
        if (x <= currentLeft) {
          targetColIndex = col.index;
          break;
        }
      }
      
      if (targetRowIndex >= 0 && targetColIndex >= 0) {
        updateSelection(targetRowIndex, targetColIndex);
      }
    }
  };
  
  // Handle mouse up for resizing
  const handleMouseUp = () => {
    setResizingRow(null);
    setResizingCol(null);
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };
  
  // Handle mouse down on sheet
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sheetRef.current) return;
    
    const rect = sheetRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find the cell under the cursor
    let targetRowIndex = -1;
    let targetColIndex = -1;
    let currentTop = 0;
    let currentLeft = 0;
    
    // Find row
    for (const rowId in rows) {
      const row = rows[rowId];
      currentTop += row.height;
      if (y <= currentTop) {
        targetRowIndex = row.index;
        break;
      }
    }
    
    // Find column
    for (const colId in columns) {
      const col = columns[colId];
      currentLeft += col.width;
      if (x <= currentLeft) {
        targetColIndex = col.index;
        break;
      }
    }
    
    if (targetRowIndex >= 0 && targetColIndex >= 0) {
      if (e.shiftKey && activeCell) {
        // Extend selection
        setSelection({
          startRowIndex: activeCell.rowIndex,
          startColIndex: activeCell.colIndex,
          endRowIndex: targetRowIndex,
          endColIndex: targetColIndex
        });
      } else {
        // Start new selection
        setActiveCell(targetRowIndex, targetColIndex);
        setIsDragging(true);
      }
    }
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!activeCell) return;
    
    const { rowIndex, colIndex } = activeCell;
    
    // Handle arrow keys
    if (e.key === 'ArrowUp' && !editingCell) {
      e.preventDefault();
      setActiveCell(Math.max(0, rowIndex - 1), colIndex);
    } else if (e.key === 'ArrowDown' && !editingCell) {
      e.preventDefault();
      setActiveCell(rowIndex + 1, colIndex);
    } else if (e.key === 'ArrowLeft' && !editingCell) {
      e.preventDefault();
      setActiveCell(rowIndex, Math.max(0, colIndex - 1));
    } else if (e.key === 'ArrowRight' && !editingCell) {
      e.preventDefault();
      setActiveCell(rowIndex, colIndex + 1);
    } else if (e.key === 'Tab' && !editingCell) {
      e.preventDefault();
      setActiveCell(rowIndex, colIndex + 1);
    } else if (e.key === 'Enter' && !editingCell) {
      e.preventDefault();
      startEditingCell();
    } else if (e.key === 'F2' && !editingCell) {
      e.preventDefault();
      startEditingCell();
    } else if (e.ctrlKey && e.key === 'v' && !editingCell) {
      e.preventDefault();
      pasteFromClipboard(rowIndex, colIndex);
    } else if (!editingCell && /^[a-zA-Z0-9=+\-*\/().,;:'"!@#$%^&*]$/.test(e.key)) {
      // Start editing with the pressed key
      startEditingCell();
      useSheetStore.setState({ editValue: e.key === '=' ? '=' : '' });
    }
  };
  
  // Add event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [resizingRow, resizingCol, startResizePos, startSize, isDragging, activeCell, editingCell, selection]);
  
  // Render the sheet
  const sortedRows = Object.values(rows).sort((a, b) => a.index - b.index);
  const sortedCols = Object.values(columns).sort((a, b) => a.index - b.index);
  
  return (
    <div className="sheet-container flex-grow overflow-auto">
      <div className="sheet relative" ref={sheetRef} onMouseDown={handleMouseDown}>
        {/* Column headers */}
        <div className="column-headers flex sticky top-0 z-10">
          <div className="corner-cell bg-gray-200 border-r border-b border-gray-300" style={{ width: '40px', height: '25px' }}></div>
          {sortedCols.map(col => (
            <div 
              key={col.id} 
              className="column-header bg-gray-200 border-r border-b border-gray-300 flex items-center justify-center relative"
              style={{ width: `${col.width}px`, height: '25px' }}
            >
              {indexToColumn(col.index)}
              <div 
                className="resize-handle absolute right-0 top-0 w-2 h-full cursor-col-resize"
                onMouseDown={(e) => handleColResizeMouseDown(e, col.index, col.width)}
              ></div>
            </div>
          ))}
        </div>
        
        {/* Rows */}
        <div className="rows">
          {sortedRows.map(row => (
            <div key={row.id} className="row flex relative">
              {/* Row header */}
              <div 
                className="row-header bg-gray-200 border-r border-b border-gray-300 flex items-center justify-center sticky left-0 z-10 relative"
                style={{ width: '40px', height: `${row.height}px` }}
              >
                {row.index + 1}
                <div 
                  className="resize-handle absolute bottom-0 left-0 w-full h-2 cursor-row-resize"
                  onMouseDown={(e) => handleRowResizeMouseDown(e, row.index, row.height)}
                ></div>
              </div>
              
              {/* Cells */}
              {sortedCols.map(col => {
                const cell = getCell(row.index, col.index);
                const isActive = activeCell?.rowIndex === row.index && activeCell?.colIndex === col.index;
                const isEditing = isActive && editingCell;
                
                let isSelected = false;
                if (selection) {
                  const { startRowIndex, startColIndex, endRowIndex, endColIndex } = selection;
                  const minRow = Math.min(startRowIndex, endRowIndex);
                  const maxRow = Math.max(startRowIndex, endRowIndex);
                  const minCol = Math.min(startColIndex, endColIndex);
                  const maxCol = Math.max(startColIndex, endColIndex);
                  
                  isSelected = row.index >= minRow && row.index <= maxRow && col.index >= minCol && col.index <= maxCol;
                }
                
                return (
                  <Cell
                    key={`${row.id}-${col.id}`}
                    rowIndex={row.index}
                    colIndex={col.index}
                    width={col.width}
                    height={row.height}
                    cell={cell}
                    isActive={isActive}
                    isSelected={isSelected}
                    isEditing={isEditing}
                    editValue={isEditing ? editValue : ''}
                    onCellClick={handleCellClick}
                    onCellDoubleClick={handleCellDoubleClick}
                    onCellChange={handleCellChange}
                    onCellKeyDown={handleCellKeyDown}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sheet;
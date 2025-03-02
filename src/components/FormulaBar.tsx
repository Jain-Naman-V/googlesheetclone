import React, { useEffect, useRef } from 'react';
import { useSheetStore } from '../store/sheetStore';
import { indexToColumn } from '../utils/helpers';

const FormulaBar: React.FC = () => {
  const activeCell = useSheetStore(state => state.activeCell);
  const editValue = useSheetStore(state => state.editValue);
  const editingCell = useSheetStore(state => state.editingCell);
  const setCellValue = useSheetStore(state => state.setCellValue);
  const startEditingCell = useSheetStore(state => state.startEditingCell);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeCell) {
      useSheetStore.setState({ editValue: e.target.value });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && activeCell) {
      const { rowIndex, colIndex } = activeCell;
      const value = editValue;
      const isFormula = value.startsWith('=');
      setCellValue(rowIndex, colIndex, value, isFormula);
    }
  };
  
  const handleFocus = () => {
    if (activeCell && !editingCell) {
      startEditingCell();
    }
  };
  
  return (
    <div className="formula-bar flex items-center bg-white border-b border-gray-300 p-1">
      <div className="cell-address w-16 text-center text-sm text-gray-600 border-r border-gray-300 mr-2">
        {activeCell ? `${indexToColumn(activeCell.colIndex)}${activeCell.rowIndex + 1}` : ''}
      </div>
      <div className="flex-grow">
        <input
          ref={inputRef}
          type="text"
          className="cell-editor w-full p-1 border border-gray-300 focus:outline-none focus:border-blue-500"
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={!activeCell}
        />
      </div>
    </div>
  );
};

export default FormulaBar;
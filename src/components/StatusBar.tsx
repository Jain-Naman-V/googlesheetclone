import React from 'react';
import { useSheetStore } from '../store/sheetStore';
import { indexToColumn } from '../utils/helpers';

const StatusBar: React.FC = () => {
  const activeCell = useSheetStore(state => state.activeCell);
  const selection = useSheetStore(state => state.selection);
  
  let statusText = '';
  
  if (selection && (
    selection.startRowIndex !== selection.endRowIndex || 
    selection.startColIndex !== selection.endColIndex
  )) {
    const rowCount = Math.abs(selection.endRowIndex - selection.startRowIndex) + 1;
    const colCount = Math.abs(selection.endColIndex - selection.startColIndex) + 1;
    statusText = `${rowCount} × ${colCount} cells selected`;
  } else if (activeCell) {
    statusText = `${indexToColumn(activeCell.colIndex)}${activeCell.rowIndex + 1}`;
  }
  
  return (
    <div className="status-bar bg-gray-100 border-t border-gray-300 p-1 text-sm text-gray-600 flex justify-between">
      <div>{statusText}</div>
      <div>Google Sheets Clone</div>
    </div>
  );
};

export default StatusBar;
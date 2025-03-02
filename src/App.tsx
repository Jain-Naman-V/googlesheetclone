import React, { useState } from 'react';
import Toolbar from './components/Toolbar';
import FormulaBar from './components/FormulaBar';
import Sheet from './components/Sheet';
import StatusBar from './components/StatusBar';
import { useSheetStore } from './store/sheetStore';

function App() {
  const activeCell = useSheetStore(state => state.activeCell);
  const addRow = useSheetStore(state => state.addRow);
  const deleteRow = useSheetStore(state => state.deleteRow);
  const addColumn = useSheetStore(state => state.addColumn);
  const deleteColumn = useSheetStore(state => state.deleteColumn);
  
  const handleAddRow = () => {
    if (activeCell) {
      addRow(activeCell.rowIndex);
    }
  };
  
  const handleDeleteRow = () => {
    if (activeCell) {
      deleteRow(activeCell.rowIndex);
    }
  };
  
  const handleAddColumn = () => {
    if (activeCell) {
      addColumn(activeCell.colIndex);
    }
  };
  
  const handleDeleteColumn = () => {
    if (activeCell) {
      deleteColumn(activeCell.colIndex);
    }
  };
  
  return (
    <div className="app h-screen flex flex-col">
      <Toolbar 
        onAddRow={handleAddRow}
        onDeleteRow={handleDeleteRow}
        onAddColumn={handleAddColumn}
        onDeleteColumn={handleDeleteColumn}
      />
      <FormulaBar />
      <Sheet />
      <StatusBar />
    </div>
  );
}

export default App;
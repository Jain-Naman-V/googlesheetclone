import React, { useState } from 'react';
import classNames from 'classnames';
import { 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Save,
  Upload,
  Undo,
  Redo,
  Copy,
  Scissors,
  Trash2,
  Search,
  FileSpreadsheet,
  Plus,
  Minus,
  ChevronDown
} from 'lucide-react';
import { useSheetStore } from '../store/sheetStore';
import { getAllFunctions } from '../utils/functions';

interface ToolbarProps {
  onAddRow: () => void;
  onDeleteRow: () => void;
  onAddColumn: () => void;
  onDeleteColumn: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddRow, 
  onDeleteRow, 
  onAddColumn, 
  onDeleteColumn 
}) => {
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [showFunctionMenu, setShowFunctionMenu] = useState(false);
  
  const setCellStyle = useSheetStore(state => state.setCellStyle);
  const copySelection = useSheetStore(state => state.copySelection);
  const cutSelection = useSheetStore(state => state.cutSelection);
  const clearSelection = useSheetStore(state => state.clearSelection);
  const findAndReplace = useSheetStore(state => state.findAndReplace);
  const removeDuplicates = useSheetStore(state => state.removeDuplicates);
  const saveSheet = useSheetStore(state => state.saveSheet);
  const loadSheet = useSheetStore(state => state.loadSheet);
  const undo = useSheetStore(state => state.undo);
  const redo = useSheetStore(state => state.redo);
  
  const handleBold = () => {
    setCellStyle({ bold: true });
  };
  
  const handleItalic = () => {
    setCellStyle({ italic: true });
  };
  
  const handleAlignLeft = () => {
    setCellStyle({ textAlign: 'left' });
  };
  
  const handleAlignCenter = () => {
    setCellStyle({ textAlign: 'center' });
  };
  
  const handleAlignRight = () => {
    setCellStyle({ textAlign: 'right' });
  };
  
  const handleFindReplace = () => {
    findAndReplace(findText, replaceText, matchCase);
    setShowFindReplace(false);
  };
  
  const handleSave = () => {
    const success = saveSheet();
    if (success) {
      alert('Sheet saved successfully!');
    } else {
      alert('Failed to save sheet.');
    }
  };
  
  const handleLoad = () => {
    const success = loadSheet();
    if (success) {
      alert('Sheet loaded successfully!');
    } else {
      alert('No saved sheet found or failed to load.');
    }
  };
  
  const handleInsertFunction = (funcName: string) => {
    const activeCell = document.querySelector('.cell-editor') as HTMLInputElement;
    if (activeCell) {
      const cursorPos = activeCell.selectionStart || 0;
      const textBefore = activeCell.value.substring(0, cursorPos);
      const textAfter = activeCell.value.substring(cursorPos);
      
      activeCell.value = `${textBefore}${funcName}()${textAfter}`;
      
      // Set cursor position inside the parentheses
      const newCursorPos = cursorPos + funcName.length + 1;
      activeCell.setSelectionRange(newCursorPos, newCursorPos);
      activeCell.focus();
    }
    
    setShowFunctionMenu(false);
  };
  
  const allFunctions = getAllFunctions();
  const mathFunctions = allFunctions.filter(f => f.type === 'math');
  const dataQualityFunctions = allFunctions.filter(f => f.type === 'dataQuality');
  
  return (
    <div className="toolbar bg-gray-100 border-b border-gray-300 p-1 flex items-center space-x-2">
      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Undo"
          onClick={undo}
        >
          <Undo size={16} />
        </button>
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Redo"
          onClick={redo}
        >
          <Redo size={16} />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Bold"
          onClick={handleBold}
        >
          <Bold size={16} />
        </button>
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Italic"
          onClick={handleItalic}
        >
          <Italic size={16} />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Align Left"
          onClick={handleAlignLeft}
        >
          <AlignLeft size={16} />
        </button>
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Align Center"
          onClick={handleAlignCenter}
        >
          <AlignCenter size={16} />
        </button>
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Align Right"
          onClick={handleAlignRight}
        >
          <AlignRight size={16} />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Copy"
          onClick={copySelection}
        >
          <Copy size={16} />
        </button>
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Cut"
          onClick={cutSelection}
        >
          <Scissors size={16} />
        </button>
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Clear"
          onClick={clearSelection}
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Find and Replace"
          onClick={() => setShowFindReplace(!showFindReplace)}
        >
          <Search size={16} />
        </button>
        
        {showFindReplace && (
          <div className="absolute top-10 left-0 bg-white border border-gray-300 shadow-lg p-3 z-10 w-80">
            <div className="mb-2">
              <label className="block text-sm mb-1">Find:</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 p-1 text-sm"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm mb-1">Replace with:</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 p-1 text-sm"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
              />
            </div>
            <div className="mb-2 flex items-center">
              <input 
                type="checkbox" 
                id="matchCase" 
                className="mr-1"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
              />
              <label htmlFor="matchCase" className="text-sm">Match case</label>
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                className="bg-gray-200 text-sm px-2 py-1 rounded"
                onClick={() => setShowFindReplace(false)}
              >
                Cancel
              </button>
              <button 
                className="bg-blue-500 text-white text-sm px-2 py-1 rounded"
                onClick={handleFindReplace}
              >
                Replace All
              </button>
            </div>
          </div>
        )}
        
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Remove Duplicates"
          onClick={removeDuplicates}
        >
          <FileSpreadsheet size={16} />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Add Row"
          onClick={onAddRow}
        >
          <Plus size={16} />
        </button>
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Delete Row"
          onClick={onDeleteRow}
        >
          <Minus size={16} />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Add Column"
          onClick={onAddColumn}
        >
          <Plus size={16} className="rotate-90" />
        </button>
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Delete Column"
          onClick={onDeleteColumn}
        >
          <Minus size={16} className="rotate-90" />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 relative">
        <button 
          className="p-1 rounded hover:bg-gray-200 flex items-center" 
          title="Insert Function"
          onClick={() => setShowFunctionMenu(!showFunctionMenu)}
        >
          <span className="text-sm mr-1">fx</span>
          <ChevronDown size={14} />
        </button>
        
        {showFunctionMenu && (
          <div className="absolute top-8 left-0 bg-white border border-gray-300 shadow-lg p-2 z-10 w-64">
            <div className="mb-2">
              <h3 className="font-bold text-sm border-b pb-1 mb-1">Math Functions</h3>
              <div className="grid grid-cols-2 gap-1">
                {mathFunctions.map(func => (
                  <button 
                    key={func.name}
                    className="text-left text-sm p-1 hover:bg-gray-100 rounded"
                    title={func.description}
                    onClick={() => handleInsertFunction(func.name)}
                  >
                    {func.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm border-b pb-1 mb-1">Data Quality Functions</h3>
              <div className="grid grid-cols-2 gap-1">
                {dataQualityFunctions.map(func => (
                  <button 
                    key={func.name}
                    className="text-left text-sm p-1 hover:bg-gray-100 rounded"
                    title={func.description}
                    onClick={() => handleInsertFunction(func.name)}
                  >
                    {func.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-1">
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Save"
          onClick={handleSave}
        >
          <Save size={16} />
        </button>
        <button 
          className="p-1 rounded hover:bg-gray-200" 
          title="Load"
          onClick={handleLoad}
        >
          <Upload size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
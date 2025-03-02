import React, { useState } from 'react';
import { useSheetStore } from '../store/sheetStore';

interface FindReplaceDialogProps {
  onClose: () => void;
}

const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({ onClose }) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  
  const findAndReplace = useSheetStore(state => state.findAndReplace);
  
  const handleFindReplace = () => {
    findAndReplace(findText, replaceText, matchCase);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-96">
        <h2 className="text-lg font-bold mb-4">Find and Replace</h2>
        
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Find:</label>
          <input 
            type="text" 
            className="w-full border border-gray-300 rounded p-2"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Replace with:</label>
          <input 
            type="text" 
            className="w-full border border-gray-300 rounded p-2"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              className="mr-2"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
            />
            <span className="text-sm">Match case</span>
          </label>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button 
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleFindReplace}
          >
            Replace All
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindReplaceDialog;
import React from 'react';
import { getAllFunctions } from '../utils/functions';

interface FunctionHelpProps {
  onClose: () => void;
  onSelectFunction: (funcName: string) => void;
}

const FunctionHelp: React.FC<FunctionHelpProps> = ({ onClose, onSelectFunction }) => {
  const allFunctions = getAllFunctions();
  const mathFunctions = allFunctions.filter(f => f.type === 'math');
  const dataQualityFunctions = allFunctions.filter(f => f.type === 'dataQuality');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items
  )
}
import { CellValue, Cell } from '../types';
import { parseCellReference, isNumeric, toNumber } from './helpers';
import { mathFunctions, dataQualityFunctions } from './functions';

type GetCellFn = (row: number, col: number) => Cell | null;

interface EvaluationResult {
  result: CellValue;
  dependencies: string[];
}

// Evaluate a formula and return the result and dependencies
export const evaluateFormula = (formula: string, getCell: GetCellFn): EvaluationResult => {
  const dependencies: string[] = [];
  
  // Tokenize the formula
  const tokens = tokenize(formula);
  
  // Parse and evaluate the tokens
  const result = parseExpression(tokens, 0, getCell, dependencies);
  
  return { result: result.value, dependencies };
};

interface Token {
  type: 'number' | 'string' | 'cell' | 'range' | 'function' | 'operator' | 'parenthesis' | 'comma';
  value: string;
}

interface ParseResult {
  value: CellValue;
  index: number;
}

// Tokenize a formula into tokens
const tokenize = (formula: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < formula.length) {
    const char = formula[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Numbers
    if (/[0-9]/.test(char)) {
      let num = '';
      while (i < formula.length && (/[0-9.]/.test(formula[i]))) {
        num += formula[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }
    
    // Strings (in quotes)
    if (char === '"' || char === "'") {
      const quote = char;
      let str = '';
      i++; // Skip opening quote
      while (i < formula.length && formula[i] !== quote) {
        str += formula[i];
        i++;
      }
      i++; // Skip closing quote
      tokens.push({ type: 'string', value: str });
      continue;
    }
    
    // Cell references and ranges (e.g., A1, A1:B2)
    if (/[A-Z]/.test(char)) {
      let ref = '';
      while (i < formula.length && /[A-Z0-9:]/.test(formula[i])) {
        ref += formula[i];
        i++;
      }
      
      if (ref.includes(':')) {
        tokens.push({ type: 'range', value: ref });
      } else {
        tokens.push({ type: 'cell', value: ref });
      }
      continue;
    }
    
    // Functions
    if (/[a-z_]/i.test(char)) {
      let func = '';
      while (i < formula.length && /[a-z0-9_]/i.test(formula[i])) {
        func += formula[i];
        i++;
      }
      tokens.push({ type: 'function', value: func.toUpperCase() });
      continue;
    }
    
    // Operators
    if (['+', '-', '*', '/', '=', '>', '<', '&'].includes(char)) {
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }
    
    // Parentheses
    if (['(', ')'].includes(char)) {
      tokens.push({ type: 'parenthesis', value: char });
      i++;
      continue;
    }
    
    // Comma
    if (char === ',') {
      tokens.push({ type: 'comma', value: ',' });
      i++;
      continue;
    }
    
    // Unknown character, skip
    i++;
  }
  
  return tokens;
};

// Parse and evaluate an expression
const parseExpression = (
  tokens: Token[],
  startIndex: number,
  getCell: GetCellFn,
  dependencies: string[]
): ParseResult => {
  if (startIndex >= tokens.length) {
    return { value: null, index: startIndex };
  }
  
  const token = tokens[startIndex];
  
  // Handle numbers
  if (token.type === 'number') {
    return { value: parseFloat(token.value), index: startIndex + 1 };
  }
  
  // Handle strings
  if (token.type === 'string') {
    return { value: token.value, index: startIndex + 1 };
  }
  
  // Handle cell references
  if (token.type === 'cell') {
    const cellRef = parseCellReference(token.value);
    if (cellRef) {
      const { row, col } = cellRef;
      const cell = getCell(row, col);
      
      // Add to dependencies
      const cellId = cell?.id || `${row}:${col}`;
      if (!dependencies.includes(cellId)) {
        dependencies.push(cellId);
      }
      
      return { value: cell?.value || null, index: startIndex + 1 };
    }
    return { value: '#REF!', index: startIndex + 1 };
  }
  
  // Handle ranges
  if (token.type === 'range') {
    const [startRef, endRef] = token.value.split(':');
    const start = parseCellReference(startRef);
    const end = parseCellReference(endRef);
    
    if (!start || !end) {
      return { value: '#REF!', index: startIndex + 1 };
    }
    
    const values: CellValue[] = [];
    
    for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
      for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
        const cell = getCell(r, c);
        
        // Add to dependencies
        const cellId = cell?.id || `${r}:${c}`;
        if (!dependencies.includes(cellId)) {
          dependencies.push(cellId);
        }
        
        values.push(cell?.value || null);
      }
    }
    
    return { value: values, index: startIndex + 1 };
  }
  
  // Handle functions
  if (token.type === 'function') {
    const funcName = token.value;
    
    // Check if next token is opening parenthesis
    if (startIndex + 1 >= tokens.length || tokens[startIndex + 1].value !== '(') {
      return { value: '#ERROR!', index: startIndex + 1 };
    }
    
    // Parse arguments
    const args: CellValue[] = [];
    let currentIndex = startIndex + 2; // Skip function name and opening parenthesis
    
    while (currentIndex < tokens.length && tokens[currentIndex].value !== ')') {
      // Parse argument
      const argResult = parseExpression(tokens, currentIndex, getCell, dependencies);
      currentIndex = argResult.index;
      
      // Handle array values (from ranges)
      if (Array.isArray(argResult.value)) {
        args.push(...argResult.value);
      } else {
        args.push(argResult.value);
      }
      
      // Skip comma if present
      if (currentIndex < tokens.length && tokens[currentIndex].value === ',') {
        currentIndex++;
      }
    }
    
    // Skip closing parenthesis
    if (currentIndex < tokens.length && tokens[currentIndex].value === ')') {
      currentIndex++;
    }
    
    // Execute function
    let result: CellValue = '#NAME?';
    
    // Check math functions
    if (funcName in mathFunctions) {
      result = mathFunctions[funcName](args);
    }
    // Check data quality functions
    else if (funcName in dataQualityFunctions) {
      result = dataQualityFunctions[funcName](args);
    }
    
    return { value: result, index: currentIndex };
  }
  
  // Handle operators and more complex expressions
  if (token.type === 'operator') {
    // For simplicity, we'll just return an error for operators
    // In a real implementation, you'd handle operator precedence and evaluation
    return { value: '#ERROR!', index: startIndex + 1 };
  }
  
  // Default case
  return { value: null, index: startIndex + 1 };
};
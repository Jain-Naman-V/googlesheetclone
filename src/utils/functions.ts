import { CellValue } from '../types';
import { isNumeric, toNumber } from './helpers';

// Mathematical functions
export const mathFunctions: Record<string, (args: CellValue[]) => CellValue> = {
  SUM: (args: CellValue[]): CellValue => {
    let sum = 0;
    for (const arg of args) {
      if (isNumeric(arg)) {
        sum += toNumber(arg);
      }
    }
    return sum;
  },
  
  AVERAGE: (args: CellValue[]): CellValue => {
    let sum = 0;
    let count = 0;
    
    for (const arg of args) {
      if (isNumeric(arg)) {
        sum += toNumber(arg);
        count++;
      }
    }
    
    return count > 0 ? sum / count : '#DIV/0!';
  },
  
  MAX: (args: CellValue[]): CellValue => {
    const numbers = args.filter(isNumeric).map(toNumber);
    return numbers.length > 0 ? Math.max(...numbers) : 0;
  },
  
  MIN: (args: CellValue[]): CellValue => {
    const numbers = args.filter(isNumeric).map(toNumber);
    return numbers.length > 0 ? Math.min(...numbers) : 0;
  },
  
  COUNT: (args: CellValue[]): CellValue => {
    return args.filter(isNumeric).length;
  },
  
  // Additional math functions
  PRODUCT: (args: CellValue[]): CellValue => {
    let product = 1;
    for (const arg of args) {
      if (isNumeric(arg)) {
        product *= toNumber(arg);
      }
    }
    return product;
  },
  
  POWER: (args: CellValue[]): CellValue => {
    if (args.length < 2) return '#ERROR!';
    const base = toNumber(args[0]);
    const exponent = toNumber(args[1]);
    return Math.pow(base, exponent);
  },
  
  SQRT: (args: CellValue[]): CellValue => {
    if (args.length < 1) return '#ERROR!';
    const value = toNumber(args[0]);
    return value < 0 ? '#NUM!' : Math.sqrt(value);
  },
  
  ROUND: (args: CellValue[]): CellValue => {
    if (args.length < 2) return '#ERROR!';
    const value = toNumber(args[0]);
    const decimals = Math.floor(toNumber(args[1]));
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },
  
  ABS: (args: CellValue[]): CellValue => {
    if (args.length < 1) return '#ERROR!';
    return Math.abs(toNumber(args[0]));
  }
};

// Data quality functions
export const dataQualityFunctions: Record<string, (args: CellValue[]) => CellValue> = {
  TRIM: (args: CellValue[]): CellValue => {
    if (args.length < 1) return '#ERROR!';
    const value = args[0];
    return typeof value === 'string' ? value.trim() : value;
  },
  
  UPPER: (args: CellValue[]): CellValue => {
    if (args.length < 1) return '#ERROR!';
    const value = args[0];
    return typeof value === 'string' ? value.toUpperCase() : value;
  },
  
  LOWER: (args: CellValue[]): CellValue => {
    if (args.length < 1) return '#ERROR!';
    const value = args[0];
    return typeof value === 'string' ? value.toLowerCase() : value;
  },
  
  // Additional data quality functions
  PROPER: (args: CellValue[]): CellValue => {
    if (args.length < 1) return '#ERROR!';
    const value = args[0];
    if (typeof value !== 'string') return value;
    
    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },
  
  CONCATENATE: (args: CellValue[]): CellValue => {
    return args.map(arg => arg === null ? '' : String(arg)).join('');
  },
  
  LEN: (args: CellValue[]): CellValue => {
    if (args.length < 1) return '#ERROR!';
    const value = args[0];
    return typeof value === 'string' ? value.length : String(value || '').length;
  },
  
  LEFT: (args: CellValue[]): CellValue => {
    if (args.length < 2) return '#ERROR!';
    const value = String(args[0] || '');
    const count = toNumber(args[1]);
    return value.substring(0, count);
  },
  
  RIGHT: (args: CellValue[]): CellValue => {
    if (args.length < 2) return '#ERROR!';
    const value = String(args[0] || '');
    const count = toNumber(args[1]);
    return value.substring(value.length - count);
  },
  
  MID: (args: CellValue[]): CellValue => {
    if (args.length < 3) return '#ERROR!';
    const value = String(args[0] || '');
    const start = toNumber(args[1]);
    const count = toNumber(args[2]);
    return value.substring(start - 1, start - 1 + count);
  }
};

// Get all available functions
export const getAllFunctions = (): { name: string; type: 'math' | 'dataQuality'; description: string }[] => {
  const functions: { name: string; type: 'math' | 'dataQuality'; description: string }[] = [
    // Math functions
    { name: 'SUM', type: 'math', description: 'Calculates the sum of a range of cells' },
    { name: 'AVERAGE', type: 'math', description: 'Calculates the average of a range of cells' },
    { name: 'MAX', type: 'math', description: 'Returns the maximum value from a range of cells' },
    { name: 'MIN', type: 'math', description: 'Returns the minimum value from a range of cells' },
    { name: 'COUNT', type: 'math', description: 'Counts the number of cells containing numerical values in a range' },
    { name: 'PRODUCT', type: 'math', description: 'Multiplies all the numbers in a range of cells' },
    { name: 'POWER', type: 'math', description: 'Returns the result of a number raised to a power' },
    { name: 'SQRT', type: 'math', description: 'Returns the square root of a number' },
    { name: 'ROUND', type: 'math', description: 'Rounds a number to a specified number of digits' },
    { name: 'ABS', type: 'math', description: 'Returns the absolute value of a number' },
    
    // Data quality functions
    { name: 'TRIM', type: 'dataQuality', description: 'Removes leading and trailing whitespace from a cell' },
    { name: 'UPPER', type: 'dataQuality', description: 'Converts the text in a cell to uppercase' },
    { name: 'LOWER', type: 'dataQuality', description: 'Converts the text in a cell to lowercase' },
    { name: 'PROPER', type: 'dataQuality', description: 'Capitalizes the first letter of each word in a text string' },
    { name: 'CONCATENATE', type: 'dataQuality', description: 'Joins several text strings into one text string' },
    { name: 'LEN', type: 'dataQuality', description: 'Returns the number of characters in a text string' },
    { name: 'LEFT', type: 'dataQuality', description: 'Returns the specified number of characters from the start of a text string' },
    { name: 'RIGHT', type: 'dataQuality', description: 'Returns the specified number of characters from the end of a text string' },
    { name: 'MID', type: 'dataQuality', description: 'Returns a specific number of characters from a text string, starting at the position you specify' }
  ];
  
  return functions;
};
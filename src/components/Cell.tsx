import React, { useRef, useEffect } from 'react';
import classNames from 'classnames';
import { Cell as CellType, CellStyle } from '../types';

interface CellProps {
  rowIndex: number;
  colIndex: number;
  width: number;
  height: number;
  cell: CellType | null;
  isActive: boolean;
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  onCellClick: (rowIndex: number, colIndex: number) => void;
  onCellDoubleClick: (rowIndex: number, colIndex: number) => void;
  onCellChange: (value: string) => void;
  onCellKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const Cell: React.FC<CellProps> = ({
  rowIndex,
  colIndex,
  width,
  height,
  cell,
  isActive,
  isSelected,
  isEditing,
  editValue,
  onCellClick,
  onCellDoubleClick,
  onCellChange,
  onCellKeyDown
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);
  
  const handleClick = () => {
    onCellClick(rowIndex, colIndex);
  };
  
  const handleDoubleClick = () => {
    onCellDoubleClick(rowIndex, colIndex);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCellChange(e.target.value);
  };
  
  const getCellStyle = (style: CellStyle = {}) => {
    return {
      width: `${width}px`,
      height: `${height}px`,
      fontWeight: style.bold ? 'bold' : 'normal',
      fontStyle: style.italic ? 'italic' : 'normal',
      fontSize: style.fontSize ? `${style.fontSize}px` : '14px',
      color: style.color || 'black',
      backgroundColor: style.backgroundColor || 'white',
      textAlign: style.textAlign || 'left'
    };
  };
  
  return (
    <div
      className={classNames(
        'cell relative border-r border-b border-gray-300 overflow-hidden',
        {
          'bg-blue-100': isSelected && !isActive,
          'bg-blue-200': isActive,
          'border-blue-500 border-2': isActive
        }
      )}
      style={getCellStyle(cell?.style)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="absolute inset-0 w-full h-full p-1 border-none outline-none"
          value={editValue}
          onChange={handleChange}
          onKeyDown={onCellKeyDown}
        />
      ) : (
        <div className="cell-content p-1 w-full h-full overflow-hidden text-ellipsis whitespace-nowrap">
          {cell?.displayValue !== undefined ? cell.displayValue : cell?.value !== null ? String(cell.value) : ''}
        </div>
      )}
    </div>
  );
};

export default React.memo(Cell);
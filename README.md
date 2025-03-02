# Google Sheets Clone

A web application that closely mimics the user interface and core functionalities of Google Sheets, with a focus on mathematical and data quality functions, data entry, and key UI interactions.

## Data Structures and Tech Stack

### Tech Stack

- **React**: For building the user interface components
- **TypeScript**: For type safety and better developer experience
- **Zustand**: For state management with a simple, yet powerful API
- **Immer**: For immutable state updates with a mutable API
- **Tailwind CSS**: For styling components
- **Lucide React**: For icons
- **Vite**: For fast development and optimized builds

### Data Structures

The application uses the following key data structures:

1. **Cell**: Represents a single cell in the spreadsheet
   - `id`: Unique identifier for the cell
   - `value`: The actual value stored in the cell (string, number, or null)
   - `displayValue`: The formatted value shown to the user
   - `formula`: The formula entered by the user (if applicable)
   - `style`: Formatting options for the cell
   - `dependencies`: List of cells this cell depends on
   - `dependents`: List of cells that depend on this cell

2. **Row**: Represents a row in the spreadsheet
   - `id`: Unique identifier for the row
   - `index`: The position of the row
   - `height`: The height of the row in pixels
   - `cells`: A map of cell IDs to cell objects

3. **Column**: Represents a column in the spreadsheet
   - `id`: Unique identifier for the column
   - `index`: The position of the column
   - `width`: The width of the column in pixels

4. **Selection**: Represents the current selection in the spreadsheet
   - `startRowIndex`: The starting row index
   - `startColIndex`: The starting column index
   - `endRowIndex`: The ending row index
   - `endColIndex`: The ending column index

### State Management

The application uses Zustand with Immer for state management. This provides:

1. **Immutable Updates**: All state updates are immutable, preventing unintended side effects
2. **Simplified API**: Zustand provides a simple API for accessing and updating state
3. **Performance**: Only components that depend on specific state will re-render

### Formula Evaluation

The formula evaluation system uses a recursive descent parser to:

1. Tokenize the formula into tokens (numbers, strings, cell references, functions, operators)
2. Parse and evaluate the tokens to produce a result
3. Track dependencies between cells to ensure proper updates when values change

## Features

### Spreadsheet Interface
- Google Sheets-like UI with toolbar, formula bar, and cell structure
- Drag functionality for selections
- Cell dependencies with automatic updates
- Cell formatting (bold, italics, text alignment)
- Add, delete, and resize rows and columns

### Mathematical Functions
- SUM: Calculates the sum of a range of cells
- AVERAGE: Calculates the average of a range of cells
- MAX: Returns the maximum value from a range of cells
- MIN: Returns the minimum value from a range of cells
- COUNT: Counts the number of cells containing numerical values in a range
- Additional functions: PRODUCT, POWER, SQRT, ROUND, ABS

### Data Quality Functions
- TRIM: Removes leading and trailing whitespace from a cell
- UPPER: Converts the text in a cell to uppercase
- LOWER: Converts the text in a cell to lowercase
- REMOVE_DUPLICATES: Removes duplicate rows from a selected range
- FIND_AND_REPLACE: Allows users to find and replace specific text within a range of cells
- Additional functions: PROPER, CONCATENATE, LEN, LEFT, RIGHT, MID

### Data Entry and Validation
- Support for various data types (numbers, text)
- Formula entry with cell references
- Copy, cut, and paste functionality

### Additional Features
- Undo/redo functionality
- Save and load spreadsheets (using localStorage)
- Keyboard navigation and shortcuts
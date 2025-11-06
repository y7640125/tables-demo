/**
 * Utility functions for table operations
 */

export interface FieldSchema {
  name: string;
  label: string;
  type: 'text' | 'date' | 'boolean' | 'textarea' | 'enum';
  options?: { value: string; label: string }[];
}

export interface TableData {
  schema: FieldSchema[];
  rows: Array<Record<string, any>>;
}

/**
 * Get strong ID for a value (used for sorting/filtering)
 * Empty/undefined/null values return empty string
 */
export const strongId = (v: any): string => {
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

/**
 * Check if a column is empty (all values are empty)
 */
export const isEmptyColumn = (name: string, rows: Array<Record<string, any>>): boolean => {
  return rows.every(r => strongId(r[name]) === '');
};

/**
 * Get unique values for a column (for filtering)
 */
export const getUniqueValues = (name: string, rows: Array<Record<string, any>>): string[] => {
  const values = new Set<string>();
  rows.forEach(row => {
    const id = strongId(row[name]);
    if (id) values.add(id);
  });
  return Array.from(values).sort();
};

/**
 * Copy selected cells as TSV
 */
export const copyAsTSV = (cells: string[][]): void => {
  const tsv = cells.map(row => row.join('\t')).join('\n');
  navigator.clipboard.writeText(tsv);
};


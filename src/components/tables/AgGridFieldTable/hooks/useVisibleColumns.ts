import { useMemo } from 'react';
import type { FieldSchema } from '../../../../utils/tableUtils';
import { isEmptyColumn } from '../../../../utils/tableUtils';
import type { RowData } from '../types';

/**
 * Hook for computing visible columns based on empty column filter
 */
export const useVisibleColumns = (
  schema: FieldSchema[],
  hiddenEmptyColumns: boolean,
  filteredRows: RowData[]
) => {
  const visibleColumns = useMemo(() => {
    if (!hiddenEmptyColumns) return schema;
    return schema.filter(col => !isEmptyColumn(col.name, filteredRows));
  }, [schema, hiddenEmptyColumns, filteredRows]);

  return visibleColumns;
};



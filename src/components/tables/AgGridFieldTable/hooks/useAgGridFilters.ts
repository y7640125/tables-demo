import { useState, useMemo } from 'react';
import type { RowData } from '../types';
import { strongId, getUniqueValues } from '../../../../utils/tableUtils';

/**
 * Hook for managing AG Grid filter state
 */
export const useAgGridFilters = (rows: RowData[]) => {
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [filterAnchor, setFilterAnchor] = useState<{ col: string; el: HTMLElement } | null>(null);

  // Compute filtered rows
  const filteredRows = useMemo(() => {
    let result = rows;
    Object.entries(filters).forEach(([col, values]) => {
      if (values.size > 0) {
        result = result.filter(row => values.has(strongId(row[col])));
      }
    });
    return result;
  }, [rows, filters]);

  const handleFilterToggle = (colId: string, value: string) => {
    setFilters(prev => {
      const colFilters = prev[colId] || new Set();
      const newSet = new Set(colFilters);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [colId]: newSet };
    });
  };

  const handleFilterClear = (colId: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[colId];
      return newFilters;
    });
  };

  const handleFilterSelectAll = (colId: string) => {
    setFilters(prev => {
      const allValues = getUniqueValues(colId, rows);
      return { ...prev, [colId]: new Set(allValues) };
    });
  };

  const openFilter = (colId: string, el: HTMLElement) => {
    setFilterAnchor({ col: colId, el });
  };

  const closeFilter = () => {
    setFilterAnchor(null);
  };

  return {
    filters,
    filterAnchor,
    filteredRows,
    handleFilterToggle,
    handleFilterClear,
    handleFilterSelectAll,
    openFilter,
    closeFilter,
  };
};


import { useState, useCallback } from 'react';
import type { RowData } from '../types';

/**
 * Hook for managing AG Grid row data (CRUD operations)
 */
export const useAgGridData = (initialRows: RowData[]) => {
  const [rows, setRows] = useState<RowData[]>(initialRows);
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const [addingRow, setAddingRow] = useState(false);

  const handleSaveEdit = useCallback((updatedRow: RowData) => {
    setRows(prev => prev.map((row) => 
      row.id === editingRow?.id ? updatedRow : row
    ));
    setEditingRow(null);
  }, [editingRow]);

  const handleAddRow = useCallback((newRow: RowData) => {
    // Generate a unique ID for the new row
    const maxId = rows.reduce((max, row) => {
      const rowId = typeof row.id === 'string' ? parseInt(row.id, 10) : row.id;
      return isNaN(rowId) ? max : Math.max(max, rowId);
    }, 0);
    const newId = (maxId + 1).toString();
    
    setRows(prev => [...prev, { ...newRow, id: newId }]);
    setAddingRow(false);
  }, [rows]);

  const handleDeleteRow = useCallback((rowId: string | number) => {
    setRows(prev => prev.filter(row => row.id !== rowId));
  }, []);

  const startEditing = useCallback((row: RowData) => {
    setEditingRow(row);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingRow(null);
  }, []);

  const startAdding = useCallback(() => {
    setAddingRow(true);
  }, []);

  const cancelAdding = useCallback(() => {
    setAddingRow(false);
  }, []);

  return {
    rows,
    editingRow,
    addingRow,
    setRows,
    handleSaveEdit,
    handleAddRow,
    handleDeleteRow,
    startEditing,
    cancelEditing,
    startAdding,
    cancelAdding,
  };
};




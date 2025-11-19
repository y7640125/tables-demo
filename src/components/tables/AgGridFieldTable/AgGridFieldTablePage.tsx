import { useState, useCallback, useRef, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Register AG Grid modules (required since v28+)
ModuleRegistry.registerModules([AllCommunityModule]);

import data from '../../../assets/mock-table-data.json';
import { Button, ColumnFilterPopover, Modal } from '../../../styles/design-system';
import { getUniqueValues, type TableData } from '../../../utils/tableUtils';
import type { RowData } from './types';
import { useAgGridData } from './hooks/useAgGridData';
import { useAgGridFilters } from './hooks/useAgGridFilters';
import { useVisibleColumns } from './hooks/useVisibleColumns';
import { useAgGridColumns } from './hooks/useAgGridColumns';
import { EditRowModal } from './components/EditRowModal';
import { AddRowModal } from './components/AddRowModal';
import styles from './AgGridFieldTablePage.module.css';
// Import for side effects - applies ellipsis styles to .ag-theme-quartz .ag-cell
import '../../../styles/design-system/TableEllipsis.module.css';

export default function AgGridFieldTablePage() {
  const tableData = data as TableData;
  const rowData = tableData.rows;
  
  const [hiddenEmptyColumns, setHiddenEmptyColumns] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Data management
  const {
    rows,
    editingRow,
    addingRow,
    handleSaveEdit,
    handleAddRow,
    handleDeleteRow,
    startEditing,
    cancelEditing,
    startAdding,
    cancelAdding,
  } = useAgGridData(rowData);

  // Filter management
  const {
    filters,
    filterAnchor,
    filteredRows,
    handleFilterToggle,
    handleFilterClear,
    handleFilterSelectAll,
    openFilter,
    closeFilter,
  } = useAgGridFilters(rows);

  // Visible columns
  const visibleColumns = useVisibleColumns(
    tableData.schema,
    hiddenEmptyColumns,
    filteredRows
  );

  // Column definitions
  const handleDeleteRowWrapper = useCallback((row: RowData) => {
    handleDeleteRow(row.id);
  }, [handleDeleteRow]);

  const { columnDefs, defaultColDef } = useAgGridColumns(
    visibleColumns,
    openFilter,
    startEditing,
    handleDeleteRowWrapper
  );

  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
    // Auto-size columns to fit content, but respect min/max constraints
    params.api.autoSizeAllColumns(false);
    // Ensure columns don't exceed max width
    params.api.getColumns()?.forEach((col: any) => {
      const width = col.getActualWidth();
      if (width && width > 200) {
        params.api.setColumnWidth(col, 200);
      } else if (width && width < 80) {
        params.api.setColumnWidth(col, 80);
      }
    });
  }, []);

  const onViewportChanged = useCallback(() => {
    // Don't refresh cells as it might cause spacing issues
    // The grid should handle rendering automatically
  }, []);

  const handleAutoSize = useCallback((colId: string) => {
    if (gridApi) {
      gridApi.autoSizeColumns([colId], false);
      const col = gridApi.getColumn(colId);
      if (col) {
        const width = Math.min(col.getActualWidth() || 200, 240);
        if (width < 240) {
          gridApi.setColumnWidths([{ key: colId, newWidth: width }]);
        }
      }
    }
  }, [gridApi]);

  const onCellDoubleClicked = useCallback((params: any) => {
    if (params.column) {
      handleAutoSize(params.column.getColId());
    }
  }, [handleAutoSize]);

  const getRowClass = useCallback((params: any) => {
    const isDisabled = params.data?.isDisabled === true;
    return `${styles.tableRow} ag-grid-row-with-actions ${isDisabled ? styles.disabledRow : ''}`;
  }, []);

  const onColumnResized = useCallback((params: any) => {
    if (params.finished && params.column) {
      const col = params.column;
      const newWidth = Math.min(Math.max(col.getActualWidth() || 200, 80), 200);
      if (gridApi) {
        gridApi.setColumnWidths([{ key: col.getColId(), newWidth }]);
      }
    }
  }, [gridApi]);

  const getRowId = useCallback((params: any) => params.data.id, []);

  // Shared table component function - used in both normal view and modal
  // This function returns the table component, allowing it to be reused
  const getTableComponent = useCallback((tableRef?: React.RefObject<AgGridReact>) => (
    <AgGridReact
      ref={tableRef || gridRef}
      rowData={filteredRows}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      onGridReady={onGridReady}
      onViewportChanged={onViewportChanged}
      rowBuffer={30}
      animateRows={false}
      suppressMultiSort={true}
      rowHeight={38}
      headerHeight={38}
      suppressCellFocus={true}
      enableRtl={true}
      localeText={{
        noRowsToShow: 'אין שורות להצגה',
      }}
      onCellDoubleClicked={onCellDoubleClicked}
      getRowClass={getRowClass}
      onColumnResized={onColumnResized}
      getRowId={getRowId}
    />
  ), [
    filteredRows,
    columnDefs,
    defaultColDef,
    onGridReady,
    onViewportChanged,
    onCellDoubleClicked,
    getRowClass,
    onColumnResized,
    getRowId
  ]);

  // Store the table component in a variable for reuse
  const tableComponent = getTableComponent();

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.toolbar}>
        <Button
          onClick={() => setIsModalOpen(true)}
          style={{ marginInlineEnd: '0.5rem' }}
        >
          🔍 פתח במודל
        </Button>
        <Button
          onClick={startAdding}
          style={{ marginInlineEnd: '0.5rem' }}
        >
          ➕ הוסף שורה
        </Button>
        <Button
          onClick={() => setHiddenEmptyColumns(!hiddenEmptyColumns)}
        >
          {hiddenEmptyColumns ? 'הצג עמודות ריקות' : 'הסתר עמודות ריקות'}
        </Button>
      </div>
      
      <div 
        dir="rtl"
        className="ag-theme-quartz custom-table"
        style={{ 
          direction: 'rtl', 
          textAlign: 'right', 
          height: '80vh', 
          width: '100%',
        }}
      >
        {tableComponent}
      </div>

      {filterAnchor && (
        <ColumnFilterPopover
          anchor={filterAnchor.el}
          open={true}
          onClose={closeFilter}
          values={getUniqueValues(filterAnchor.col, rows)}
          selected={filters[filterAnchor.col] || new Set()}
          onToggle={(value) => handleFilterToggle(filterAnchor.col, value)}
          onClear={() => handleFilterClear(filterAnchor.col)}
          onSelectAll={() => handleFilterSelectAll(filterAnchor.col)}
        />
      )}

      {editingRow && !editingRow.isDisabled && (
        <EditRowModal
          row={editingRow}
          schema={tableData.schema}
          onSave={handleSaveEdit}
          onClose={cancelEditing}
        />
      )}

      {addingRow && (
        <AddRowModal
          schema={tableData.schema}
          onSave={handleAddRow}
          onClose={cancelAdding}
        />
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className={styles.modalTableContainer}>
          <div 
            dir="rtl"
            className="ag-theme-quartz custom-table"
            style={{ 
              direction: 'rtl', 
              textAlign: 'right', 
              height: '80vh', 
              width: '90vw',
              maxWidth: '1200px',
            }}
          >
            {tableComponent}
          </div>
        </div>
      </Modal>
    </div>
  );
}

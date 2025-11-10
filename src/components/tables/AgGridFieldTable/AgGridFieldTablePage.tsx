import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, GridApi, ICellRendererParams, IHeaderParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Register AG Grid modules (required since v28+)
ModuleRegistry.registerModules([AllCommunityModule]);
import data from '../../../assets/mock-table-data.json';
import GenericField from '../../../styles/design-system/fields/GenericField';
import { Modal, IconButton, Button, Tooltip } from '../../../styles/design-system';
import { strongId, isEmptyColumn, getUniqueValues, type FieldSchema, type TableData } from '../../../utils/tableUtils';
import EmptyCell from '../../shared/EmptyCell';
import ColumnFilterPopover from '../../shared/ColumnFilterPopover';
import styles from './AgGridFieldTablePage.module.css';
// Import for side effects - applies ellipsis styles to .ag-theme-quartz .ag-cell
import '../../../styles/design-system/TableEllipsis.module.css';

type RowData = Record<string, any>;

// Custom header component with sorting support
function CustomHeaderComponent(params: IHeaderParams & { onFilterClick: (colId: string, el: HTMLElement) => void }) {
  const colId = params.column.getColId();
  const initialSort = params.column.getSort();
  const [sortState, setSortState] = useState<string | null>(initialSort || null);
  
  // Update sort state when column sort changes
  useEffect(() => {
    const updateSort = () => {
      const currentSort = params.column.getSort();
      setSortState(currentSort || null);
    };
    params.column.addEventListener('sortChanged', updateSort);
    return () => {
      params.column.removeEventListener('sortChanged', updateSort);
    };
  }, [params.column]);
  
  const handleHeaderClick = (e: React.MouseEvent) => {
    // Only trigger sort if clicking on the header content, not the filter button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    e.stopPropagation();
    // Cycle through sort states: none -> asc -> desc -> none
    const currentSort = params.column.getSort();
    if (!currentSort) {
      // First click: ascending
      params.setSort('asc', false);
    } else if (currentSort === 'asc') {
      // Second click: descending
      params.setSort('desc', false);
    } else if (currentSort === 'desc') {
      // Third click: unsorted
      params.setSort(null, false);
    }
  };
  
  return (
    <div className={styles.headerCell}>
      <div 
        className={styles.headerContent}
        onClick={handleHeaderClick}
        style={{ cursor: 'pointer', flex: 1 }}
      >
        <span>{params.displayName}</span>
        {/* Show sort icon based on state */}
        {sortState === 'asc' && (
          <span className={styles.sortIcon}>▲</span>
        )}
        {sortState === 'desc' && (
          <span className={styles.sortIcon}>▼</span>
        )}
      </div>
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          params.onFilterClick(colId, e.currentTarget);
        }}
        title="סינון"
      >
        🔽
      </IconButton>
    </div>
  );
}

export default function AgGridFieldTablePage() {
  const tableData = data as TableData;
  const rowData = tableData.rows;
  console.log('AG Grid rows length =', rowData?.length);
  
  const [rows, setRows] = useState<RowData[]>(rowData);
  const [hiddenEmptyColumns, setHiddenEmptyColumns] = useState(false);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [filterAnchor, setFilterAnchor] = useState<{ col: string; el: HTMLElement } | null>(null);
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

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

  // Compute visible columns
  const visibleColumns = useMemo(() => {
    if (!hiddenEmptyColumns) return tableData.schema;
    return tableData.schema.filter(col => !isEmptyColumn(col.name, filteredRows));
  }, [tableData.schema, hiddenEmptyColumns, filteredRows]);

  // Build column definitions - use field names that match data keys, no mutations
  const columnDefs = useMemo<ColDef[]>(() => {
    return visibleColumns.map((schema: FieldSchema) => {
      const fieldName = schema.name; // This must match the key in row objects
      
      return {
        headerName: schema.label,
        field: fieldName, // Critical: field must match data key
        sortable: true,
        resizable: true,
        width: 200,
        minWidth: 80,
        maxWidth: 200,
        autoHeaderHeight: true,
        cellRenderer: (params: ICellRendererParams) => {
          // Use params.data and params.colDef.field directly - most reliable
          const rowData = params.data as RowData;
          const field = params.colDef?.field as string || fieldName;
          
          // Get value directly from row data using the field name
          const value = rowData?.[field];
          const strongIdValue = strongId(value);
          
          if (!strongIdValue) {
            return (
              <Tooltip content="לא הוזן">
                <EmptyCell />
              </Tooltip>
            );
          }
          
          // Find schema for this field
          const fieldSchema = visibleColumns.find(col => col.name === field) || schema;
          
          const fieldModel = {
            name: fieldSchema.name,
            label: fieldSchema.label,
            type: fieldSchema.type,
            value: value,
            options: fieldSchema.options?.map(opt => ({ value: opt.value, label: opt.label })),
          };
          
          // Convert value to string for tooltip
          const tooltipContent = value != null ? String(value) : '';
          
          return (
            <Tooltip content={tooltipContent}>
              <div className={styles.cell}>
                <GenericField edit={false} model={fieldModel} hideLabel={true} />
              </div>
            </Tooltip>
          );
        },
        headerComponent: (params: IHeaderParams) => (
          <CustomHeaderComponent 
            {...params} 
            onFilterClick={(colId, el) => setFilterAnchor({ col: colId, el })} 
          />
        ),
        // Enable sorting on the header
        enableSorting: true,
      };
    });
  }, [visibleColumns]);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    editable: false,
    width: 200,
    minWidth: 80,
    maxWidth: 200,
    autoHeaderHeight: true,
    unSortIcon: true, // Enable third "unsorted" click state
    cellStyle: {
      direction: 'rtl',
      textAlign: 'right',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      display: 'block',
      maxWidth: '100%',
    },
  }), []);

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

  const handleSaveEdit = useCallback((updatedRow: RowData) => {
    setRows(prev => prev.map((row) => 
      row.id === editingRow?.id ? updatedRow : row
    ));
    setEditingRow(null);
  }, [editingRow]);

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

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.toolbar}>
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
        <AgGridReact
          ref={gridRef}
          rowData={filteredRows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          rowBuffer={10}
          animateRows={true}
          pagination={false}
          domLayout="normal"
          suppressMultiSort={true}
          rowHeight={38}
          headerHeight={38}
          enableRtl={true}
          localeText={{
            noRowsToShow: 'אין שורות להצגה',
          }}
          onCellDoubleClicked={(params) => {
            if (params.column) {
              handleAutoSize(params.column.getColId());
            }
          }}
          onColumnResized={(params) => {
            if (params.finished && params.column) {
              const col = params.column;
              const newWidth = Math.min(Math.max(col.getActualWidth() || 200, 80), 200);
              if (gridApi) {
                gridApi.setColumnWidths([{ key: col.getColId(), newWidth }]);
              }
            }
          }}
          getRowId={(params) => params.data.id}
        />
      </div>

      {filterAnchor && (
        <ColumnFilterPopover
          anchor={filterAnchor.el}
          open={true}
          onClose={() => setFilterAnchor(null)}
          values={getUniqueValues(filterAnchor.col, filteredRows)}
          selected={filters[filterAnchor.col] || new Set()}
          onToggle={(value) => {
            setFilters(prev => {
              const colFilters = prev[filterAnchor.col] || new Set();
              const newSet = new Set(colFilters);
              if (newSet.has(value)) {
                newSet.delete(value);
              } else {
                newSet.add(value);
              }
              return { ...prev, [filterAnchor.col]: newSet };
            });
          }}
          onClear={() => {
            setFilters(prev => {
              const newFilters = { ...prev };
              delete newFilters[filterAnchor.col];
              return newFilters;
            });
          }}
        />
      )}

      {editingRow && (
        <EditRowModal
          row={editingRow}
          schema={tableData.schema}
          onSave={handleSaveEdit}
          onClose={() => setEditingRow(null)}
        />
      )}
    </div>
  );
}

function EditRowModal({
  row,
  schema,
  onSave,
  onClose,
}: {
  row: RowData;
  schema: FieldSchema[];
  onSave: (row: RowData) => void;
  onClose: () => void;
}) {
  const [editedRow, setEditedRow] = useState<RowData>({ ...row });

  return (
    <Modal open={true} onClose={onClose}>
      <div className={styles.modalContent}>
        <h2>עריכת שורה</h2>
        <div className={styles.editForm}>
          {schema.map(field => (
            <GenericField
              key={field.name}
              edit={true}
              model={{
                name: field.name,
                label: field.label,
                type: field.type,
                value: editedRow[field.name],
                options: field.options,
              }}
              onChange={(value) => {
                setEditedRow(prev => ({ ...prev, [field.name]: value }));
              }}
            />
          ))}
        </div>
        <div className={styles.modalActions}>
          <Button onClick={() => onSave(editedRow)}>שמור</Button>
          <Button onClick={onClose}>ביטול</Button>
        </div>
      </div>
    </Modal>
  );
}


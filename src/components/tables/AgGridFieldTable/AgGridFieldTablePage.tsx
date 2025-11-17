import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, GridApi, ICellRendererParams, IHeaderParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Register AG Grid modules (required since v28+)
ModuleRegistry.registerModules([AllCommunityModule]);
import data from '../../../assets/mock-table-data.json';
import GenericField from '../../../styles/design-system/fields/GenericField';
import { Modal, IconButton, Button, Tooltip, ColumnFilterPopover } from '../../../styles/design-system';
import { strongId, isEmptyColumn, getUniqueValues, type FieldSchema, type TableData } from '../../../utils/tableUtils';
import EmptyCell from '../../shared/EmptyCell';
import styles from './AgGridFieldTablePage.module.css';
// Import for side effects - applies ellipsis styles to .ag-theme-quartz .ag-cell
import '../../../styles/design-system/TableEllipsis.module.css';

type RowData = Record<string, any>;

// Normalize options: handle both string arrays and object arrays
const normalizeOptions = (opts?: any[]): { value: string; label: string }[] | undefined => {
  if (!opts || opts.length === 0) return undefined;
  // Check if first option is a string or object
  if (typeof opts[0] === 'string') {
    return opts.map(opt => ({ value: opt, label: opt }));
  }
  return opts.map(opt => ({ value: opt.value, label: opt.label }));
};

// Cell component that only shows tooltip when text overflows
function CellWithConditionalTooltip({ 
  children, 
  tooltipContent 
}: { 
  children: React.ReactNode; 
  tooltipContent: string;
}) {
  const [hasOverflow, setHasOverflow] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (!cellRef.current) return;
      
      const element = cellRef.current;
      
      // New approach: check ALL elements and find the one that ACTUALLY overflows
      // Don't rely on classes or styles - just measure each element
      let hasAnyOverflow = false;
      
      // First, try to find .ellipsisText or .value (most reliable)
      const ellipsisTextElement = element.querySelector('.ellipsisText') as HTMLElement;
      const valueElement = element.querySelector('.value') as HTMLElement;
      
      if (ellipsisTextElement) {
        const scrollWidth = ellipsisTextElement.scrollWidth;
        const clientWidth = ellipsisTextElement.clientWidth;
        hasAnyOverflow = scrollWidth > clientWidth + 1;
      } else if (valueElement) {
        const scrollWidth = valueElement.scrollWidth;
        const clientWidth = valueElement.clientWidth;
        hasAnyOverflow = scrollWidth > clientWidth + 1;
      } else {
        // If we can't find by class, check ALL elements and see if ANY of them overflow
        const allElements = element.querySelectorAll('*');
        let foundOverflow = false;
        
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          const scrollWidth = el.scrollWidth;
          const clientWidth = el.clientWidth;
          
          if (scrollWidth > clientWidth + 1) {
            foundOverflow = true;
            hasAnyOverflow = true;
            break;
          }
        }
        
        if (!foundOverflow) {
          // Check the cell itself as last resort
          const scrollWidth = element.scrollWidth;
          const clientWidth = element.clientWidth;
          hasAnyOverflow = scrollWidth > clientWidth + 1;
        }
      }
      
      setHasOverflow(hasAnyOverflow);
    };

    // Check overflow after render with multiple attempts
    const timeoutId1 = setTimeout(checkOverflow, 0);
    const timeoutId2 = setTimeout(checkOverflow, 10);
    const timeoutId3 = setTimeout(checkOverflow, 50);
    const timeoutId4 = setTimeout(checkOverflow, 100);
    
    // Check on next animation frame
    const rafId1 = requestAnimationFrame(() => {
      checkOverflow();
      requestAnimationFrame(() => {
        checkOverflow();
      });
    });
    
    // Re-check on resize
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });
    if (cellRef.current) {
      resizeObserver.observe(cellRef.current);
    }
    
    // Also observe mutations to catch when content changes
    const mutationObserver = new MutationObserver(() => {
      checkOverflow();
    });
    if (cellRef.current) {
      mutationObserver.observe(cellRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      clearTimeout(timeoutId4);
      cancelAnimationFrame(rafId1);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [children]);

  const cellContent = (
    <div ref={cellRef} className={styles.cell}>
      {children}
    </div>
  );

  // Only show tooltip if there's overflow and we have content
  if (hasOverflow && tooltipContent && tooltipContent.trim()) {
    return (
      <Tooltip content={tooltipContent}>
        {cellContent}
      </Tooltip>
    );
  }

  return cellContent;
}

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
  const [addingRow, setAddingRow] = useState(false);
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
    const dataColumns = visibleColumns.map((schema: FieldSchema) => {
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
            return <EmptyCell />;
          }
          
          // Find schema for this field
          const fieldSchema = visibleColumns.find(col => col.name === field) || schema;
          
          const fieldModel = {
            name: fieldSchema.name,
            label: fieldSchema.label,
            type: fieldSchema.type,
            value: value,
            options: normalizeOptions(fieldSchema.options),
          };
          
          // Convert value to string for tooltip
          const tooltipContent = value != null ? String(value) : '';
          
          return (
            <CellWithConditionalTooltip tooltipContent={tooltipContent}>
              <GenericField edit={false} model={fieldModel} hideLabel={true} truncate={true} />
            </CellWithConditionalTooltip>
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

    // Add actions column pinned to the left (appears on left in RTL - end of row)
    const actionsColumn: ColDef = {
      headerName: '',
      field: '_actions',
      pinned: 'left', // In RTL, this appears on the left (end of row)
      sortable: false,
      resizable: false,
      width: 100,
      minWidth: 100,
      maxWidth: 100,
      cellRenderer: (params: ICellRendererParams) => {
        const rowData = params.data as RowData;
        return (
          <span 
            className={`${styles.actionsCell} ag-grid-actions-cell`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              margin: 0,
              padding: 0,
            }}
          >
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setEditingRow(rowData);
              }}
              title="עריכה"
              className={styles.actionButton}
            >
              ✏️
            </IconButton>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('האם אתה בטוח שברצונך למחוק שורה זו?')) {
                  setRows(prev => prev.filter(row => row.id !== rowData.id));
                }
              }}
              title="מחיקה"
              className={styles.actionButton}
            >
              🗑️
            </IconButton>
          </span>
        );
      },
      cellStyle: {
        padding: '0',
        margin: '0',
        overflow: 'visible',
        verticalAlign: 'middle',
      },
      cellClass: 'actions-column-cell',
    };

    return [...dataColumns, actionsColumn];
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
      maxWidth: '100%',
      padding: '0 8px',
      margin: '0',
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

  const onViewportChanged = useCallback(() => {
    // Don't refresh cells as it might cause spacing issues
    // The grid should handle rendering automatically
  }, []);

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
          onClick={() => setAddingRow(true)}
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
        <AgGridReact
          ref={gridRef}
          rowData={filteredRows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onViewportChanged={onViewportChanged}
          rowBuffer={30}
          animateRows={false}
          pagination={false}        
          domLayout="normal"
          suppressMultiSort={true}
          rowHeight={38}
          headerHeight={38}
          suppressRowHoverHighlight={false}
          suppressCellFocus={true}
          enableRtl={true}
          suppressRowVirtualisation={false}
          suppressColumnVirtualisation={false}
          localeText={{
            noRowsToShow: 'אין שורות להצגה',
          }}
          onCellDoubleClicked={(params) => {
            if (params.column) {
              handleAutoSize(params.column.getColId());
            }
          }}
          getRowClass={(params) => {
            return `${styles.tableRow} ag-grid-row-with-actions`;
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
          values={getUniqueValues(filterAnchor.col, rows)}
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
          onSelectAll={() => {
            setFilters(prev => {
              const allValues = getUniqueValues(filterAnchor.col, rows);
              return { ...prev, [filterAnchor.col]: new Set(allValues) };
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

      {addingRow && (
        <AddRowModal
          schema={tableData.schema}
          onSave={handleAddRow}
          onClose={() => setAddingRow(false)}
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
                options: normalizeOptions(field.options),
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

function AddRowModal({
  schema,
  onSave,
  onClose,
}: {
  schema: FieldSchema[];
  onSave: (row: RowData) => void;
  onClose: () => void;
}) {
  // Initialize form with default values based on field type
  const getDefaultValue = (field: FieldSchema): any => {
    switch (field.type) {
      case 'boolean':
        return false;
      case 'date':
        return '';
      case 'enum':
        return field.options?.[0]?.value || '';
      case 'text':
      case 'textarea':
      default:
        return '';
    }
  };

  const [newRow, setNewRow] = useState<RowData>(() => {
    const initialRow: RowData = {};
    schema.forEach(field => {
      // Skip id field - it will be generated on save
      if (field.name !== 'id') {
        initialRow[field.name] = getDefaultValue(field);
      }
    });
    return initialRow;
  });

  const handleSave = useCallback(() => {
    onSave(newRow);
  }, [newRow, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSave, onClose]);

  return (
    <Modal open={true} onClose={onClose}>
      <div className={styles.modalContent} onKeyDown={handleKeyDown}>
        <h2>הוספת שורה חדשה</h2>
        <div className={styles.editForm}>
          {schema.map(field => {
            // Skip id field in the form - it will be auto-generated
            if (field.name === 'id') {
              return null;
            }
            
            return (
              <GenericField
                key={field.name}
                edit={true}
                model={{
                  name: field.name,
                  label: field.label,
                  type: field.type,
                  value: newRow[field.name],
                  options: normalizeOptions(field.options),
                }}
                onChange={(value) => {
                  setNewRow(prev => ({ ...prev, [field.name]: value }));
                }}
              />
            );
          })}
        </div>
        <div className={styles.modalActions}>
          <Button onClick={handleSave}>שמור</Button>
          <Button onClick={onClose}>ביטול</Button>
        </div>
      </div>
    </Modal>
  );
}


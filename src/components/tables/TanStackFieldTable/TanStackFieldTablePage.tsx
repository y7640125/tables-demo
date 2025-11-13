import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnOrderState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import data from '../../../assets/mock-table-data.json';
import GenericField from '../../../styles/design-system/fields/GenericField';
import { Modal, IconButton, Button, Tooltip, ColumnFilterPopover } from '../../../styles/design-system';
import { strongId, isEmptyColumn, getUniqueValues, type FieldSchema, type TableData } from '../../../utils/tableUtils';
import EmptyCell from '../../shared/EmptyCell';
import styles from './TanStackFieldTablePage.module.css';
import ellipsisStyles from '../../../styles/design-system/TableEllipsis.module.css';

type RowData = Record<string, any>;

// Component that only shows tooltip if content overflows
function CellWithConditionalTooltip({ 
  children, 
  tooltipContent,
  className 
}: { 
  children: React.ReactNode; 
  tooltipContent: string;
  className?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (!contentRef.current) return;
      
      // Check the main element and all its descendants for overflow
      const checkElement = (element: Element): boolean => {
        const hasOverflow = element.scrollWidth > element.clientWidth || 
                           element.scrollHeight > element.clientHeight;
        
        if (hasOverflow) return true;
        
        // Check all children recursively
        for (let i = 0; i < element.children.length; i++) {
          if (checkElement(element.children[i])) {
            return true;
          }
        }
        
        return false;
      };
      
      setIsOverflowing(checkElement(contentRef.current));
    };

    // Check immediately and after a short delay to ensure DOM is fully rendered
    checkOverflow();
    const timeoutId = setTimeout(checkOverflow, 50);
    
    // Recheck on window resize
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children, tooltipContent]);

  const content = (
    <div ref={contentRef} className={className}>
      {children}
    </div>
  );

  return isOverflowing ? (
    <Tooltip content={tooltipContent}>
      {content}
    </Tooltip>
  ) : content;
}

export default function TanStackFieldTablePage() {
  const tableData = data as TableData;
  const [rows, setRows] = useState<RowData[]>(tableData.rows);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hiddenEmptyColumns, setHiddenEmptyColumns] = useState(false);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [filterAnchor, setFilterAnchor] = useState<{ col: string; el: HTMLElement } | null>(null);
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const [addingRow, setAddingRow] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ rowIndex: number; columnId: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Compute filtered rows
  const filteredRows = useMemo(() => {
    let result = rows;
    
    // Apply filters
    Object.entries(filters).forEach(([col, values]) => {
      if (values.size > 0) {
        result = result.filter(row => values.has(strongId(row[col])));
      }
    });
    
    return result;
  }, [rows, filters]);

  // Compute visible columns (hide empty if toggle is on)
  const visibleColumns = useMemo(() => {
    if (!hiddenEmptyColumns) return tableData.schema;
    return tableData.schema.filter(col => !isEmptyColumn(col.name, filteredRows));
  }, [tableData.schema, hiddenEmptyColumns, filteredRows]);

  // Initialize column order from visible columns
  const initialColumnOrder = useMemo(() => {
    return visibleColumns.map(col => col.name);
  }, [visibleColumns]);
  
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(initialColumnOrder);
  const prevVisibleColumnsRef = useRef(visibleColumns);
  
  // Update column order when visible columns change (e.g., when hiding/showing empty columns)
  useEffect(() => {
    const prevVisibleColumnNames = prevVisibleColumnsRef.current.map(col => col.name);
    const visibleColumnNames = visibleColumns.map(col => col.name);
    
    // Only update if the visible columns actually changed
    if (prevVisibleColumnNames.join(',') !== visibleColumnNames.join(',')) {
      setColumnOrder(prevOrder => {
        const currentOrder = prevOrder.filter(colId => visibleColumnNames.includes(colId));
        const newColumns = visibleColumnNames.filter(colId => !currentOrder.includes(colId));
        return [...currentOrder, ...newColumns];
      });
      prevVisibleColumnsRef.current = visibleColumns;
    }
  }, [visibleColumns]);

  // Build column definitions
  const columns = useMemo<ColumnDef<RowData>[]>(() => {
    return visibleColumns.map((schema: FieldSchema) => ({
      id: schema.name,
      header: ({ column }) => {
        const sortDir = column.getIsSorted();
        
        return (
          <div className={styles.headerCell}>
            <button
              className={styles.headerButton}
              onClick={(e) => {
                e.stopPropagation();
                column.toggleSorting(undefined, true);
              }}
              onMouseDown={(e) => {
                // Prevent drag when clicking the sort button
                e.stopPropagation();
              }}
            >
              <span>{schema.label}</span>
              {sortDir && (
                <span className={styles.sortIcon}>
                  {sortDir === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </button>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setFilterAnchor({ col: schema.name, el: e.currentTarget });
              }}
              onMouseDown={(e) => {
                // Prevent drag when clicking the filter button
                e.stopPropagation();
              }}
              title="סינון"
            >
              🔽
            </IconButton>
          </div>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue();
        const strongIdValue = strongId(value);
        
        if (!strongIdValue) {
          return (
            <Tooltip content="לא הוזן">
              <EmptyCell />
            </Tooltip>
          );
        }
        
        const fieldModel = {
          name: schema.name,
          label: schema.label,
          type: schema.type,
          value: value as string | boolean | Date,
          options: schema.options?.map(opt => ({ value: opt.value, label: opt.label })),
        };
        
        // Convert value to string for tooltip
        const tooltipContent = value != null ? String(value) : '';
        
        // Special wrapper for boolean cells to ensure vertical centering
        const isBoolean = schema.type === 'boolean';
        const cellClassName = isBoolean 
          ? `${styles.cell} ${styles.booleanCell}`
          : `${styles.cell} ${ellipsisStyles.ellipsisCell}`;
        
        return (
          <CellWithConditionalTooltip 
            tooltipContent={tooltipContent}
            className={cellClassName}
          >
            <GenericField edit={false} model={fieldModel} hideLabel={true} truncate={true} />
          </CellWithConditionalTooltip>
        );
      },
      accessorKey: schema.name,
      sortingFn: (rowA, rowB, columnId) => {
        const a = strongId(rowA.getValue(columnId));
        const b = strongId(rowB.getValue(columnId));
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      },
      size: 200,
      minSize: 80,
      maxSize: 200,
    }));
  }, [visibleColumns, filteredRows, filters]);

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnOrder },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'rtl',
  });

  // Virtualization - only virtualize rows
  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  const handleDeleteRow = useCallback((index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
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

  // Drag and drop handlers for column reordering
  const handleDragStart = useCallback((e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnId);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedColumn(null);
    setDragOverColumn(null);
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedColumn && draggedColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  }, [draggedColumn]);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const sourceColumnId = draggedColumn;
    
    if (!sourceColumnId || sourceColumnId === targetColumnId) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    // Reorder columns
    const currentOrder = [...columnOrder];
    const sourceIndex = currentOrder.indexOf(sourceColumnId);
    const targetIndex = currentOrder.indexOf(targetColumnId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      // Remove source from its position
      currentOrder.splice(sourceIndex, 1);
      // Insert at target position
      currentOrder.splice(targetIndex, 0, sourceColumnId);
      setColumnOrder(currentOrder);
    }

    setDraggedColumn(null);
    setDragOverColumn(null);
  }, [draggedColumn, columnOrder]);

  // Cell selection handlers
  const getCellKey = useCallback((rowIndex: number, columnId: string) => {
    return `${rowIndex}-${columnId}`;
  }, []);

  // Get column index from column ID
  const getColumnIndex = useCallback((columnId: string) => {
    return visibleColumns.findIndex(col => col.name === columnId);
  }, [visibleColumns]);

  // Calculate rectangular selection
  const calculateRectangularSelection = useCallback((startRow: number, startCol: string, endRow: number, endCol: string) => {
    const startColIndex = getColumnIndex(startCol);
    const endColIndex = getColumnIndex(endCol);
    
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minColIndex = Math.min(startColIndex, endColIndex);
    const maxColIndex = Math.max(startColIndex, endColIndex);
    
    const selected = new Set<string>();
    
    for (let row = minRow; row <= maxRow; row++) {
      for (let colIndex = minColIndex; colIndex <= maxColIndex; colIndex++) {
        if (row >= 0 && row < filteredRows.length && colIndex >= 0 && colIndex < visibleColumns.length) {
          const columnId = visibleColumns[colIndex].name;
          selected.add(getCellKey(row, columnId));
        }
      }
    }
    
    return selected;
  }, [getColumnIndex, visibleColumns, filteredRows.length, getCellKey]);

  const handleCellMouseDown = useCallback((e: React.MouseEvent, rowIndex: number, columnId: string) => {
    if (e.button !== 0) return; // Only handle left mouse button
    e.preventDefault();
    setIsSelecting(true);
    setSelectionStart({ rowIndex, columnId });
    setSelectedCells(new Set([getCellKey(rowIndex, columnId)]));
    setContextMenu(null);
  }, [getCellKey]);

  const handleCellMouseEnter = useCallback((_e: React.MouseEvent, rowIndex: number, columnId: string) => {
    if (isSelecting && selectionStart) {
      const newSelection = calculateRectangularSelection(
        selectionStart.rowIndex,
        selectionStart.columnId,
        rowIndex,
        columnId
      );
      setSelectedCells(newSelection);
    }
  }, [isSelecting, selectionStart, calculateRectangularSelection]);

  const handleCellMouseUp = useCallback(() => {
    setIsSelecting(false);
    setSelectionStart(null);
  }, []);

  // Copy functionality
  const handleCopy = useCallback(() => {
    if (selectedCells.size === 0) return;
    
    const cellData: string[] = [];
    const rows = new Map<number, Map<string, string>>();
    
    selectedCells.forEach(cellKey => {
      const [rowIndexStr, columnId] = cellKey.split('-');
      const rowIndex = parseInt(rowIndexStr, 10);
      const row = filteredRows[rowIndex];
      if (row) {
        const value = row[columnId];
        const cellValue = value != null ? String(value) : '';
        if (!rows.has(rowIndex)) {
          rows.set(rowIndex, new Map());
        }
        rows.get(rowIndex)!.set(columnId, cellValue);
      }
    });
    
    // Sort by row index and column order
    const sortedRows = Array.from(rows.keys()).sort((a, b) => a - b);
    sortedRows.forEach(rowIndex => {
      const rowCells = rows.get(rowIndex)!;
      const sortedColumns = visibleColumns
        .filter(col => rowCells.has(col.name))
        .map(col => rowCells.get(col.name)!);
      if (sortedColumns.length > 0) {
        cellData.push(sortedColumns.join('\t'));
      }
    });
    
    if (cellData.length > 0) {
      navigator.clipboard.writeText(cellData.join('\n'));
    }
  }, [selectedCells, filteredRows, visibleColumns]);

  // Keyboard handler for copy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCells.size > 0) {
        e.preventDefault();
        handleCopy();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCells, handleCopy]);

  // Right-click context menu
  const handleCellContextMenu = useCallback((e: React.MouseEvent, rowIndex: number, columnId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    
    // If this cell is not selected, select only this cell
    const cellKey = getCellKey(rowIndex, columnId);
    if (!selectedCells.has(cellKey)) {
      setSelectedCells(new Set([cellKey]));
    }
  }, [selectedCells, getCellKey]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  return (
    <div 
      className={styles.container} 
      dir="rtl"
      onMouseUp={handleCellMouseUp}
      onMouseLeave={handleCellMouseUp}
    >
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
      
      <div ref={tableContainerRef} className={`${styles.tableContainer} table-container`}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
            width: '100%',
          }}
        >
          <table className={`${styles.table} custom-table tanstack-table`}>
            <thead className={styles.thead}>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const columnId = header.column.id;
                    const isDragging = draggedColumn === columnId;
                    const isDragOver = dragOverColumn === columnId;
                    
                    return (
                      <th
                        key={header.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, columnId)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, columnId)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, columnId)}
                        style={{
                          width: Math.min(Math.max(header.getSize(), 80), 200),
                          position: 'sticky',
                          top: 0,
                          zIndex: isDragging ? 20 : 10,
                          backgroundColor: isDragOver ? '#3a3f57' : '#2e3144',
                          height: '35px',
                          cursor: isDragging ? 'grabbing' : 'grab',
                        }}
                        className={`${styles.th} ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={styles.resizer}
                        />
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {(() => {
                const virtualItems = rowVirtualizer.getVirtualItems();
                if (virtualItems.length === 0) return null;
                
                return (
                  <>
                    <tr style={{ height: virtualItems[0]?.start ?? 0 }} aria-hidden="true" />
                    {virtualItems.map(virtualRow => {
                      const row = table.getRowModel().rows[virtualRow.index];
                      if (!row) return null;
                      
                      return (
                        <tr
                          key={row.id}
                          data-index={virtualRow.index}
                          className={styles.tr}
                          onMouseEnter={() => setHoveredRow(virtualRow.index)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          {row.getVisibleCells().map(cell => {
                            const cellKey = getCellKey(virtualRow.index, cell.column.id);
                            const isSelected = selectedCells.has(cellKey);
                            
                            return (
                              <td 
                                key={cell.id} 
                                className={styles.td} 
                                style={{ 
                                  width: Math.min(Math.max(cell.column.getSize(), 80), 200),
                                  height: '35px',
                                  backgroundColor: isSelected ? '#ff69b4' : '#202233',
                                }}
                                onMouseDown={(e) => handleCellMouseDown(e, virtualRow.index, cell.column.id)}
                                onMouseEnter={(e) => handleCellMouseEnter(e, virtualRow.index, cell.column.id)}
                                onMouseUp={handleCellMouseUp}
                                onContextMenu={(e) => handleCellContextMenu(e, virtualRow.index, cell.column.id)}
                              >
                                <div className={styles.tanStackCellWrapper} style={{ backgroundColor: isSelected ? '#ff69b4' : 'transparent' }}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </div>
                              </td>
                            );
                          })}
                          {hoveredRow === virtualRow.index && (
                            <td className={styles.actionsCell}>
                              <IconButton onClick={() => setEditingRow(row.original)} title="עריכה">
                                ✏️
                              </IconButton>
                              <IconButton onClick={() => handleDeleteRow(virtualRow.index)} title="מחיקה">
                                🗑️
                              </IconButton>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    <tr
                      style={{
                        height: rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0),
                      }}
                      aria-hidden="true"
                    />
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
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

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: '#2e3144',
            border: '1px solid #5e636c80',
            borderRadius: '4px',
            padding: '4px',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            direction: 'rtl',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleCopy();
              setContextMenu(null);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: '#d6ddec',
              cursor: 'pointer',
              textAlign: 'right',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3f57'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            העתק
          </button>
        </div>
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
                  options: field.options,
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


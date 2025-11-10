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
import { Modal, IconButton, Button, Tooltip } from '../../../styles/design-system';
import { strongId, isEmptyColumn, getUniqueValues, type FieldSchema, type TableData } from '../../../utils/tableUtils';
import EmptyCell from '../../shared/EmptyCell';
import ColumnFilterPopover from '../../shared/ColumnFilterPopover';
import styles from './TanStackFieldTablePage.module.css';
import ellipsisStyles from '../../../styles/design-system/TableEllipsis.module.css';

type RowData = Record<string, any>;

export default function TanStackFieldTablePage() {
  const tableData = data as TableData;
  const [rows, setRows] = useState<RowData[]>(tableData.rows);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hiddenEmptyColumns, setHiddenEmptyColumns] = useState(false);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [filterAnchor, setFilterAnchor] = useState<{ col: string; el: HTMLElement } | null>(null);
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
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
          <Tooltip content={tooltipContent}>
            <div className={cellClassName}>
              <GenericField edit={false} model={fieldModel} hideLabel={true} />
            </div>
          </Tooltip>
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

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.toolbar}>
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
                          {row.getVisibleCells().map(cell => (
                            <td 
                              key={cell.id} 
                              className={styles.td} 
                              style={{ 
                                width: Math.min(Math.max(cell.column.getSize(), 80), 200),
                                height: '35px',
                                backgroundColor: '#202233',
                              }}
                            >
                              <div className={styles.tanStackCellWrapper}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                            </td>
                          ))}
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


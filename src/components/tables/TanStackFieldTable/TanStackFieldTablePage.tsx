import { useMemo, useState, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import data from '../../../assets/mock-table-data.json';
import GenericField from '../../../styles/design-system/fields/GenericField';
import { Modal, IconButton, Button } from '../../../styles/design-system';
import { strongId, isEmptyColumn, getUniqueValues, type FieldSchema, type TableData } from '../../../utils/tableUtils';
import EmptyCell from '../../shared/EmptyCell';
import ColumnFilterPopover from '../../shared/ColumnFilterPopover';
import styles from './TanStackFieldTablePage.module.css';

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
              onClick={() => {
                column.toggleSorting(undefined, true);
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
          return <EmptyCell />;
        }
        
        const fieldModel = {
          name: schema.name,
          label: schema.label,
          type: schema.type,
          value: value as string | boolean | Date,
          options: schema.options?.map(opt => ({ value: opt.value, label: opt.label })),
        };
        
        return (
          <div className={styles.cell}>
            <GenericField edit={false} model={fieldModel} hideLabel={true} />
          </div>
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
    state: { sorting },
    onSortingChange: setSorting,
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
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      style={{
                        width: Math.min(Math.max(header.getSize(), 80), 200),
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        backgroundColor: '#2e3144',
                        height: '35px',
                      }}
                      className={styles.th}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={styles.resizer}
                      />
                    </th>
                  ))}
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
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
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


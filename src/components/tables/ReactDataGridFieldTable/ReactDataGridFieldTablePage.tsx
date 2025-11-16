import { useMemo, useState, useCallback, useRef } from 'react';
import DataGrid, { type Column } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import data from '../../../assets/mock-table-data.json';
import GenericField from '../../../styles/design-system/fields/GenericField';
import { Modal, Button, ColumnFilterPopover } from '../../../styles/design-system';
import { strongId, isEmptyColumn, getUniqueValues, type FieldSchema, type TableData } from '../../../utils/tableUtils';
import EmptyCell from '../../shared/EmptyCell';
import styles from './ReactDataGridFieldTablePage.module.css';

type RowData = Record<string, any> & { id: string };

// Normalize options: handle both string arrays and object arrays
const normalizeOptions = (opts?: any[]): { value: string; label: string }[] | undefined => {
  if (!opts || opts.length === 0) return undefined;
  // Check if first option is a string or object
  if (typeof opts[0] === 'string') {
    return opts.map(opt => ({ value: opt, label: opt }));
  }
  return opts.map(opt => ({ value: opt.value, label: opt.label }));
};

// Filter Header Component using ColumnFilterPopover
function RDGFilterHeader({ 
  column, 
  allRows, 
  filters, 
  setFilters 
}: {
  column: { key: string; name: string | React.ReactElement };
  allRows: any[];
  filters: Record<string, Set<any>>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, Set<any>>>>;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  
  const values = useMemo(() => {
    return getUniqueValues(column.key, allRows);
  }, [allRows, column.key]);
  
  const selected = filters[column.key] ?? new Set<string>();
  const hasActiveFilter = selected.size > 0;

  const columnName = typeof column.name === 'string' ? column.name : '';
  
  return (
    <div className={styles.headerCell}>
      <div className={styles.headerContent}>
        <span>{columnName || column.name}</span>
      </div>
      <span 
        onClick={(e) => {
          e.stopPropagation();
          setFilterAnchor(e.currentTarget);
          setFilterOpen(true);
        }} 
        style={{ 
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: 4,
          transition: 'background 0.2s',
          backgroundColor: hasActiveFilter ? '#3a3d55' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!hasActiveFilter) e.currentTarget.style.backgroundColor = '#202233';
        }}
        onMouseLeave={(e) => {
          if (!hasActiveFilter) e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="סינון"
      >
        🔽
      </span>
      <ColumnFilterPopover
        anchor={filterAnchor}
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        values={values}
        selected={selected}
        onToggle={(value) => {
          setFilters(prev => {
            const next = new Set(prev[column.key] ?? []);
            if (next.has(value)) {
              next.delete(value);
            } else {
              next.add(value);
            }
            const newFilters = { ...prev };
            if (next.size > 0) {
              newFilters[column.key] = next;
            } else {
              delete newFilters[column.key];
            }
            return newFilters;
          });
        }}
        onClear={() => {
          setFilters(prev => {
            const next = { ...prev };
            delete next[column.key];
            return next;
          });
        }}
        onSelectAll={() => {
          setFilters(prev => {
            const allValuesSet = new Set(values);
            return { ...prev, [column.key]: allValuesSet };
          });
        }}
      />
    </div>
  );
}

export default function ReactDataGridFieldTablePage() {
  const tableData = data as TableData;
  console.log('rows length =', tableData.rows?.length);
  const [rows, setRows] = useState<RowData[]>(tableData.rows as RowData[]);
  const [hiddenEmptyColumns, setHiddenEmptyColumns] = useState(false);
  const [filters, setFilters] = useState<Record<string, Set<any>>>({});
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const [sortColumns, setSortColumns] = useState<readonly { columnKey: string; direction: 'ASC' | 'DESC' }[]>([]);
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  // Compute filtered rows
  const filteredRows = useMemo(() => {
    if (!Object.keys(filters).length) {
      let result = rows;
      // Apply sorting
      if (sortColumns.length > 0) {
        const sortCol = sortColumns[0];
        result = [...result].sort((a, b) => {
          const aVal = strongId(a[sortCol.columnKey]);
          const bVal = strongId(b[sortCol.columnKey]);
          const comparison = aVal.localeCompare(bVal);
          return sortCol.direction === 'ASC' ? comparison : -comparison;
        });
      }
      return result;
    }
    
    let result = rows.filter(r =>
      Object.entries(filters).every(([k, set]) =>
        set.size === 0 ? true : set.has(strongId(r[k]))
      )
    );
    
    // Apply sorting
    if (sortColumns.length > 0) {
      const sortCol = sortColumns[0];
      result = [...result].sort((a, b) => {
        const aVal = strongId(a[sortCol.columnKey]);
        const bVal = strongId(b[sortCol.columnKey]);
        const comparison = aVal.localeCompare(bVal);
        return sortCol.direction === 'ASC' ? comparison : -comparison;
      });
    }
    
    return result;
  }, [rows, filters, sortColumns]);

  // Compute visible columns
  const visibleColumns = useMemo(() => {
    if (!hiddenEmptyColumns) return tableData.schema;
    return tableData.schema.filter(col => !isEmptyColumn(col.name, filteredRows));
  }, [tableData.schema, hiddenEmptyColumns, filteredRows]);

  // Build column definitions with version-agnostic header renderer
  // RDG v7 uses headerRenderer, v8 uses renderHeaderCell
  const columns = useMemo(() => {
    return visibleColumns.map((schema: FieldSchema) => {
      const baseColumn: any = {
        key: schema.name,
        name: schema.label,
        resizable: true,
        sortable: true,
        width: 200,
        minWidth: 80,
        maxWidth: 200,
        formatter: ({ row }: { row: RowData }) => {
          const value = row[schema.name];
          const strongIdValue = strongId(value);
          
          if (!strongIdValue) {
            return <EmptyCell />;
          }
          
          const fieldModel = {
            name: schema.name,
            label: schema.label,
            type: schema.type,
            value: value,
            options: normalizeOptions(schema.options),
          };
          
          return (
            <div className={styles.cell}>
              <GenericField edit={false} model={fieldModel} hideLabel={true} />
            </div>
          );
        },
      };

      // Apply header renderer - try v8 first (renderHeaderCell), fallback to v7 (headerRenderer)
      // Check if renderHeaderCell is available in DataGrid type
      const headerRendererFn = (p: { column: Column<RowData> }) => (
        <RDGFilterHeader 
          column={{ key: p.column.key as string, name: schema.label }} 
          allRows={rows} 
          filters={filters} 
          setFilters={setFilters} 
        />
      );

      // For v7 (current version), use headerRenderer
      baseColumn.headerRenderer = headerRendererFn;
      
      // For v8 compatibility, also set renderHeaderCell if it exists
      if ('renderHeaderCell' in DataGrid) {
        baseColumn.renderHeaderCell = headerRendererFn;
      }

      return baseColumn as Column<RowData>;
    });
  }, [visibleColumns, rows, filters, setFilters]);

  const handleSaveEdit = useCallback((updatedRow: RowData) => {
    setRows(prev => prev.map((row) => 
      row.id === editingRow?.id ? updatedRow : row
    ));
    setEditingRow(null);
  }, [editingRow]);

  // Handle copy to clipboard
  const handleCopy = useCallback(() => {
    if (selectedRows.size === 0) return;
    
    const selectedRowsData = filteredRows.filter(row => selectedRows.has(row.id));
    
    const cells: string[][] = [];
    selectedRowsData.forEach(row => {
      const rowCells: string[] = [];
      columns.forEach(col => {
        rowCells.push(strongId(row[col.key]));
      });
      cells.push(rowCells);
    });
    
    const tsv = cells.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(tsv);
  }, [selectedRows, filteredRows, columns]);

  // Keyboard handler for copy
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      handleCopy();
    }
  }, [handleCopy]);

  return (
    <div className={styles.container} dir="rtl" onKeyDown={handleKeyDown}>
      <div className={styles.toolbar}>
        <Button
          onClick={() => setHiddenEmptyColumns(!hiddenEmptyColumns)}
        >
          {hiddenEmptyColumns ? 'הצג עמודות ריקות' : 'הסתר עמודות ריקות'}
        </Button>
      </div>
      
      <div 
        ref={gridRef} 
        className={styles.gridContainer}
        style={{ height: '80vh', width: '100%', direction: 'rtl' }}
      >
        <DataGrid
          columns={columns}
          rows={filteredRows}
          onRowsChange={setRows}
          onSortColumnsChange={setSortColumns}
          sortColumns={sortColumns}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          rowKeyGetter={(row) => row.id}
          defaultColumnOptions={{
            resizable: true,
            sortable: true,
            width: 200,
            minWidth: 80,
            maxWidth: 200,
          }}
          rowHeight={35}
          className="rdg-light custom-table"
          style={{ height: '100%', width: '100%' }}
        />
      </div>

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


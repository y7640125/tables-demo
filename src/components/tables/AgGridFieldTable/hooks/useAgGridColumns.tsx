import { useMemo } from 'react';
import type { ColDef, ICellRendererParams, IHeaderParams } from 'ag-grid-community';
import type { FieldSchema } from '../../../../utils/tableUtils';
import type { RowData } from '../types';
import { strongId } from '../../../../utils/tableUtils';
import { normalizeOptions } from '../utils/normalizeOptions';
import EmptyCell from '../../../shared/EmptyCell';
import GenericField from '../../../../styles/design-system/fields/GenericField';
import { CustomHeaderComponent } from '../components/CustomHeaderComponent';
import { ActionsCellRenderer } from '../components/ActionsCellRenderer';
import { CellWithConditionalTooltip } from '../components/CellWithConditionalTooltip';

type OnFilterClick = (colId: string, el: HTMLElement) => void;
type OnEditClick = (row: RowData) => void;
type OnDeleteClick = (row: RowData) => void;

type UseAgGridColumnsReturn = {
  columnDefs: ColDef[];
  defaultColDef: ColDef;
};

/**
 * Hook for generating AG Grid column definitions
 */
export const useAgGridColumns = (
  visibleColumns: FieldSchema[],
  onFilterClick: OnFilterClick,
  onEditClick: OnEditClick,
  onDeleteClick: OnDeleteClick
): UseAgGridColumnsReturn => {
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
            onFilterClick={onFilterClick}
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
      filter: false,
      suppressHeaderMenuButton: true,
      width: 100,
      minWidth: 100,
      maxWidth: 100,
      headerComponent: () => <div></div>,
      cellRenderer: (params: ICellRendererParams) => (
        <ActionsCellRenderer
          params={params}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      ),
      headerStyle: {
        borderRight: 'none',
      },
      cellStyle: {
        padding: '0',
        margin: '0',
        overflow: 'visible',
        verticalAlign: 'middle',
        borderRight: 'none',
        borderBottom: '1px solid rgba(94, 99, 108, 0.5)',
      },
      cellClass: 'actions-column-cell',
      headerClass: 'actions-column-header',
    };

    return [...dataColumns, actionsColumn];
  }, [visibleColumns, onFilterClick, onEditClick, onDeleteClick]);

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

  return { columnDefs, defaultColDef };
};


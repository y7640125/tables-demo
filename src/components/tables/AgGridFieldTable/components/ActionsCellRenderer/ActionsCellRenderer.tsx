import type { ICellRendererParams } from 'ag-grid-community';
import { IconButton } from '../../../../../styles/design-system';
import type { RowData } from '../../types';
import styles from '../../AgGridFieldTablePage.module.css';

type Props = {
  params: ICellRendererParams;
  onEditClick: (row: RowData) => void;
  onDeleteClick: (row: RowData) => void;
};

/**
 * Cell renderer for actions column (edit/delete buttons)
 */
export function ActionsCellRenderer({ params, onEditClick, onDeleteClick }: Props) {
  const rowData = params.data as RowData;
  const isDisabled = rowData.isDisabled === true;
  
  if (isDisabled) {
    return null;
  }
  
  return (
    <span 
      className={`${styles.actionsCell} ag-grid-actions-cell`}
    >
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onEditClick(rowData);
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
            onDeleteClick(rowData);
          }
        }}
        title="מחיקה"
        className={styles.actionButton}
      >
        🗑️
      </IconButton>
    </span>
  );
}



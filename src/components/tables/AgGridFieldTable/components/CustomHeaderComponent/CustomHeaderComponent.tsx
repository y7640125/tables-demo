import { useState, useEffect } from 'react';
import type { IHeaderParams } from 'ag-grid-community';
import { IconButton } from '../../../../../styles/design-system';
import styles from '../../AgGridFieldTablePage.module.css';

type Props = IHeaderParams & {
  onFilterClick: (colId: string, el: HTMLElement) => void;
};

/**
 * Custom header component with sorting support
 */
export function CustomHeaderComponent(params: Props) {
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



import { Tooltip } from '../../../../../styles/design-system';
import { useOverflowDetection } from '../../hooks/useOverflowDetection';
import styles from '../../AgGridFieldTablePage.module.css';

type Props = {
  children: React.ReactNode;
  tooltipContent: string;
};

/**
 * Cell component that only shows tooltip when text overflows
 */
export function CellWithConditionalTooltip({ children, tooltipContent }: Props) {
  const { hasOverflow, cellRef } = useOverflowDetection(children);

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




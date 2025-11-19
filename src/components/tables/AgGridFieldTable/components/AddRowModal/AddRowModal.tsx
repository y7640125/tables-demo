import { useState, useCallback } from 'react';
import { Modal, Button } from '../../../../../styles/design-system';
import GenericField from '../../../../../styles/design-system/fields/GenericField';
import type { FieldSchema } from '../../../../../utils/tableUtils';
import type { RowData } from '../../types';
import { normalizeOptions } from '../../utils/normalizeOptions';
import { getDefaultValue } from '../../utils/getDefaultValue';
import styles from '../../AgGridFieldTablePage.module.css';

type Props = {
  schema: FieldSchema[];
  onSave: (row: RowData) => void;
  onClose: () => void;
};

/**
 * Modal for adding a new table row
 */
export function AddRowModal({ schema, onSave, onClose }: Props) {
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



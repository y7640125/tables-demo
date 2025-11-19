import { useState } from 'react';
import { Modal, Button } from '../../../../../styles/design-system';
import GenericField from '../../../../../styles/design-system/fields/GenericField';
import type { FieldSchema } from '../../../../../utils/tableUtils';
import type { RowData } from '../../types';
import { normalizeOptions } from '../../utils/normalizeOptions';
import styles from '../../AgGridFieldTablePage.module.css';

type Props = {
  row: RowData;
  schema: FieldSchema[];
  onSave: (row: RowData) => void;
  onClose: () => void;
};

/**
 * Modal for editing a table row
 */
export function EditRowModal({ row, schema, onSave, onClose }: Props) {
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



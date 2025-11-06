import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, TextField, DateField, BooleanField, TextAreaField, EnumSelectField, GenericField, type FieldModel } from "../../styles/design-system";
import styles from "./Home.module.css";

export default function Home() {
  const navigate = useNavigate();
  const [textValue, setTextValue] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [booleanValue, setBooleanValue] = useState(false);
  const [textareaValue, setTextareaValue] = useState("");
  const [selectValue, setSelectValue] = useState("");

  const enumOptions = [
    { value: "option1", label: "אופציה 1" },
    { value: "option2", label: "אופציה 2" },
    { value: "option3", label: "אופציה 3" },
  ];

  // GenericField demo state
  const [edit, setEdit] = useState(true);
  const [textField, setTextField] = useState<FieldModel<string>>({
    name: 'title',
    label: 'כותרת',
    type: 'text',
    value: 'Hello'
  });
  const [dateField, setDateField] = useState<FieldModel<string>>({
    name: 'due',
    label: 'תאריך',
    type: 'date',
    value: '2025-11-01'
  });
  const [boolField, setBoolField] = useState<FieldModel<boolean>>({
    name: 'active',
    label: 'פעיל',
    type: 'boolean',
    value: true
  });
  const [textareaField, setTextareaField] = useState<FieldModel<string>>({
    name: 'desc',
    label: 'תיאור',
    type: 'textarea',
    value: '...'
  });
  const [enumField, setEnumField] = useState<FieldModel<string>>({
    name: 'status',
    label: 'סטטוס',
    type: 'enum',
    value: 'open',
    options: [
      { value: 'open', label: 'פתוח' },
      { value: 'closed', label: 'סגור' }
    ]
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>בחירת טבלה</h1>
      <div className={styles.buttons}>
        <Button onClick={() => navigate("/tanstack")}>טבלת TanStack</Button>
        <Button onClick={() => navigate("/ag-grid")}>טבלת AG Grid</Button>
        <Button onClick={() => navigate("/rdg")}>טבלת React Data Grid</Button>
      </div>

      <div className={styles.demoSection}>
        <h2 className={styles.demoHeader}>דמו רכיבי שדות</h2>
        <div className={styles.fieldsGrid}>
          <TextField
            label="שדה טקסט"
            name="text"
            value={textValue}
            onChange={(value) => setTextValue(value)}
            placeholder="הכנס טקסט..."
          />
          <DateField
            label="שדה תאריך"
            name="date"
            value={dateValue}
            onChange={(value) => setDateValue(value)}
          />
          <BooleanField
            label="שדה בוליאני"
            name="boolean"
            value={booleanValue}
            onChange={(value) => setBooleanValue(value)}
          />
          <TextAreaField
            label="שדה טקסט רב-שורתי"
            name="textarea"
            value={textareaValue}
            onChange={(value) => setTextareaValue(value)}
            placeholder="הכנס טקסט רב-שורתי..."
          />
          <EnumSelectField
            label="שדה בחירה"
            name="select"
            value={selectValue}
            onChange={(value) => setSelectValue(value)}
            options={enumOptions}
          />
        </div>
      </div>

      <div className={styles.demoSection}>
        <h2 className={styles.demoHeader}>דמו GenericField</h2>
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <Button onClick={() => setEdit(e => !e)}>
            {edit ? 'צפי' : 'עריכה'}
          </Button>
        </div>
        <div className={styles.fieldsGrid}>
          <GenericField
            model={textField}
            edit={edit}
            onChange={(v: string) => setTextField({ ...textField, value: v })}
          />
          <GenericField
            model={dateField}
            edit={edit}
            onChange={(v: string) => setDateField({ ...dateField, value: v })}
          />
          <GenericField
            model={boolField}
            edit={edit}
            onChange={(v: boolean) => setBoolField({ ...boolField, value: v })}
          />
          <GenericField
            model={textareaField}
            edit={edit}
            onChange={(v: string) => setTextareaField({ ...textareaField, value: v })}
          />
          <GenericField
            model={enumField}
            edit={edit}
            onChange={(v: string) => setEnumField({ ...enumField, value: v })}
          />
        </div>
      </div>
    </div>
  );
}


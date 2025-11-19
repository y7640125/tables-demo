export type FieldType = 'text' | 'date' | 'boolean' | 'textarea' | 'enum';

export interface EnumOption {
  value: string;
  label: string;
}

export interface FieldModel<T = unknown> {
  /** English field name (machine name / form key) */
  name: string;
  /** Hebrew display label */
  label: string;
  /** Field kind */
  type: FieldType;
  /** Current content/value */
  value: T;
  /** For enum/select fields */
  options?: EnumOption[];
}


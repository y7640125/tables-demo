import type { FieldSchema } from '../../../../utils/tableUtils';

/**
 * Get default value for a field based on its type
 */
export const getDefaultValue = (field: FieldSchema): any => {
  switch (field.type) {
    case 'boolean':
      return false;
    case 'date':
      return '';
    case 'enum':
      return field.options?.[0]?.value || '';
    case 'text':
    case 'textarea':
    default:
      return '';
  }
};




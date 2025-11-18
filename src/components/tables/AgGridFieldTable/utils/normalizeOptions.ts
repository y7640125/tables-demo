/**
 * Normalize options: handle both string arrays and object arrays
 */
export const normalizeOptions = (opts?: any[]): { value: string; label: string }[] | undefined => {
  if (!opts || opts.length === 0) return undefined;
  // Check if first option is a string or object
  if (typeof opts[0] === 'string') {
    return opts.map(opt => ({ value: opt, label: opt }));
  }
  return opts.map(opt => ({ value: opt.value, label: opt.label }));
};


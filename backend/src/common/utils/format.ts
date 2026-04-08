/**
 * Utility functions for backend formatting
 */

export function formatDate(date: any): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toISOString().split('T')[0];
}

export function formatDateTime(date: any): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toISOString().replace('T', ' ').split('.')[0];
}

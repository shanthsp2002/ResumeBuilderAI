import { StyleSheet } from '@react-pdf/renderer';

export const baseColors = {
  ink: '#111827',
  subtle: '#4b5563',
  muted: '#6b7280',
  rule: '#e5e7eb',
};

export const basePage = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: baseColors.ink,
    lineHeight: 1.4,
  },
});

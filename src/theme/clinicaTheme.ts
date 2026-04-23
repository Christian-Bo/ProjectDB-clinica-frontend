import type { CSSProperties } from 'react';

export class ClinicaPalette {
  static readonly primary = '#0F4C5C';
  static readonly primaryHover = '#0C3E4B';
  static readonly secondary = '#2EC4B6';
  static readonly secondaryHover = '#26B3A7';
  static readonly surface = '#FFFFFF';
  static readonly background = '#F7FAFC';
  static readonly text = '#1F2937';
  static readonly textMuted = '#6B7280';
  static readonly success = '#16A34A';
  static readonly warning = '#F59E0B';
  static readonly danger = '#DC2626';
  static readonly info = '#3B82F6';
  static readonly border = '#E5E7EB';
  static readonly shadow = '0 18px 50px rgba(15, 76, 92, 0.10)';
  static readonly shadowSoft = '0 8px 20px rgba(15, 76, 92, 0.08)';
}

export class ClinicaTheme {
  static toCssVariables(): CSSProperties {
    return {
      ['--color-primary' as string]: ClinicaPalette.primary,
      ['--color-primary-hover' as string]: ClinicaPalette.primaryHover,
      ['--color-secondary' as string]: ClinicaPalette.secondary,
      ['--color-secondary-hover' as string]: ClinicaPalette.secondaryHover,
      ['--color-surface' as string]: ClinicaPalette.surface,
      ['--color-background' as string]: ClinicaPalette.background,
      ['--color-text' as string]: ClinicaPalette.text,
      ['--color-text-muted' as string]: ClinicaPalette.textMuted,
      ['--color-success' as string]: ClinicaPalette.success,
      ['--color-warning' as string]: ClinicaPalette.warning,
      ['--color-danger' as string]: ClinicaPalette.danger,
      ['--color-info' as string]: ClinicaPalette.info,
      ['--color-border' as string]: ClinicaPalette.border,
      ['--shadow-primary' as string]: ClinicaPalette.shadow,
      ['--shadow-soft' as string]: ClinicaPalette.shadowSoft,
      ['--radius-xl' as string]: '24px',
      ['--radius-lg' as string]: '18px',
      ['--radius-md' as string]: '14px',
      ['--radius-sm' as string]: '10px',
      ['--container-width' as string]: '1440px',
    };
  }
}

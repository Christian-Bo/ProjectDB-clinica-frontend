import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type Option = { value: string; label: string };

export function TextField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="field-group">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function TextAreaField({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="field-group">
      <span>{label}</span>
      <textarea rows={4} {...props} />
    </label>
  );
}

export function SelectField({
  label,
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: Option[] }) {
  return (
    <label className="field-group">
      <span>{label}</span>
      <select {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        padding: '12px 14px',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        background: '#ffffff',
        fontWeight: 700,
        color: 'var(--color-text)',
      }}
    >
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

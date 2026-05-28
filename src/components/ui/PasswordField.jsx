import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * PasswordField — Reusable password input with show/hide toggle.
 * Extracted from AccountPage, AdminSettingsPage, and SuperadminSettingsPage.
 */
export default function PasswordField({ label, id, value, onChange, required = true }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-heading font-semibold text-[color:var(--color-text-muted)]">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          required={required}
          autoComplete={id === 'oldPwd' ? 'current-password' : 'new-password'}
          value={value}
          onChange={onChange}
          className="form-control font-body pr-12"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[color:var(--color-text-soft)] hover:text-[color:var(--color-heading)] transition-colors"
          aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

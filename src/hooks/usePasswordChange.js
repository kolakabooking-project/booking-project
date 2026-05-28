import { useState, useCallback } from 'react';
import { authApi } from '../lib/api';
import { toast } from 'sonner';

/**
 * PASSWORD_RULES — Shared password strength validation rules.
 * Used across AccountPage, AdminSettingsPage, and SuperadminSettingsPage.
 */
export const PASSWORD_RULES = [
  { id: 'length', label: 'Minimal 8 karakter', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Mengandung huruf besar (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Mengandung huruf kecil (a-z)', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'Mengandung angka (0-9)', test: (v) => /[0-9]/.test(v) },
];

/**
 * usePasswordChange — Hook to manage password change form state and submission.
 * Extracted from the identical logic in 3 settings pages.
 * 
 * @param {Object} options
 * @param {Function} options.showLoading - LoadingContext showLoading function
 * @param {Function} options.hideLoading - LoadingContext hideLoading function
 * @param {Function} options.onSuccess - Called after successful password change
 */
export default function usePasswordChange({ showLoading, hideLoading, onSuccess } = {}) {
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  // Computed validation state
  const passwordStrength = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(pwdForm.new),
  }));
  const allRulesPassed = passwordStrength.every((r) => r.passed);
  const passwordsMatch = pwdForm.new.length > 0 && pwdForm.new === pwdForm.confirm;
  const canSubmit = pwdForm.old.length > 0 && allRulesPassed && passwordsMatch;

  const resetForm = useCallback(() => {
    setPwdForm({ old: '', new: '', confirm: '' });
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Client-side guards
    if (!allRulesPassed) {
      toast.error('Password baru belum memenuhi semua persyaratan keamanan');
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      toast.error('Password baru dan konfirmasi tidak cocok');
      return;
    }
    if (pwdForm.old === pwdForm.new) {
      toast.error('Password baru tidak boleh sama dengan password lama');
      return;
    }

    setLoading(true);
    showLoading?.('Memperbarui password Anda...');
    try {
      await authApi.changePassword(pwdForm.old, pwdForm.new);
      toast.success('Password berhasil diperbarui');
      resetForm();
      onSuccess?.();
    } catch (err) {
      // Better Auth returns specific error messages
      const msg = err.message || 'Gagal mengubah password';
      if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong') || msg.toLowerCase().includes('invalid')) {
        toast.error('Password lama salah. Silakan coba lagi.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
      hideLoading?.();
    }
  };

  return {
    pwdForm,
    setPwdForm,
    loading,
    passwordStrength,
    allRulesPassed,
    passwordsMatch,
    canSubmit,
    resetForm,
    handlePasswordSubmit,
  };
}

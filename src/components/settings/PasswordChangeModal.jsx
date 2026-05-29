import { Lock, Check, X as XIcon } from 'lucide-react';
import Modal from '../ui/Modal';
import PasswordField from '../ui/PasswordField';
import Button from '../ui/Button';

export default function PasswordChangeModal({ 
  isOpen, 
  onClose,
  accentColor = 'djp-blue',
  // Props from usePasswordChange
  pwdForm,
  setPwdForm,
  handlePasswordSubmit,
  passwordStrength,
  passwordsMatch,
  canSubmit,
  loading
}) {
  const isRed = accentColor === 'red-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ubah Password" size="sm">
      <form onSubmit={handlePasswordSubmit} className="space-y-5">
        <div className="flex justify-center mb-4 mt-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isRed ? 'bg-red-500/10' : 'bg-djp-blue/10'}`}>
            <Lock size={24} className={isRed ? 'text-red-500' : 'text-djp-blue'} />
          </div>
        </div>

        <PasswordField
          label="Password Lama"
          id="oldPwd"
          value={pwdForm.old}
          onChange={(e) => setPwdForm({ ...pwdForm, old: e.target.value })}
        />
        <PasswordField
          label="Password Baru"
          id="newPwd"
          value={pwdForm.new}
          onChange={(e) => setPwdForm({ ...pwdForm, new: e.target.value })}
        />

        {pwdForm.new.length > 0 && (
          <div className="rounded-2xl p-3 space-y-1.5" style={{ background: 'var(--color-surface-muted)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-soft)] mb-2">Persyaratan Keamanan</p>
            {passwordStrength.map((rule) => (
              <div key={rule.id} className="flex items-center gap-2 text-xs">
                {rule.passed ? (
                  <Check size={14} className="text-success flex-shrink-0" />
                ) : (
                  <XIcon size={14} className="text-danger flex-shrink-0" />
                )}
                <span className={rule.passed ? 'text-success' : 'text-[color:var(--color-text-soft)]'}>
                  {rule.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <PasswordField
          label="Konfirmasi Password Baru"
          id="confirmPwd"
          value={pwdForm.confirm}
          onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
        />

        {pwdForm.confirm.length > 0 && (
          <div className={`flex items-center gap-2 text-xs px-1 ${passwordsMatch ? 'text-success' : 'text-danger'}`}>
            {passwordsMatch ? <Check size={14} /> : <XIcon size={14} />}
            {passwordsMatch ? 'Password cocok' : 'Password tidak cocok'}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={loading} disabled={!canSubmit}>Simpan Perubahan</Button>
        </div>
      </form>
    </Modal>
  );
}

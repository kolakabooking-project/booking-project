import { useState, useEffect, useCallback, useRef } from 'react';
import { superadminApi } from '../../lib/api';
import { useLoading } from '../../contexts/LoadingContext';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Search, Plus, Trash2, RefreshCw, ShieldCheck, UserCog, Users, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_BADGES = {
  user: { label: 'User', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  admin: { label: 'Admin', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  superadmin: { label: 'Superadmin', className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
};

export default function AccountManagementPage() {
  const { showLoading, hideLoading } = useLoading();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [createForm, setCreateForm] = useState({ nip: '', name: '', jabatan: '', role: 'user' });
  const [submitting, setSubmitting] = useState(false);

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Debounce search to avoid excessive API calls
  const searchTimeoutRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to page 1 on search change
    }, 350);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [search]);

  // Reset page when role filter changes
  useEffect(() => { setCurrentPage(1); }, [filterRole]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superadminApi.getUsers({
        search: debouncedSearch || undefined,
        role: filterRole || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      const data = res.data;
      // Server returns { users, pagination } when params provided
      if (data?.users) {
        setUsers(data.users);
        setTotalUsers(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (Array.isArray(data)) {
        // Backward compatible: array response (no pagination)
        setUsers(data);
        setTotalUsers(data.length);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
      }
    } catch (err) {
      toast.error('Gagal memuat daftar akun');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterRole, currentPage]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // currentItems = users from server (already paginated)
  const currentItems = users;

  // Create user
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.nip || !createForm.name) {
      toast.error('NIP dan Nama wajib diisi');
      return;
    }
    setSubmitting(true);
    showLoading('Membuat akun baru...');
    try {
      await superadminApi.createUser(createForm);
      toast.success(`Akun ${createForm.name} berhasil dibuat`);
      setCreateOpen(false);
      setCreateForm({ nip: '', name: '', jabatan: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal membuat akun');
    } finally {
      setSubmitting(false);
      hideLoading();
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!deleteTarget) return;
    showLoading('Menghapus akun...');
    try {
      await superadminApi.deleteUser(deleteTarget.id);
      toast.success(`Akun ${deleteTarget.name} berhasil dihapus`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus akun');
    } finally {
      hideLoading();
    }
  };

  // Reset password
  const handleReset = async () => {
    if (!resetTarget) return;
    showLoading('Mereset password akun...');
    try {
      await superadminApi.resetPassword(resetTarget.id);
      toast.success(`Password ${resetTarget.name} berhasil direset ke default`);
      setResetTarget(null);
    } catch (err) {
      toast.error(err.message || 'Gagal mereset password');
    } finally {
      hideLoading();
    }
  };

  // Change role
  const handleRoleChange = async (newRole) => {
    if (!roleTarget) return;
    showLoading(`Mengubah role menjadi ${newRole}...`);
    try {
      await superadminApi.changeRole(roleTarget.id, newRole);
      toast.success(`Role ${roleTarget.name} diubah menjadi ${newRole}`);
      setRoleTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah role');
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="pb-10">
      <PageHeader title="Manajemen Akun" subtitle={`Total ${totalUsers} akun terdaftar dalam sistem.`} />

      {/* Actions Bar */}
      <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
          <input
            type="text"
            placeholder="Cari NIP, nama, atau jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control pl-11 pr-4 py-3"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="form-control py-3 w-full sm:w-40"
        >
          <option value="">Semua Role</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
          <Plus size={16} />
          Buat Akun
        </Button>
      </div>

      {/* Users Table */}
      <div className="mt-6 rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
                <th className="px-4 py-3 font-heading font-bold text-[color:var(--color-text-soft)] text-xs uppercase tracking-wider">NIP</th>
                <th className="px-4 py-3 font-heading font-bold text-[color:var(--color-text-soft)] text-xs uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 font-heading font-bold text-[color:var(--color-text-soft)] text-xs uppercase tracking-wider hidden md:table-cell">Jabatan</th>
                <th className="px-4 py-3 font-heading font-bold text-[color:var(--color-text-soft)] text-xs uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 font-heading font-bold text-[color:var(--color-text-soft)] text-xs uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-djp-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[color:var(--color-text-soft)]">
                    {search || filterRole ? 'Tidak ada akun yang cocok dengan filter' : 'Belum ada akun terdaftar'}
                  </td>
                </tr>
              ) : (
                currentItems.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-[color:var(--color-surface-muted)] transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 font-mono text-xs text-[color:var(--color-heading)]">{u.nip}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[color:var(--color-heading)] truncate max-w-[200px]">{u.name}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-[color:var(--color-text-soft)] truncate max-w-[250px]">{u.jabatan || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGES[u.role]?.className || 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_BADGES[u.role]?.label || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'superadmin' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setRoleTarget(u)}
                            title="Ubah Role"
                            className="p-2 rounded-xl text-[color:var(--color-text-soft)] hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                          >
                            <UserCog size={15} />
                          </button>
                          <button
                            onClick={() => setResetTarget(u)}
                            title="Reset Password"
                            className="p-2 rounded-xl text-[color:var(--color-text-soft)] hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                          >
                            <RefreshCw size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            title="Hapus Akun"
                            className="p-2 rounded-xl text-[color:var(--color-text-soft)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-wider flex items-center justify-end gap-1">
                          <ShieldCheck size={13} /> Protected
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <p className="text-xs text-[color:var(--color-text-soft)]">
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} hingga {Math.min(currentPage * itemsPerPage, totalUsers)} dari {totalUsers} entri
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="text-xs py-1.5 px-3"
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="text-xs py-1.5 px-3"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
      {totalPages <= 1 && !loading && (
        <p className="mt-3 text-xs text-[color:var(--color-text-soft)] text-center">
          Menampilkan {totalUsers} akun
        </p>
      )}

      {/* Create User Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Buat Akun Baru" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="rounded-2xl p-3 text-xs" style={{ background: 'var(--color-surface-muted)' }}>
            <p className="text-[color:var(--color-text-soft)]">
              Password default: <span className="font-mono font-bold text-[color:var(--color-heading)]">Kolaka2026!</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">NIP <span className="text-danger">*</span></label>
            <input type="text" value={createForm.nip} onChange={(e) => setCreateForm({ ...createForm, nip: e.target.value })} className="form-control" placeholder="Masukkan NIP" required />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">Nama Lengkap <span className="text-danger">*</span></label>
            <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value.toUpperCase() })} className="form-control" placeholder="Masukkan nama lengkap" required />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">Jabatan</label>
            <input type="text" value={createForm.jabatan} onChange={(e) => setCreateForm({ ...createForm, jabatan: e.target.value })} className="form-control" placeholder="Contoh: Pelaksana Seksi Pelayanan" />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">Role</label>
            <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="form-control">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button type="submit" loading={submitting}>Buat Akun</Button>
          </div>
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal isOpen={!!roleTarget} onClose={() => setRoleTarget(null)} title="Ubah Role" size="sm">
        {roleTarget && (
          <div className="space-y-4">
            <p className="text-sm text-[color:var(--color-text-muted)]">
              Ubah role untuk <span className="font-bold text-[color:var(--color-heading)]">{roleTarget.name}</span>
            </p>
            <p className="text-xs text-[color:var(--color-text-soft)]">
              Role saat ini: <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${ROLE_BADGES[roleTarget.role]?.className}`}>{roleTarget.role}</span>
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleRoleChange('user')}
                disabled={roleTarget.role === 'user'}
                className={`p-4 rounded-2xl border text-center transition-all ${roleTarget.role === 'user' ? 'opacity-40 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-blue-500/5 active:scale-95'}`}
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Users size={24} className="mx-auto text-blue-500 mb-2" />
                <p className="text-sm font-bold text-[color:var(--color-heading)]">User</p>
                <p className="text-[10px] text-[color:var(--color-text-soft)]">Akses peminjaman</p>
              </button>
              <button
                onClick={() => handleRoleChange('admin')}
                disabled={roleTarget.role === 'admin'}
                className={`p-4 rounded-2xl border text-center transition-all ${roleTarget.role === 'admin' ? 'opacity-40 cursor-not-allowed' : 'hover:border-amber-500 hover:bg-amber-500/5 active:scale-95'}`}
                style={{ borderColor: 'var(--color-border)' }}
              >
                <ShieldCheck size={24} className="mx-auto text-amber-500 mb-2" />
                <p className="text-sm font-bold text-[color:var(--color-heading)]">Admin</p>
                <p className="text-[10px] text-[color:var(--color-text-soft)]">Kelola armada</p>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Akun"
        message={`Apakah Anda yakin ingin menghapus akun ${deleteTarget?.name} (NIP: ${deleteTarget?.nip})? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        variant="danger"
      />

      {/* Reset Password Confirmation */}
      <ConfirmDialog
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={handleReset}
        title="Reset Password"
        message={`Password akun ${resetTarget?.name} (NIP: ${resetTarget?.nip}) akan direset ke default (Kolaka2026!). User akan di-logout dan harus login ulang.`}
        confirmText="Ya, Reset"
        variant="warning"
      />
    </div>
  );
}

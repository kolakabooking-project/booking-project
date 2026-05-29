import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { superadminApi } from '../lib/api';
import { useLoading } from '../contexts/LoadingContext';
import useDebouncedValue from './useDebouncedValue';
import useServerPagination from './useServerPagination';

export default function useAccountManagement() {
  const { showLoading, hideLoading } = useLoading();
  
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [createForm, setCreateForm] = useState({ nip: '', name: '', jabatan: '', role: 'user' });
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const fetchUsersFn = useCallback(async (page, filters, signal) => {
    const res = await superadminApi.getUsers({
      search: filters.search || undefined,
      role: filters.role || undefined,
      page,
      limit: 10,
    });
    return res;
  }, []);

  const {
    data: users,
    loading,
    currentPage,
    totalItems: totalUsers,
    totalPages,
    handlePageChange,
    applyFilters,
    refresh
  } = useServerPagination(fetchUsersFn, filters);

  useEffect(() => {
    applyFilters({ search: debouncedSearch, role: filterRole });
  }, [debouncedSearch, filterRole, applyFilters]);

  // Apply filters when debounced search or role changes
  // useServerPagination's applyFilters will automatically reset to page 1
  // We use a useEffect to trigger applyFilters when our local filter states change
  // Note: we just call applyFilters, useServerPagination handles the aborts.
  // Actually, useServerPagination initial load covers the first render. 
  // We can just call applyFilters directly.
  
  // Create user
  const handleCreate = async (e) => {
    e.preventDefault();
    
    const cleanNip = createForm.nip.trim();
    const cleanName = createForm.name.trim().toUpperCase();
    const cleanJabatan = createForm.jabatan.trim();

    if (!cleanNip || !cleanName) {
      toast.error('NIP dan Nama wajib diisi');
      return;
    }

    // Basic NIP validation (typically 18 digits for PNS)
    if (!/^\d+$/.test(cleanNip)) {
      toast.error('Format NIP tidak valid (harus berupa angka)');
      return;
    }

    setSubmitting(true);
    showLoading('Membuat akun baru...');
    try {
      await superadminApi.createUser({
        nip: cleanNip,
        name: cleanName,
        jabatan: cleanJabatan,
        role: createForm.role
      });
      toast.success(`Akun ${cleanName} berhasil dibuat`);
      setCreateOpen(false);
      setCreateForm({ nip: '', name: '', jabatan: '', role: 'user' });
      refresh();
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
      refresh();
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
      refresh();
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah role');
    } finally {
      hideLoading();
    }
  };

  return {
    state: {
      users, loading, search, filterRole,
      createOpen, deleteTarget, resetTarget, roleTarget,
      createForm, submitting,
      currentPage, totalUsers, totalPages,
    },
    actions: {
      setSearch,
      setFilterRole,
      setCreateOpen,
      setDeleteTarget,
      setResetTarget,
      setRoleTarget,
      setCreateForm,
      handleCreate,
      handleDelete,
      handleReset,
      handleRoleChange,
      handlePageChange,
      applyFilters
    }
  };
}

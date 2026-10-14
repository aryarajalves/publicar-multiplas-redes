import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Lock,
  Ticket,
  KeyRound,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { UserModal } from './UserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { InviteModal } from './InviteModal';
import { InvitationsList } from './InvitationsList';
import { Pagination } from './Pagination';

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sub-tabs: 'users' ou 'invitations'
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'invitations'>('users');
  const [invitesRefreshTrigger, setInvitesRefreshTrigger] = useState(0);

  // Search, filter & pagination state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'editor'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sendingResetId, setSendingResetId] = useState<number | null>(null);
  const ITEMS_PER_PAGE = 20;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Não foi possível carregar a lista de usuários.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return list.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Quick metrics
  const stats = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return {
      total: list.length,
      admins: list.filter((u) => u.role === 'admin').length,
      editors: list.filter((u) => u.role === 'editor').length,
      active: list.filter((u) => u.is_active).length,
    };
  }, [users]);

  // Helper para Super Admin (único, protegido contra edição e exclusão)
  const isSuperAdmin = (u: User) =>
    u.email.toLowerCase() === 'admin@multipost.com' ||
    (u.role as string) === 'super_admin';

  const handleSendUserReset = async (user: User) => {
    if (isSuperAdmin(user)) return;
    setSendingResetId(user.id);
    try {
      const res = await api.sendUserPasswordReset(user.id);
      setFeedback({
        type: 'success',
        message: res.message || `Link de redefinição enviado para ${user.email}`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Erro ao enviar link de redefinição.';
      setFeedback({ type: 'error', message: msg });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setSendingResetId(null);
    }
  };

  // Handlers
  const handleOpenCreate = () => {
    setIsInviteModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    if (isSuperAdmin(user)) return;
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSavedUser = (savedUser: User) => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFeedback({
      type: 'success',
      message: `Usuário "${savedUser.name}" salvo com sucesso!`,
    });
    setTimeout(() => setFeedback(null), 4000);
    loadUsers();
  };

  const handleOpenDelete = (user: User) => {
    if (isSuperAdmin(user)) return;
    setUserToDelete(user);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteUser(userToDelete.id);
      setFeedback({
        type: 'success',
        message: `Usuário "${userToDelete.name}" removido com sucesso.`,
      });
      setTimeout(() => setFeedback(null), 4000);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Erro ao excluir usuário.';
      setDeleteError(detail);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  return (
    <div data-testid="users-management-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-400" />
            <span>Gestão de Usuários</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerenciamento de contas, credenciais e permissões operacionais do MultiPost
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          data-testid="btn-invite-user"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium text-xs shadow-lg shadow-pink-600/20 transition-all active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Gerar Convite</span>
        </button>
      </div>

      {/* Subtabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          data-testid="subtab-users"
          className={`pb-3 px-1 font-semibold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'users'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários Cadastrados ({users.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('invitations')}
          data-testid="subtab-invitations"
          className={`pb-3 px-1 font-semibold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'invitations'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Convites Gerados</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {error && (
        <div
          data-testid="users-error-alert"
          className="p-3.5 rounded-xl text-xs flex items-center justify-between border bg-rose-500/10 border-rose-500/30 text-rose-300"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadUsers}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-semibold"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {feedback && (
        <div
          data-testid="users-feedback-alert"
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {activeSubTab === 'users' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total de Usuários', val: stats.total, color: 'text-white' },
              { label: 'Administradores', val: stats.admins, color: 'text-pink-400' },
              { label: 'Editores de Conteúdo', val: stats.editors, color: 'text-indigo-400' },
              { label: 'Acessos Ativos', val: stats.active, color: 'text-emerald-400' },
            ].map((kpi, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                <p className="text-[11px] font-medium text-slate-400">{kpi.label}</p>
                <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.val}</p>
              </div>
            ))}
          </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            data-testid="input-search-users"
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'admin', 'editor'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              data-testid={`filter-role-${role}`}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                roleFilter === role
                  ? 'bg-pink-600/20 border-pink-500/40 text-pink-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {role === 'all' ? 'Todos' : role === 'admin' ? 'Admins' : 'Editores'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
            <span className="text-xs">Carregando usuários...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Função</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Criado em</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    data-testid={`user-row-${user.id}`}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Usuário info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500/30 to-purple-500/30 border border-pink-500/40 flex items-center justify-center text-pink-300 font-bold text-xs uppercase shrink-0">
                          {user.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{user.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Função */}
                    <td className="py-3.5 px-4">
                      {isSuperAdmin(user) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Shield className="w-3 h-3 text-amber-400" /> Super Admin
                        </span>
                      ) : user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-pink-500/15 text-pink-300 border border-pink-500/30">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          <UserCheck className="w-3 h-3" /> Editor
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 font-medium ${user.is_active ? 'text-emerald-400' : 'text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    {/* Criado em */}
                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{formatDate(user.created_at)}</span>
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right">
                      {isSuperAdmin(user) ? (
                        <span
                          data-testid={`super-admin-protected-${user.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] font-medium text-amber-300 select-none"
                          title="Super Admin é o proprietário do sistema e não pode ser editado nem excluído"
                        >
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Super Admin (Protegido)</span>
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleSendUserReset(user)}
                            disabled={sendingResetId === user.id}
                            data-testid={`btn-reset-password-${user.id}`}
                            title="Enviar link de redefinição de senha por e-mail"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {sendingResetId === user.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <KeyRound className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(user)}
                            data-testid={`btn-edit-user-${user.id}`}
                            title="Editar Usuário"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(user)}
                            data-testid={`btn-delete-user-${user.id}`}
                            title="Excluir Usuário"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center p-6">
            <Users className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">Nenhum usuário encontrado</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {search || roleFilter !== 'all' ? 'Nenhum usuário corresponde aos filtros aplicados.' : 'Cadastre o primeiro usuário do sistema para começar.'}
            </p>
          </div>
        )}

        {/* Paginação */}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-slate-800/80">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemLabel="usuários"
              testId="users-pagination"
            />
          </div>
        )}
      </div>
    </>
  )}

  {activeSubTab === 'invitations' && (
    <InvitationsList onOpenCreateInvite={handleOpenCreate} refreshTrigger={invitesRefreshTrigger} />
  )}

  {/* Modais */}
  <InviteModal
    isOpen={isInviteModalOpen}
    onClose={() => setIsInviteModalOpen(false)}
    onInviteGenerated={() => {
      setFeedback({ type: 'success', message: 'Convite gerado com sucesso! Compartilhe o link com o novo membro.' });
      setInvitesRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setFeedback(null), 5000);
    }}
  />
  <UserModal isOpen={isModalOpen} userToEdit={editingUser} onClose={() => setIsModalOpen(false)} onSuccess={handleSavedUser} />
  <DeleteUserModal isOpen={!!userToDelete} user={userToDelete} onClose={() => setUserToDelete(null)} onConfirm={handleConfirmDelete} isDeleting={isDeleting} error={deleteError} />
    </div>
  );
};

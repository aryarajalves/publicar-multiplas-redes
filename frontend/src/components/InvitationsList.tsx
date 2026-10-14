import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Search,
  Shield,
  UserCheck,
  Loader2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Invitation } from '../types';
import { api } from '../services/api';
import { DeleteInviteModal } from './DeleteInviteModal';
import { Pagination } from './Pagination';

interface InvitationsListProps {
  onOpenCreateInvite: () => void;
  refreshTrigger?: number;
}

export const InvitationsList: React.FC<InvitationsListProps> = ({
  onOpenCreateInvite,
  refreshTrigger = 0,
}) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtros, busca e paginação
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'used' | 'expired'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Cópia de link
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modal de exclusão
  const [inviteToDelete, setInviteToDelete] = useState<Invitation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadInvitations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getInvitations();
      setInvitations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Não foi possível carregar a lista de convites.');
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [refreshTrigger]);

  // Helpers de status
  const getStatus = (inv: Invitation): 'used' | 'expired' | 'pending' => {
    if (inv.is_used) return 'used';
    const expiresAt = new Date(inv.expires_at).getTime();
    if (expiresAt <= Date.now()) return 'expired';
    return 'pending';
  };

  // Métricas
  const stats = useMemo(() => {
    const list = Array.isArray(invitations) ? invitations : [];
    const total = list.length;
    const used = list.filter((i) => i.is_used).length;
    const now = Date.now();
    const pending = list.filter((i) => !i.is_used && new Date(i.expires_at).getTime() > now).length;
    const expired = list.filter((i) => !i.is_used && new Date(i.expires_at).getTime() <= now).length;
    return { total, pending, used, expired };
  }, [invitations]);

  // Convites filtrados
  const filteredInvitations = useMemo(() => {
    const list = Array.isArray(invitations) ? invitations : [];
    return list.filter((inv) => {
      const status = getStatus(inv);
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const tokenMatch = inv.token.toLowerCase().includes(term);
      const emailMatch = inv.used_by_email?.toLowerCase().includes(term);
      const roleMatch = inv.role.toLowerCase().includes(term);
      return tokenMatch || emailMatch || roleMatch;
    });
  }, [invitations, statusFilter, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const paginatedInvitations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvitations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvitations, currentPage]);

  const handleCopy = (inv: Invitation) => {
    const url = inv.invite_url || `${window.location.origin}/cadastro?token=${inv.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(inv.id);
    setFeedback({ type: 'success', message: 'Link de convite copiado com sucesso!' });
    setTimeout(() => {
      setCopiedId(null);
      setFeedback(null);
    }, 3000);
  };

  const handleConfirmDelete = async () => {
    if (!inviteToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteInvitation(inviteToDelete.id);
      setFeedback({ type: 'success', message: 'Convite revogado com sucesso.' });
      setTimeout(() => setFeedback(null), 4000);
      setInviteToDelete(null);
      loadInvitations();
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || 'Erro ao revogar convite.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatExpiry = (inv: Invitation) => {
    const status = getStatus(inv);
    try {
      const expDate = new Date(inv.expires_at);
      if (status === 'used') {
        const usedDate = inv.used_at ? new Date(inv.used_at) : null;
        return usedDate
          ? `Usado em ${usedDate.toLocaleDateString('pt-BR')} às ${usedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Já utilizado para cadastro';
      }
      if (status === 'expired') {
        return `Expirou em ${expDate.toLocaleDateString('pt-BR')} às ${expDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      const diffMs = expDate.getTime() - Date.now();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (diffHours > 24) {
        const days = Math.floor(diffHours / 24);
        return `Faltam ${days}d ${diffHours % 24}h para expirar`;
      }
      if (diffHours > 0) {
        return `Faltam ${diffHours}h ${diffMins}min para expirar`;
      }
      return `Faltam ${Math.max(diffMins, 1)}min para expirar`;
    } catch {
      return '-';
    }
  };

  return (
    <div data-testid="invitations-list-view" className="space-y-6">
      {/* Cards de Métricas de Convites */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Convites', icon: Ticket, val: stats.total, color: 'text-indigo-600', valColor: 'text-slate-900', tid: 'metric-invites-total' },
          { label: 'Faltam Expirar (Ativos)', icon: Clock, val: stats.pending, color: 'text-emerald-600', valColor: 'text-emerald-600', tid: 'metric-invites-pending' },
          { label: 'Utilizados (Usados)', icon: UserCheck, val: stats.used, color: 'text-cyan-600', valColor: 'text-cyan-700', tid: 'metric-invites-used' },
          { label: 'Já Expirados', icon: AlertCircle, val: stats.expired, color: 'text-rose-600', valColor: 'text-rose-600', tid: 'metric-invites-expired' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div data-testid={card.tid} className={`text-2xl font-bold ${card.valColor}`}>{card.val}</div>
            </div>
          );
        })}
      </div>

      {/* Alertas de Feedback */}
      {error && (
        <div
          data-testid="invitations-error-alert"
          className="p-3.5 rounded-xl text-xs flex items-center justify-between border bg-rose-50 border-rose-200 text-rose-700"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadInvitations}
            className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-semibold"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {feedback && (
        <div
          data-testid="invitations-feedback-alert"
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por e-mail ou código do convite..."
            data-testid="input-search-invites"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#ea384c] shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              data-testid="filter-invites-all"
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-[#ea384c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              data-testid="filter-invites-pending"
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'pending' ? 'bg-[#ea384c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faltam Expirar ({stats.pending})
            </button>
            <button
              onClick={() => setStatusFilter('used')}
              data-testid="filter-invites-used"
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'used' ? 'bg-[#ea384c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Utilizados ({stats.used})
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              data-testid="filter-invites-expired"
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'expired' ? 'bg-[#ea384c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expirados ({stats.expired})
            </button>
          </div>

          <button
            onClick={loadInvitations}
            title="Atualizar lista"
            data-testid="btn-refresh-invites"
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#ea384c]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabela de Convites */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {isLoading && invitations.length === 0 ? (
          <div data-testid="invites-loading" className="py-16 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-[#ea384c] animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Carregando convites...</p>
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div data-testid="invites-empty" className="py-16 text-center space-y-3">
            <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">Nenhum convite encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'Nenhum convite corresponde aos filtros aplicados.'
                : 'Ainda não foi gerado nenhum link de convite.'}
            </p>
            <button
              onClick={onOpenCreateInvite}
              data-testid="btn-empty-create-invite"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gerar Novo Convite</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table data-testid="invitations-table" className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Link / Token</th>
                  <th className="py-3 px-4">Função</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Prazo / Expiração</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedInvitations.map((inv) => {
                  const status = getStatus(inv);
                  const isCopied = copiedId === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      data-testid={`invite-row-${inv.id}`}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      {/* Link / Token */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            {inv.token.substring(0, 12)}...
                          </span>
                          <button
                            onClick={() => handleCopy(inv)}
                            title="Copiar link de cadastro"
                            data-testid={`btn-copy-invite-${inv.id}`}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Função */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${
                            inv.role === 'admin'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{inv.role === 'admin' ? 'Administrador' : 'Editor'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {status === 'pending' && (
                          <span
                            data-testid={`badge-status-pending-${inv.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Falta Expirar (Ativo)</span>
                          </span>
                        )}
                        {status === 'used' && (
                          <div className="space-y-0.5">
                            <span
                              data-testid={`badge-status-used-${inv.id}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Utilizado</span>
                            </span>
                            {inv.used_by_email && (
                              <p className="text-[10px] text-slate-500 truncate max-w-[180px]">
                                {inv.used_by_email}
                              </p>
                            )}
                          </div>
                        )}
                        {status === 'expired' && (
                          <span
                            data-testid={`badge-status-expired-${inv.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                          >
                            <AlertCircle className="w-3 h-3" />
                            <span>Expirado</span>
                          </span>
                        )}
                      </td>

                      {/* Prazo / Expiração */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatExpiry(inv)}</span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(inv)}
                            data-testid={`btn-action-copy-${inv.id}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                            title="Copiar Link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setInviteToDelete(inv)}
                            data-testid={`btn-action-delete-${inv.id}`}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            title="Revogar / Excluir Convite"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {filteredInvitations.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredInvitations.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemLabel="convites"
              testId="invitations-pagination"
            />
          </div>
        )}
      </div>

      <DeleteInviteModal
        isOpen={inviteToDelete !== null}
        invitation={inviteToDelete}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => setInviteToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

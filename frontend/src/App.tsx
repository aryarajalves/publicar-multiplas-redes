import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { Post, PlatformOverview, User } from './types';
import { Navbar } from './components/Navbar';
import { OverviewStats } from './components/OverviewStats';
import { PostFilters } from './components/PostFilters';
import { PostCard } from './components/PostCard';
import { VideoUploadModal } from './components/VideoUploadModal';
import { PostDetailsModal } from './components/PostDetailsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ConnectedAccountsModal } from './components/ConnectedAccountsModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { TermsOfServiceModal } from './components/TermsOfServiceModal';
import { Pagination } from './components/Pagination';
import { Sidebar, MainTab } from './components/Sidebar';
import { UsersManagement } from './components/UsersManagement';
import { LogsManagement } from './components/LogsManagement';
import { BackupManagement } from './components/backup/BackupManagement';

import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { LoginPage } from './pages/LoginPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { Film, PlusCircle, AlertCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export const isPrivacyRoute = (p: string) => ['/politicaprivacidade', '/politica-privacidade', '/privacy', '/privacy-policy'].includes(p.toLowerCase());
export const isTermsRoute = (p: string) => ['/termosdeuso', '/termosuso', '/termos-de-uso', '/terms', '/terms-of-service'].includes(p.toLowerCase());
export const isRegisterRoute = (p: string) => ['/cadastro', '/cadastrar', '/register', '/invite'].includes(p.toLowerCase());
export const isResetPasswordRoute = (p: string) => ['/redefinir-senha', '/redefinir-senha/', '/reset-password', '/reset-password/'].includes(p.toLowerCase());


export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('multipost_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/'
  );
  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '').toLowerCase();
        const validTabs: MainTab[] = ['posts', 'users', 'logs', 'backup'];
        if (validTabs.includes(hash as MainTab)) return hash as MainTab;
        const saved = localStorage.getItem('multipost_active_tab') as MainTab | null;
        if (saved && validTabs.includes(saved)) return saved;
      }
    } catch {}
    return 'posts';
  });
  const [posts, setPosts] = useState<Post[]>([]);

  const [totalPosts, setTotalPosts] = useState(0);
  const [page, setPage] = useState(1);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState('');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.toLowerCase());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (window.location.hash === '#privacy') {
      setIsPrivacyOpen(true);
    } else if (window.location.hash === '#terms') {
      setIsTermsOpen(true);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('tiktok_connected') === 'true') {
      setIsAccountsOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const validTabs: MainTab[] = ['posts', 'users', 'logs', 'backup'];
      if (validTabs.includes(hash as MainTab)) {
        setActiveTab(hash as MainTab);
        try {
          localStorage.setItem('multipost_active_tab', hash);
        } catch {}
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: MainTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('multipost_active_tab', tab);
      if (typeof window !== 'undefined' && window.location.hash !== `#${tab}`) {
        window.history.replaceState(null, '', `#${tab}`);
      }
    } catch {}
  };


  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * ITEMS_PER_PAGE;
      const [postsRes, overviewRes] = await Promise.all([
        api.getPosts({ search, status, platform, skip, limit: ITEMS_PER_PAGE }),
        api.getPlatformOverview(),
      ]);
      setPosts(postsRes?.items || []);
      setTotalPosts(postsRes?.total || 0);
      setOverview(overviewRes);

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Não foi possível conectar com a API do servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [search, status, platform, page]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [loadData, currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('multipost_user', JSON.stringify(user));
    } catch {}
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.logout();
    } catch {} finally {
      setCurrentUser(null);
      try {
        localStorage.removeItem('multipost_user');
        localStorage.removeItem('multipost_active_tab');
      } catch {}
      setIsLogoutOpen(false);
      setIsLoggingOut(false);

    }
  };

  // Handler para publicação imediata
  const handlePublishNow = async (post: Post) => {
    try {
      const updated = await api.publishNow(post.id);
      setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
      if (selectedPost && selectedPost.id === post.id) {
        setSelectedPost(updated);
      }
      // Atualiza métricas
      const ov = await api.getPlatformOverview();
      setOverview(ov);
    } catch (err: any) {
      alert(`Erro ao publicar: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Abre o modal de confirmação de exclusão customizado
  const handleDelete = (post: Post) => {
    setPostToDelete(post);
    setDeleteError(null);
  };

  // Executa a exclusão confirmada
  // Executa a exclusão confirmada
  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deletePost(postToDelete.id);
      if (selectedPost?.id === postToDelete.id) {
        setSelectedPost(null);
      }
      setPostToDelete(null);
      if (posts.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        loadData();
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Erro ao excluir o vídeo.';
      setDeleteError(detail);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler para novo agendamento com sucesso
  const handleUploadSuccess = () => {
    loadData();
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
  };

  const handlePlatformChange = (val: string) => {
    setPlatform(val);
    setPage(1);
  };

  if (isPrivacyRoute(currentPath)) {
    return <PrivacyPolicyPage />;
  }

  if (isTermsRoute(currentPath)) {
    return <TermsOfServicePage />;
  }

  if (isRegisterRoute(currentPath)) {
    return (
      <RegisterPage
        onGoToLogin={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  if (isResetPasswordRoute(currentPath)) {
    return (
      <ResetPasswordPage
        onGoToLogin={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  // Se o usuário não estiver autenticado, exibe a tela de login
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-row">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenAccounts={() => setIsAccountsOpen(true)}

        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenLogout={() => setIsLogoutOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {activeTab === 'posts' && (
          <Navbar
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenAccounts={() => setIsAccountsOpen(true)}
            onRefresh={loadData}
            isLoading={isLoading}
          />
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'posts' ? (
            <>
              {/* Banner de Erro de Conexão */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={loadData}
                    className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-semibold text-rose-200 transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {/* Estatísticas Gerais */}
              <OverviewStats overview={overview} />

              {/* Barra de Filtros e Busca */}
              <PostFilters
                search={search}
                onSearchChange={handleSearchChange}
                status={status}
                onStatusChange={handleStatusChange}
                platform={platform}
                onPlatformChange={handlePlatformChange}
              />

              {/* Listagem de Posts / Vídeos */}
              {posts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onViewDetails={setSelectedPost}
                        onPublishNow={handlePublishNow}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>

                  {/* Componente de Paginação Otimizada (20 vídeos por página) */}
                  <Pagination
                    currentPage={page}
                    totalItems={totalPosts}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={(newPage) => {
                      setPage(newPage);
                      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
                        try {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } catch {}
                      }
                    }}
                    isLoading={isLoading}
                  />
                </>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-4">
                    <Film className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-200">
                    Nenhuma publicação encontrada
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    {search || status || platform
                      ? 'Nenhum vídeo corresponde aos filtros selecionados. Tente ajustar a busca.'
                      : 'Comece agendando seu primeiro vídeo para o Instagram com cross-posting para YouTube e TikTok!'}
                  </p>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs shadow-lg shadow-pink-600/20 transition-all active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Agendar Primeiro Vídeo</span>
                  </button>
                </div>
              )}
            </>
          ) : activeTab === 'users' ? (
            <UsersManagement />
          ) : activeTab === 'logs' ? (
            <LogsManagement />
          ) : (
            <BackupManagement />
          )}

        </main>

        {/* Footer com Links Legais Públicos */}
        <footer className="mt-12 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-3">
            <span>&copy; {new Date().getFullYear()} MultiPost. Todos os direitos reservados.</span>
            <span>•</span>
            <a
              href="/termosdeuso"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-terms-footer"
              className="hover:text-slate-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Termos de Uso
            </a>
            <span>•</span>
            <a
              href="/politicaprivacidade"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-privacy-footer"
              className="hover:text-slate-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Política de Privacidade
            </a>
          </div>
        </footer>
      </div>

      {/* Contas & Integrações Modal */}
      <ConnectedAccountsModal
        isOpen={isAccountsOpen}
        onClose={() => setIsAccountsOpen(false)}
      />

      {/* Termos de Uso Modal */}
      <TermsOfServiceModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      {/* Política de Privacidade Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      {/* Upload Modal */}
      <VideoUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Details Modal */}
      <PostDetailsModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onPublishNow={handlePublishNow}
        onDelete={handleDelete}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!postToDelete}
        post={postToDelete}
        onClose={() => {
          if (!isDeleting) {
            setPostToDelete(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        errorMessage={deleteError}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutOpen}
        onClose={() => {
          if (!isLoggingOut) setIsLogoutOpen(false);
        }}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </div>
  );
};

export default App;

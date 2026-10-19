import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { Post, PlatformOverview, User } from './types';
import { Navbar } from './components/Navbar';
import { PostsTabContent } from './components/PostsTabContent';
import { CalendarView } from './components/calendar';
import { VideoUploadModal } from './components/VideoUploadModal';
import { PostDetailsModal } from './components/PostDetailsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ConnectedAccountsModal } from './components/ConnectedAccountsModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { TermsOfServiceModal } from './components/TermsOfServiceModal';
import { Sidebar, MainTab } from './components/Sidebar';
import { AnalyticsDashboard } from './components/analytics';
import { SettingsManagement } from './components/settings/SettingsManagement';
import { UsersManagement } from './components/UsersManagement';
import { LogsManagement } from './components/LogsManagement';
import { BackupManagement } from './components/backup/BackupManagement';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { LoginPage } from './pages/LoginPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

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
        const validTabs: MainTab[] = ['posts', 'calendar', 'analytics', 'settings', 'users', 'logs', 'backup'];
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
      const validTabs: MainTab[] = ['posts', 'analytics', 'users', 'logs', 'backup'];
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
    <div className="h-screen w-screen bg-slate-50 flex flex-row overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenAccounts={() => setIsAccountsOpen(true)}

        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenLogout={() => setIsLogoutOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overscroll-contain">
        {(activeTab === 'posts' || activeTab === 'calendar') && (
          <Navbar
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenAccounts={() => setIsAccountsOpen(true)}
            onRefresh={loadData}
            isLoading={isLoading}
          />
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'posts' ? (
            <PostsTabContent
              error={error}
              overview={overview}
              posts={posts}
              totalPosts={totalPosts}
              page={page}
              itemsPerPage={ITEMS_PER_PAGE}
              search={search}
              status={status}
              platform={platform}
              isLoading={isLoading}
              onRefresh={loadData}
              onSearchChange={handleSearchChange}
              onStatusChange={handleStatusChange}
              onPlatformChange={handlePlatformChange}
              onPageChange={(newPage) => {
                setPage(newPage);
                if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
                  try {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } catch {}
                }
              }}
              onViewDetails={setSelectedPost}
              onPublishNow={handlePublishNow}
              onDelete={handleDelete}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          ) : activeTab === 'calendar' ? (
            <CalendarView
              posts={posts}
              onSelectPost={setSelectedPost}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          ) : activeTab === 'analytics' ? (
            <AnalyticsDashboard />
          ) : activeTab === 'settings' ? (
            <SettingsManagement />
          ) : activeTab === 'users' ? (
            <UsersManagement />
          ) : activeTab === 'logs' ? (
            <LogsManagement />
          ) : (
            <BackupManagement />
          )}

        </main>

        {/* Footer com Links Legais Públicos */}
        <footer className="mt-12 py-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-3">
            <span>&copy; {new Date().getFullYear()} MultiPost. Todos os direitos reservados.</span>
            <span>•</span>
            <a
              href="/termosdeuso"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-terms-footer"
              className="hover:text-slate-800 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Termos de Uso
            </a>
            <span>•</span>
            <a
              href="/politicaprivacidade"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-privacy-footer"
              className="hover:text-slate-800 underline underline-offset-2 transition-colors cursor-pointer"
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
        onMetricsUpdated={loadData}
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

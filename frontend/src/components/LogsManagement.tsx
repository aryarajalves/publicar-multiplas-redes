import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Terminal,
  RefreshCw,
  Copy,
  Check,
  Search,
  AlertCircle,
  Server,
  Layers,
  Cpu,
  ArrowDownCircle,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { ContainerInfo, LogEntry } from '../types';

export const LogsManagement: React.FC = () => {
  const [containers, setContainers] = useState<ContainerInfo[]>([
    {
      key: 'backend',
      name: 'social-publisher-api',
      label: 'Backend (FastAPI)',
      description: 'API FastAPI, banco de dados e integrações',
      status: 'running',
    },
    {
      key: 'frontend',
      name: 'social-stream-web',
      label: 'Frontend (Nginx)',
      description: 'Servidor Nginx e aplicação React',
      status: 'running',
    },
    {
      key: 'worker',
      name: 'social-scheduler-worker',
      label: 'Scheduler Worker',
      description: 'Worker Celery/Redis de agendamento',
      status: 'running',
    },
  ]);

  const [activeContainer, setActiveContainer] = useState<'backend' | 'frontend' | 'worker'>(() => {
    try {
      const saved = localStorage.getItem('multipost_logs_container');
      if (saved === 'backend' || saved === 'frontend' || saved === 'worker') return saved;
    } catch {}
    return 'backend';
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [tail, setTail] = useState<number>(150);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const terminalViewportRef = useRef<HTMLDivElement>(null);

  // Formata o timestamp UTC do Docker para o Horário de Brasília (GMT-3)
  const formatLogTime = (isoString?: string | null): string => {
    if (!isoString) return '--:--:--';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString.slice(11, 19);
      return date.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return isoString.slice(11, 19);
    }
  };

  // Carrega status dos contêineres disponíveis
  const loadContainers = useCallback(async () => {
    try {
      const data = await api.getMonitoredContainers();
      if (data && data.length > 0) {
        setContainers(data);
      }
    } catch (err) {
      // Mantém lista padrão se falhar
    }
  }, []);

  // Carrega logs do contêiner ativo
  const loadLogs = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await api.getContainerLogs({
          container: activeContainer,
          tail: tail,
        });
        setLogs(res.entries || []);
        setLastUpdated(new Date());
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'Erro ao carregar logs do contêiner.';
        setErrorMessage(msg);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [activeContainer, tail]
  );

  useEffect(() => {
    loadContainers();
  }, [loadContainers]);

  useEffect(() => {
    loadLogs(true);
  }, [loadLogs]);

  // Auto-refresh a cada 4 segundos caso habilitado
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadLogs(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadLogs]);

  // Auto-scroll exclusivamente dentro da caixa do terminal (sem rolar a janela do navegador)
  useEffect(() => {
    if (autoScroll && terminalViewportRef.current) {
      terminalViewportRef.current.scrollTop = terminalViewportRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Ao alternar contêiner, posiciona no início sem rolar a página
  const handleSelectContainer = (key: 'backend' | 'frontend' | 'worker') => {
    setActiveContainer(key);
    try {
      localStorage.setItem('multipost_logs_container', key);
    } catch {}
    if (terminalViewportRef.current) {
      terminalViewportRef.current.scrollTop = 0;
    }
  };


  // Filtra logs por busca textual e nível
  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'ALL' && log.level !== levelFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inMsg = log.message.toLowerCase().includes(q);
      const inTs = log.timestamp ? log.timestamp.toLowerCase().includes(q) : false;
      const inLvl = log.level.toLowerCase().includes(q);
      return inMsg || inTs || inLvl;
    }
    return true;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `${l.timestamp || ''} [${l.level}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getContainerIcon = (key: string) => {
    switch (key) {
      case 'backend':
        return <Server className="w-4 h-4" />;
      case 'frontend':
        return <Layers className="w-4 h-4" />;
      case 'worker':
        return <Cpu className="w-4 h-4" />;
      default:
        return <Terminal className="w-4 h-4" />;
    }
  };

  return (
    <div data-testid="logs-management-page" className="space-y-6 animate-fade-in">
      {/* Header com Título e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 text-pink-400 border border-pink-500/30 shadow-lg shadow-pink-500/10">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Gestão de Logs
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                Docker Live
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Monitore em tempo real os eventos e fluxos dos contêineres do backend e do frontend
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Botão Auto-refresh */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            data-testid="btn-toggle-autorefresh"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Alternar atualização automática"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{autoRefresh ? 'Auto (4s)' : 'Pausado'}</span>
          </button>

          {/* Seletor de Linhas */}
          <select
            value={tail}
            onChange={(e) => setTail(Number(e.target.value))}
            data-testid="select-logs-tail"
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 outline-none focus:border-pink-500 transition-colors"
          >
            <option value={50}>50 linhas</option>
            <option value={150}>150 linhas</option>
            <option value={300}>300 linhas</option>
            <option value={500}>500 linhas</option>
          </select>

          {/* Botão Copiar */}
          <button
            onClick={handleCopyLogs}
            disabled={filteredLogs.length === 0}
            data-testid="btn-copy-logs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all disabled:opacity-40 cursor-pointer"
            title="Copiar logs visíveis"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          {/* Botão Atualizar Agora */}
          <button
            onClick={() => loadLogs(true)}
            disabled={isLoading}
            data-testid="btn-refresh-logs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-pink-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Subabas de Seleção de Contêineres */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {containers.map((c) => {
          const isSelected = activeContainer === c.key;
          return (
            <button
              key={c.key}
              onClick={() => handleSelectContainer(c.key as any)}
              data-testid={`tab-container-${c.key}`}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-slate-900/90 border-pink-500/50 shadow-lg shadow-pink-500/10'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-xl ${
                    isSelected
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      : 'bg-slate-800/60 text-slate-400'
                  }`}
                >
                  {getContainerIcon(c.key)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {c.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate font-mono">{c.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400">Ativo</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nos logs..."
            data-testid="input-filter-logs"
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                data-testid={`filter-level-${lvl.toLowerCase()}`}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  levelFilter === lvl
                    ? lvl === 'ERROR'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : lvl === 'WARN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl === 'ALL' ? 'Todos' : lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            data-testid="btn-toggle-autoscroll"
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              autoScroll
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Auto-rolar para as linhas mais recentes"
          >
            <ArrowDownCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal / Visualizador de Logs */}
      <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Barra Superior do Terminal */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="font-mono text-[11px] text-slate-300 font-semibold">
              docker logs {containers.find((c) => c.key === activeContainer)?.name} --tail={tail}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span>
              Exibindo: <strong className="text-white">{filteredLogs.length}</strong> linhas
            </span>
            <span>•</span>
            <span>
              Última sincronização:{' '}
              <strong className="text-slate-300">
                {lastUpdated.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </strong>
            </span>
          </div>
        </div>

        {/* Mensagem de Erro Caso Ocorra */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border-b border-red-800/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Área Rolável de Logs */}
        <div
          ref={terminalViewportRef}
          data-testid="logs-terminal-viewport"
          className="p-4 font-mono text-[11px] leading-relaxed max-h-[520px] min-h-[300px] overflow-y-auto space-y-1 select-text scrollbar-thin scrollbar-thumb-slate-800"
        >
          {isLoading && logs.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-pink-500" />
              <span className="text-xs">Conectando aos logs do contêiner...</span>
            </div>
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => {
              const isError = log.level === 'ERROR';
              const isWarn = log.level === 'WARN';
              const isInfo = log.level === 'INFO';

              return (
                <div
                  key={index}
                  className={`group flex items-start gap-2.5 py-0.5 px-2 rounded hover:bg-slate-900/60 transition-colors ${
                    isError
                      ? 'bg-red-950/20 text-red-300'
                      : isWarn
                      ? 'bg-amber-950/15 text-amber-300'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 select-none text-[10px] w-8 shrink-0 text-right">
                    {index + 1}
                  </span>

                  {log.timestamp && (
                    <span
                      title={`UTC: ${log.timestamp} | Brasília: ${formatLogTime(log.timestamp)}`}
                      className="text-slate-500 text-[10px] shrink-0 font-mono"
                    >
                      {formatLogTime(log.timestamp)}
                    </span>
                  )}

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase ${
                      isError
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : isWarn
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : isInfo
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {log.level}
                  </span>

                  <span className="break-all whitespace-pre-wrap flex-1">{log.message}</span>
                </div>
              );
            })
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-slate-500">
              <Filter className="w-6 h-6 mb-2 text-slate-600" />
              <p className="text-xs font-semibold text-slate-400">Nenhum log corresponde aos filtros.</p>
              <p className="text-[11px] text-slate-600">Tente limpar a busca ou selecionar outro nível.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

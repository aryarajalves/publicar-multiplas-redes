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

  // Auto-scroll exclusivamente dentro da caixa do terminal
  useEffect(() => {
    if (autoScroll && terminalViewportRef.current) {
      terminalViewportRef.current.scrollTop = terminalViewportRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-50 text-[#ea384c] border border-rose-200 shadow-2xs">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Gestão de Logs
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-[#ea384c] border border-rose-200">
                Docker Live
              </span>
            </h1>
            <p className="text-xs text-slate-500">
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
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
            title="Alternar atualização automática"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{autoRefresh ? 'Auto (4s)' : 'Pausado'}</span>
          </button>

          {/* Seletor de Linhas */}
          <select
            value={tail}
            onChange={(e) => setTail(Number(e.target.value))}
            data-testid="select-logs-tail"
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 outline-none focus:border-[#ea384c] transition-colors cursor-pointer shadow-2xs"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-medium transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
            title="Copiar logs visíveis"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          {/* Botão Atualizar Agora */}
          <button
            onClick={() => loadLogs(true)}
            disabled={isLoading}
            data-testid="btn-refresh-logs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ea384c] hover:bg-[#d82a3e] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
                isSelected
                  ? 'bg-white border-[#ea384c] ring-1 ring-[#ea384c]/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-xl ${
                    isSelected
                      ? 'bg-rose-50 text-[#ea384c] border border-rose-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {getContainerIcon(c.key)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {c.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate font-mono">{c.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-700">Ativo</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nos logs..."
            data-testid="input-filter-logs"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#ea384c] focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                data-testid={`filter-level-${lvl.toLowerCase()}`}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  levelFilter === lvl
                    ? lvl === 'ERROR'
                      ? 'bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs'
                      : lvl === 'WARN'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs'
                      : lvl === 'INFO'
                      ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-2xs'
                      : 'bg-white text-slate-900 border border-slate-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                ? 'bg-rose-50 border-rose-300 text-[#ea384c]'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
            }`}
            title="Auto-rolar para as linhas mais recentes"
          >
            <ArrowDownCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal / Visualizador de Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Barra Superior do Terminal */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            </div>
            <span className="font-mono text-[11px] text-slate-700 font-semibold">
              docker logs {containers.find((c) => c.key === activeContainer)?.name} --tail={tail}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span>
              Exibindo: <strong className="text-slate-800">{filteredLogs.length}</strong> linhas
            </span>
            <span>•</span>
            <span>
              Última sincronização:{' '}
              <strong className="text-slate-700">
                {lastUpdated.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </strong>
            </span>
          </div>
        </div>

        {/* Mensagem de Erro Caso Ocorra */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Área Rolável de Logs */}
        <div
          ref={terminalViewportRef}
          data-testid="logs-terminal-viewport"
          className="p-4 font-mono text-[11px] leading-relaxed max-h-[520px] min-h-[300px] overflow-y-auto space-y-1 select-text bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200"
        >
          {isLoading && logs.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-[#ea384c]" />
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
                  className={`group flex items-start gap-2.5 py-0.5 px-2 rounded hover:bg-slate-200/60 transition-colors ${
                    isError
                      ? 'bg-rose-50/90 text-rose-900 border-l-2 border-rose-500'
                      : isWarn
                      ? 'bg-amber-50/90 text-amber-900 border-l-2 border-amber-500'
                      : 'text-slate-700'
                  }`}
                >
                  <span className="text-slate-400 select-none text-[10px] w-8 shrink-0 text-right">
                    {index + 1}
                  </span>

                  {log.timestamp && (
                    <span
                      title={`UTC: ${log.timestamp} | Brasília: ${formatLogTime(log.timestamp)}`}
                      className="text-slate-400 text-[10px] shrink-0 font-mono"
                    >
                      {formatLogTime(log.timestamp)}
                    </span>
                  )}

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase ${
                      isError
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : isWarn
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : isInfo
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {log.level}
                  </span>

                  <span className="break-all whitespace-pre-wrap flex-1">{log.message}</span>
                </div>
              );
            })
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-slate-400">
              <Filter className="w-6 h-6 mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Nenhum log corresponde aos filtros.</p>
              <p className="text-[11px] text-slate-400">Tente limpar a busca ou selecionar outro nível.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

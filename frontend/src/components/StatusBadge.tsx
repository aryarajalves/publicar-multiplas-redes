import React from 'react';
import { PostStatus, PublicationStatus } from '../types';
import { Clock, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

interface Props {
  status: PostStatus | PublicationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const normalized = status.toLowerCase();

  let label = 'Desconhecido';
  let classes = 'bg-slate-800 text-slate-300 border-slate-700';
  let Icon = Clock;

  switch (normalized) {
    case 'scheduled':
    case 'pending':
      label = normalized === 'scheduled' ? 'Agendado' : 'Pendente';
      classes = 'bg-blue-950/70 text-blue-300 border-blue-500/40';
      Icon = Clock;
      break;
    case 'publishing':
    case 'in_progress':
      label = 'Publicando...';
      classes = 'bg-purple-950/70 text-purple-300 border-purple-500/40 animate-pulse';
      Icon = Loader2;
      break;
    case 'published':
      label = 'Publicado';
      classes = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
      Icon = CheckCircle2;
      break;
    case 'failed':
      label = 'Falhou';
      classes = 'bg-rose-950/70 text-rose-300 border-rose-500/40';
      Icon = AlertTriangle;
      break;
    case 'cancelled':
    case 'skipped':
      label = normalized === 'cancelled' ? 'Cancelado' : 'Ignorado';
      classes = 'bg-slate-800/80 text-slate-400 border-slate-700';
      Icon = XCircle;
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm font-medium';

  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center gap-1.5 rounded-full border ${classes} ${sizeClasses}`}
    >
      <Icon className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${normalized === 'publishing' || normalized === 'in_progress' ? 'animate-spin' : ''}`} />
      <span>{label}</span>
    </span>
  );
};

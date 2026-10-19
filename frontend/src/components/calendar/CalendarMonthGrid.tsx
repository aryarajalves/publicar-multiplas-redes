import React from 'react';
import { Post } from '../../types';
import { CalendarPostPill } from './CalendarPostPill';
import { Plus } from 'lucide-react';

interface Props {
  currentDate: Date;
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectDay?: (date: Date) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const CalendarMonthGrid: React.FC<Props> = ({
  currentDate,
  posts,
  onSelectPost,
  onSelectDay,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Primeiro dia do mês e total de dias do mês
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo, 6 = Sábado
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isToday = (d: number, m: number, y: number) => {
    return (
      today.getDate() === d &&
      today.getMonth() === m &&
      today.getFullYear() === y
    );
  };

  // Gerar array com todos os slots da grade (incluindo dias do mês anterior e próximo)
  const days: Array<{
    dayNumber: number;
    monthOffset: number; // -1 = prev, 0 = current, 1 = next
    fullDate: Date;
  }> = [];

  // Dias do mês anterior
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    days.push({
      dayNumber: d,
      monthOffset: -1,
      fullDate: new Date(year, month - 1, d),
    });
  }

  // Dias do mês atual
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      dayNumber: i,
      monthOffset: 0,
      fullDate: new Date(year, month, i),
    });
  }

  // Dias do próximo mês para completar múltiplos de 7 (35 ou 42 slots)
  const remainingSlots = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingSlots; i++) {
    days.push({
      dayNumber: i,
      monthOffset: 1,
      fullDate: new Date(year, month + 1, i),
    });
  }

  // Mapear posts por data formatada 'YYYY-MM-DD'
  const postsByDate = posts.reduce<Record<string, Post[]>>((acc, post) => {
    if (!post.scheduled_at) return acc;
    try {
      const d = new Date(post.scheduled_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(post);
    } catch {}
    return acc;
  }, {});

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Cabeçalho dos Dias da Semana */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold text-slate-500 py-3">
        {WEEKDAYS.map((dayName, idx) => (
          <div key={dayName} className={`${idx === 0 || idx === 6 ? 'text-slate-400' : ''}`}>
            {dayName}
          </div>
        ))}
      </div>

      {/* Grade de Dias */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-100/50">
        {days.map((slot, index) => {
          const dateKey = `${slot.fullDate.getFullYear()}-${String(
            slot.fullDate.getMonth() + 1
          ).padStart(2, '0')}-${String(slot.fullDate.getDate()).padStart(2, '0')}`;

          const dayPosts = postsByDate[dateKey] || [];
          const isCurrent = slot.monthOffset === 0;
          const todayCell = isToday(
            slot.dayNumber,
            slot.fullDate.getMonth(),
            slot.fullDate.getFullYear()
          );

          return (
            <div
              key={`${dateKey}-${index}`}
              data-testid={`calendar-day-cell-${dateKey}`}
              className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors relative group ${
                isCurrent ? 'bg-white' : 'bg-slate-50/60 text-slate-400'
              } ${todayCell ? 'ring-2 ring-[#ea384c]/20 ring-inset bg-red-50/10' : ''}`}
            >
              {/* Topo da Célula: Número do Dia & Botão de Adicionar */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                    todayCell
                      ? 'bg-[#ea384c] text-white shadow-xs'
                      : isCurrent
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {slot.dayNumber}
                </span>

                {onSelectDay && (
                  <button
                    type="button"
                    onClick={() => onSelectDay(slot.fullDate)}
                    title={`Agendar para ${slot.dayNumber}/${slot.fullDate.getMonth() + 1}`}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lista de Posts no Dia */}
              <div className="flex-1 space-y-1.5 overflow-hidden">
                {dayPosts.slice(0, 3).map((post) => (
                  <CalendarPostPill key={post.id} post={post} onClick={onSelectPost} />
                ))}

                {dayPosts.length > 3 && (
                  <div
                    onClick={() => onSelectDay && onSelectDay(slot.fullDate)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 text-center py-0.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition-colors"
                  >
                    +{dayPosts.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

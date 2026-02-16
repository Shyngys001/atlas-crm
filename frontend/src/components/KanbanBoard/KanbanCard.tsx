import { useDraggable } from '@dnd-kit/core';
import type { Lead } from '../../api/types';
import { HiOutlinePhone, HiOutlineClock } from 'react-icons/hi2';

interface Props {
  lead: Lead;
  onClick?: () => void;
  overlay?: boolean;
}

const sourceIcon: Record<string, string> = {
  whatsapp: '💬',
  sipuni: '📞',
  website: '🌐',
  manual: '✏️',
};

export default function KanbanCard({ lead, onClick, overlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const timeAgo = lead.last_activity_at
    ? formatTimeAgo(new Date(lead.last_activity_at))
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg p-3 cursor-pointer border border-gray-200 dark:border-gray-700 transition-all ${
        isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
      } ${overlay ? 'shadow-xl rotate-2 scale-105 border-primary-300' : ''}`}
    >
      {/* Name + source */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="font-medium text-[13px] text-gray-800 dark:text-gray-200 truncate leading-tight">{lead.name}</h4>
        <span className="text-xs flex-shrink-0" title={lead.source}>{sourceIcon[lead.source] || '📋'}</span>
      </div>

      {/* Phone */}
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 mb-2">
        <HiOutlinePhone size={12} />
        <span>{lead.phone}</span>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        {lead.manager ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-[9px] font-semibold flex-shrink-0">
              {lead.manager.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
              {lead.manager.name.split(' ')[0]}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-gray-300 dark:text-gray-600">Не назначен</span>
        )}

        {timeAgo && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <HiOutlineClock size={11} />
            <span>{timeAgo}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          {lead.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium">
              {String(tag)}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-[10px] text-gray-400">+{lead.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Returning badge */}
      {lead.is_returning && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="badge-yellow text-[10px]">Вернувшийся</span>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'сейчас';
  if (diff < 3600) return `${Math.floor(diff / 60)}м`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ч`;
  return `${Math.floor(diff / 86400)}д`;
}

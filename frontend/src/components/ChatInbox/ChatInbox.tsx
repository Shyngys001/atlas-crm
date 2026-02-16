import { useState, useEffect } from 'react';
import { messagesApi } from '../../api/endpoints';
import type { Dialog } from '../../api/types';
import { useWSStore } from '../../store/wsStore';
import { HiOutlineChatBubbleLeftRight, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

interface Props {
  onSelect: (leadId: number) => void;
  selectedLeadId: number | null;
}

export default function ChatInbox({ onSelect, selectedLeadId }: Props) {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const lastEvent = useWSStore((s) => s.lastEvent);

  const fetchDialogs = () => {
    messagesApi.dialogs()
      .then(setDialogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDialogs(); }, []);

  useEffect(() => {
    if (lastEvent?.event === 'message:new') fetchDialogs();
  }, [lastEvent]);

  const filtered = dialogs.filter(
    (d) => d.lead_name.toLowerCase().includes(search.toLowerCase()) || d.lead_phone.includes(search)
  );

  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 dark:text-white text-sm">Сообщения</h2>
          <span className="badge-gray text-[10px]">{dialogs.length} чатов</span>
        </div>
        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            className="input-field pl-9 py-2 text-[13px]"
            placeholder="Поиск переписок..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Dialog list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading && (
          <div className="p-4 space-y-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton h-2.5 w-32" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state py-16">
            <HiOutlineChatBubbleLeftRight size={32} className="text-gray-300 dark:text-gray-600" />
            <p className="text-sm mt-2">{search ? 'Не найдено' : 'Нет переписок'}</p>
          </div>
        )}

        {filtered.map((d) => (
          <button
            key={d.lead_id}
            onClick={() => onSelect(d.lead_id)}
            className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 transition-all ${
              selectedLeadId === d.lead_id
                ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 relative">
                {d.lead_name.charAt(0)}
                {d.unread_count > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                    {d.unread_count > 9 ? '9+' : d.unread_count}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[13px] truncate ${d.unread_count > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                    {d.lead_name}
                  </span>
                  {d.last_message_at && (
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                      {formatChatTime(new Date(d.last_message_at))}
                    </span>
                  )}
                </div>
                <p className={`text-[12px] truncate ${d.unread_count > 0 ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                  {d.last_message || 'Нет сообщений'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatChatTime(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

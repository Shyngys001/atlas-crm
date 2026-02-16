import { useState, useEffect } from 'react';
import { callsApi } from '../../api/endpoints';
import type { Call } from '../../api/types';
import { useWSStore } from '../../store/wsStore';
import {
  HiOutlinePhoneArrowDownLeft, HiOutlinePhoneArrowUpRight,
  HiOutlinePlayCircle, HiOutlinePhone, HiOutlineFunnel,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function CallsTable() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const lastEvent = useWSStore((s) => s.lastEvent);

  const fetchCalls = () => {
    setLoading(true);
    callsApi.list(filter ? { direction: filter } : {})
      .then(setCalls)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCalls(); }, [filter]);

  useEffect(() => {
    if (lastEvent?.event === 'call:new') fetchCalls();
  }, [lastEvent]);

  const formatDuration = (s: number) => {
    if (s === 0) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const resultBadge = (result: string | null) => {
    if (!result) return <span className="badge-gray">—</span>;
    const map: Record<string, string> = {
      answered: 'badge-green',
      no_answer: 'badge-red',
      busy: 'badge-yellow',
      voicemail: 'badge-purple',
    };
    return <span className={map[result] || 'badge-gray'}>{result.replace('_', ' ')}</span>;
  };

  // Stats
  const totalCalls = calls.length;
  const incoming = calls.filter((c) => c.direction === 'in').length;
  const outgoing = calls.filter((c) => c.direction === 'out').length;
  const answered = calls.filter((c) => c.result === 'answered').length;
  const avgDuration = totalCalls > 0
    ? Math.round(calls.reduce((sum, c) => sum + c.duration, 0) / totalCalls)
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Всего звонков" value={totalCalls} />
        <MiniStat label="Входящие" value={incoming} color="text-emerald-600" />
        <MiniStat label="Исходящие" value={outgoing} color="text-blue-600" />
        <MiniStat label="Ср. длительность" value={formatDuration(avgDuration)} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-gray-400">
          <HiOutlineFunnel size={15} />
          <span className="text-xs font-medium">Фильтр:</span>
        </div>
        {['', 'in', 'out'].map((val) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === val
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {val === '' ? 'Все' : val === 'in' ? 'Входящие' : 'Исходящие'}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{calls.length} записей</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4,5].map((i) => <div key={i} className="skeleton h-12 w-full rounded" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3 pl-5">Направление</th>
                  <th className="text-left p-3">Клиент</th>
                  <th className="text-left p-3">Менеджер</th>
                  <th className="text-left p-3">Длительность</th>
                  <th className="text-left p-3">Результат</th>
                  <th className="text-left p-3">Дата</th>
                  <th className="text-left p-3 pr-5">Запись</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {calls.map((call) => (
                  <tr key={call.id} className="table-row">
                    <td className="p-3 pl-5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        call.direction === 'in'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      }`}>
                        {call.direction === 'in'
                          ? <HiOutlinePhoneArrowDownLeft size={16} />
                          : <HiOutlinePhoneArrowUpRight size={16} />
                        }
                      </div>
                    </td>
                    <td className="p-3">
                      {call.lead_name ? (
                        <span className="font-medium text-gray-800 dark:text-gray-200">{call.lead_name}</span>
                      ) : (
                        <span className="text-gray-400">Неизвестный</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500">{call.manager_name || '—'}</td>
                    <td className="p-3">
                      <span className="font-mono text-gray-600 dark:text-gray-400 text-[13px]">{formatDuration(call.duration)}</span>
                    </td>
                    <td className="p-3">{resultBadge(call.result)}</td>
                    <td className="p-3">
                      <div className="text-gray-500 text-xs">
                        <p>{new Date(call.created_at).toLocaleDateString()}</p>
                        <p className="text-gray-400">{new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </td>
                    <td className="p-3 pr-5">
                      {call.recording_url ? (
                        <a
                          href={call.recording_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <HiOutlinePlayCircle size={16} />
                          Слушать
                        </a>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs">Нет записи</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {calls.length === 0 && (
              <div className="empty-state py-12">
                <HiOutlinePhone size={32} />
                <p className="text-sm mt-2">Звонков не найдено</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${color || 'text-gray-800 dark:text-white'}`}>{value}</p>
    </div>
  );
}

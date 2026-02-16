import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi, leadsApi, pipelinesApi } from '../api/endpoints';
import type { AnalyticsSummary, Lead, Pipeline } from '../api/types';
import { useAuthStore } from '../store/authStore';
import {
  HiOutlineUsers, HiOutlineChatBubbleLeftRight, HiOutlinePhone,
  HiOutlineArrowTrendingUp, HiOutlineViewColumns, HiOutlineArrowRight,
  HiOutlineClock,
} from 'react-icons/hi2';

const sourceLabels: Record<string, string> = { whatsapp: 'WhatsApp', manual: 'Вручную', website: 'Сайт', sipuni: 'Sipuni' };

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'head';
  const navigate = useNavigate();

  useEffect(() => {
    const promises: Promise<void>[] = [
      leadsApi.list({ limit: 5 }).then(setRecentLeads).catch(() => {}),
      pipelinesApi.list().then(setPipelines).catch(() => {}),
    ];
    if (isAdmin) promises.push(analyticsApi.summary().then(setData).catch(() => {}));
    Promise.all(promises).finally(() => setLoading(false));
  }, []);

  const pipeline = pipelines.find((p) => p.is_default) || pipelines[0];
  const sourceColors: Record<string, string> = { whatsapp: 'bg-emerald-500', manual: 'bg-blue-500', website: 'bg-purple-500', sipuni: 'bg-amber-500' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">{isAdmin ? 'Дашборд' : `Привет, ${user?.name?.split(' ')[0]}`}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{isAdmin ? 'Общая статистика CRM' : 'Ваш дневной обзор'}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="card p-5"><div className="skeleton h-16 w-full" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<HiOutlineUsers size={22} />} label="Всего лидов" value={data?.total_leads ?? recentLeads.length} color="primary" onClick={() => navigate('/clients')} />
          <StatCard icon={<HiOutlineChatBubbleLeftRight size={22} />} label="Сообщения" value={data?.total_messages ?? 0} color="green" onClick={() => navigate('/chats')} />
          <StatCard icon={<HiOutlinePhone size={22} />} label="Звонки" value={data?.total_calls ?? 0} color="blue" onClick={() => navigate('/calls')} />
          <StatCard icon={<HiOutlineArrowTrendingUp size={22} />} label="Конверсия" value={data ? `${data.conversion_rate}%` : '—'} color="purple" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {pipeline && (
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2"><HiOutlineViewColumns size={18} className="text-gray-400" /><h3 className="font-semibold text-gray-800 dark:text-white text-sm">Обзор воронки</h3></div>
              <button onClick={() => navigate('/kanban')} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">Открыть <HiOutlineArrowRight size={14} /></button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {pipeline.stages.map((stage) => {
                  const count = data?.leads_by_stage?.[String(stage.id)] ?? 0;
                  return (
                    <div key={stage.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} /><span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{stage.name}</span></div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700"><h3 className="font-semibold text-gray-800 dark:text-white text-sm">Источники лидов</h3></div>
            <div className="p-5 space-y-4">
              {Object.entries(data.leads_by_source).map(([source, count]) => {
                const pct = data.total_leads ? Math.round((count / data.total_leads) * 100) : 0;
                return (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${sourceColors[source] || 'bg-gray-400'}`} /><span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sourceLabels[source] || source}</span></div>
                      <span className="text-sm text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${sourceColors[source] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
              {Object.keys(data.leads_by_source).length === 0 && <p className="text-sm text-gray-400 text-center py-4">Нет данных</p>}
            </div>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2"><HiOutlineClock size={18} className="text-gray-400" /><h3 className="font-semibold text-gray-800 dark:text-white text-sm">Последние лиды</h3></div>
          <button onClick={() => navigate('/clients')} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">Все клиенты <HiOutlineArrowRight size={14} /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="table-header"><th className="text-left p-3 pl-5">Имя</th><th className="text-left p-3">Телефон</th><th className="text-left p-3">Источник</th><th className="text-left p-3">Этап</th><th className="text-left p-3">Менеджер</th><th className="text-left p-3 pr-5">Дата</th></tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentLeads.map((lead) => (
                <tr key={lead.id} className="table-row cursor-pointer" onClick={() => navigate('/clients')}>
                  <td className="p-3 pl-5"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-semibold flex-shrink-0">{lead.name.charAt(0)}</div><span className="font-medium text-gray-800 dark:text-gray-200">{lead.name}</span></div></td>
                  <td className="p-3 text-gray-500">{lead.phone}</td>
                  <td className="p-3"><span className="badge-gray">{sourceLabels[lead.source] || lead.source}</span></td>
                  <td className="p-3">{lead.stage && <span className="badge text-white text-[11px]" style={{ backgroundColor: lead.stage.color }}>{lead.stage.name}</span>}</td>
                  <td className="p-3 text-gray-500">{lead.manager?.name || '—'}</td>
                  <td className="p-3 pr-5 text-gray-400 text-xs">{new Date(lead.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentLeads.length === 0 && <div className="empty-state py-10"><HiOutlineUsers size={28} /><p className="text-sm mt-2">Пока нет лидов</p></div>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, onClick }: { icon: React.ReactNode; label: string; value: string | number; color: string; onClick?: () => void }) {
  const styles: Record<string, { bg: string; icon: string }> = {
    primary: { bg: 'bg-primary-50 dark:bg-primary-900/20', icon: 'text-primary-600 dark:text-primary-400' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400' },
  };
  const s = styles[color];
  return (
    <div onClick={onClick} className={`card p-5 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}>
      <div className="flex items-start justify-between">
        <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p><p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p></div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.icon}`}>{icon}</div>
      </div>
    </div>
  );
}

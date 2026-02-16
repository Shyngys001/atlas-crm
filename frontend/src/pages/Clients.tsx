import { useState, useEffect } from 'react';
import { leadsApi } from '../api/endpoints';
import type { Lead } from '../api/types';
import DealDrawer from '../components/DealDrawer/DealDrawer';
import {
  HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineXMark,
  HiOutlinePhone, HiOutlineUserGroup, HiOutlineGlobeAlt,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const sourceConfig: Record<string, { icon: string; class: string }> = {
  whatsapp: { icon: '💬', class: 'badge-green' },
  sipuni:   { icon: '📞', class: 'badge-blue' },
  website:  { icon: '🌐', class: 'badge-purple' },
  manual:   { icon: '✏️', class: 'badge-gray' },
};

export default function Клиентs() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', source: 'manual', language: 'ru' });
  const [loading, setLoading] = useState(true);

  const fetchLeads = () => {
    setLoading(true);
    leadsApi.list(search ? { q: search } : {})
      .then(setLeads)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(fetchLeads, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Имя и телефон обязательны');
      return;
    }
    setCreating(true);
    try {
      await leadsApi.create(form);
      toast.success('Лид создан');
      setShowCreate(false);
      setForm({ name: '', phone: '', source: 'manual', language: 'ru' });
      fetchLeads();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  // Stats
  const totalLeads = leads.length;
  const bySource = leads.reduce((acc, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc; }, {} as Record<string, number>);
  const assigned = leads.filter((l) => l.manager_id).length;
  const returning = leads.filter((l) => l.is_returning).length;

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Всего лидов" value={totalLeads} icon={<HiOutlineUserGroup size={18} />} />
        <MiniStat label="Назначены" value={assigned} color="text-emerald-600" icon={<span className="text-emerald-600">✓</span>} />
        <MiniStat label="Вернувшиеся" value={returning} color="text-amber-600" icon={<span className="text-amber-500">↩</span>} />
        <MiniStat label="Источники" value={Object.keys(bySource).length} color="text-blue-600" icon={<HiOutlineGlobeAlt size={18} className="text-blue-600" />} />
      </div>

      {/* Search + Create */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input-field pl-9 py-2.5"
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <HiOutlineXMark size={16} />
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400">{leads.length} записей</span>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`ml-auto flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
            showCreate
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              : 'btn-primary'
          }`}
        >
          {showCreate ? <HiOutlineXMark size={16} /> : <HiOutlinePlus size={16} />}
          {showCreate ? 'Отмена' : 'Новый лид'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-5 animate-fade-in-up">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Создать лид</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="input-label">ФИО</label>
              <input className="input-field" placeholder="Иван Петров" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Телефон</label>
              <input className="input-field" placeholder="+7 700 123 4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Источник</label>
              <select className="input-field" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="manual">Вручную</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="website">Сайт</option>
                <option value="sipuni">Sipuni</option>
              </select>
            </div>
            <div>
              <label className="input-label">Язык</label>
              <select className="input-field" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                <option value="ru">Русский</option>
                <option value="kz">Казахский</option>
                <option value="en">Английский</option>
              </select>
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary mt-4 w-full sm:w-auto">
            {creating ? 'Создание...' : 'Create Lead'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-14 w-full rounded" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3 pl-5">Клиент</th>
                  <th className="text-left p-3">Телефон</th>
                  <th className="text-left p-3">Источник</th>
                  <th className="text-left p-3">Этап</th>
                  <th className="text-left p-3">Менеджер</th>
                  <th className="text-left p-3">Язык</th>
                  <th className="text-left p-3 pr-5">Обновлено</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="table-row cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="p-3 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200 text-[13px]">{lead.name}</span>
                          {lead.is_returning && (
                            <span className="ml-2 badge-yellow text-[9px]">Вернувшиеся</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <HiOutlinePhone size={13} />
                        <span className="font-mono text-[13px]">{lead.phone}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${sourceConfig[lead.source]?.class || 'badge-gray'}`}>
                        {sourceConfig[lead.source]?.icon} {lead.source}
                      </span>
                    </td>
                    <td className="p-3">
                      {lead.stage ? (
                        <span
                          className="text-[11px] px-2.5 py-1 rounded-full text-white font-medium"
                          style={{ backgroundColor: lead.stage.color }}
                        >
                          {lead.stage.name}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {lead.manager ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-[9px] font-semibold flex-shrink-0">
                            {lead.manager.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-gray-600 dark:text-gray-400 text-[13px] truncate max-w-[100px]">
                            {lead.manager.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs">Не назначен</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-[11px] uppercase font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {lead.language}
                      </span>
                    </td>
                    <td className="p-3 pr-5">
                      <div className="text-gray-500 text-xs">
                        <p>{new Date(lead.updated_at).toLocaleDateString()}</p>
                        <p className="text-gray-400">{new Date(lead.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 && (
              <div className="empty-state py-12">
                <HiOutlineUserGroup size={32} />
                <p className="text-sm mt-2">{search ? 'Клиенты не найдены' : 'Клиентов пока нет'}</p>
                {!search && (
                  <button onClick={() => setShowCreate(true)} className="btn-primary text-xs mt-3">
                    <HiOutlinePlus size={14} className="inline mr-1" /> Добавить первого лида
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedLead && (
        <DealDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={fetchLeads} />
      )}
    </div>
  );
}

function MiniStat({ label, value, color, icon }: { label: string; value: string | number; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="card px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        {icon && <span className="text-gray-300 dark:text-gray-600">{icon}</span>}
      </div>
      <p className={`text-xl font-bold ${color || 'text-gray-800 dark:text-white'}`}>{value}</p>
    </div>
  );
}

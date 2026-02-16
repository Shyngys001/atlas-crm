import { useState, useEffect } from 'react';
import { broadcastsApi } from '../../api/endpoints';
import type { Broadcast } from '../../api/types';
import { useWSStore } from '../../store/wsStore';
import {
  HiOutlinePaperAirplane, HiOutlineClock, HiOutlinePlus,
  HiOutlineXMark, HiOutlineMegaphone, HiOutlineCheckCircle,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const statusMap: Record<string, { class: string; icon: React.ReactNode }> = {
  draft:     { class: 'badge-gray',   icon: <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> },
  scheduled: { class: 'badge-yellow', icon: <HiOutlineClock size={12} /> },
  sending:   { class: 'badge-blue',   icon: <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> },
  done:      { class: 'badge-green',  icon: <HiOutlineCheckCircle size={12} /> },
};

export default function BroadcastForm() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [segSource, setSegSource] = useState('');
  const [segLang, setSegLang] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const lastEvent = useWSStore((s) => s.lastEvent);

  const fetchBroadcasts = () => {
    broadcastsApi.list()
      .then(setBroadcasts)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBroadcasts(); }, []);

  useEffect(() => {
    if (lastEvent?.event === 'broadcast:progress') fetchBroadcasts();
  }, [lastEvent]);

  const resetForm = () => {
    setName(''); setBody(''); setTemplateName(''); setSegSource(''); setSegLang('');
    setShowCreate(false);
  };

  const handleCreate = async () => {
    if (!name.trim() || !body.trim()) {
      toast.error('Название и текст сообщения обязательны');
      return;
    }
    setCreating(true);
    try {
      const segment: Record<string, string> = {};
      if (segSource) segment.source = segSource;
      if (segLang) segment.language = segLang;
      await broadcastsApi.create({ name, body, template_name: templateName || undefined, segment });
      toast.success('Рассылка создана');
      resetForm();
      fetchBroadcasts();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSchedule = async (id: number, now: boolean) => {
    try {
      await broadcastsApi.schedule(id, now ? undefined : scheduleDate || undefined);
      toast.success(now ? 'Рассылка запущена!' : 'Рассылка запланирована');
      fetchBroadcasts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Stats
  const total = broadcasts.length;
  const drafts = broadcasts.filter((b) => b.status === 'draft').length;
  const sent = broadcasts.filter((b) => b.status === 'done').length;
  const active = broadcasts.filter((b) => b.status === 'sending').length;

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Всего" value={total} />
        <StatCard label="Черновики" value={drafts} color="text-gray-500" />
        <StatCard label="Отправлено" value={sent} color="text-emerald-600" />
        <StatCard label="Активные" value={active} color="text-blue-600" />
      </div>

      {/* Create button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{broadcasts.length} кампаний</p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
            showCreate ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'btn-primary'
          }`}
        >
          {showCreate ? <HiOutlineXMark size={16} /> : <HiOutlinePlus size={16} />}
          {showCreate ? 'Отмена' : 'Новая рассылка'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-5 animate-fade-in-up">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Создать кампанию</h3>
          <div className="space-y-3">
            <div>
              <label className="input-label">Название кампании</label>
              <input className="input-field" placeholder="напр. Спецпредложение Рамадан" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Текст сообщения</label>
              <textarea
                className="input-field h-28 resize-none"
                placeholder="Напишите текст рассылки..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <p className="text-[10px] text-gray-400 mt-1">{body.length} символов</p>
            </div>
            <div>
              <label className="input-label">Имя шаблона (опционально)</label>
              <input className="input-field" placeholder="Имя шаблона WhatsApp" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Сегмент: Источник</label>
                <select className="input-field" value={segSource} onChange={(e) => setSegSource(e.target.value)}>
                  <option value="">Все источники</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sipuni">Sipuni</option>
                  <option value="website">Сайт</option>
                  <option value="manual">Вручную</option>
                </select>
              </div>
              <div>
                <label className="input-label">Сегмент: Язык</label>
                <select className="input-field" value={segLang} onChange={(e) => setSegLang(e.target.value)}>
                  <option value="">Все языки</option>
                  <option value="ru">Русский</option>
                  <option value="kz">Казахский</option>
                  <option value="en">Английский</option>
                </select>
              </div>
            </div>
            <button onClick={handleCreate} disabled={creating} className="btn-primary w-full sm:w-auto">
              {creating ? 'Создание...' : 'Создать рассылку'}
            </button>
          </div>
        </div>
      )}

      {/* Broadcasts list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="empty-state py-16">
          <HiOutlineMegaphone size={36} />
          <p className="text-sm font-medium mt-3">Рассылок пока нет</p>
          <p className="text-xs text-gray-400 mt-1">Создайте первую кампанию для связи с клиентами</p>
          {!showCreate && (
            <button onClick={() => setShowCreate(true)} className="btn-primary text-xs mt-3">
              <HiOutlinePlus size={14} className="inline mr-1" /> Создать кампанию
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((bc) => (
            <div key={bc.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[14px] text-gray-800 dark:text-white truncate">{bc.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${statusMap[bc.status]?.class || 'badge-gray'}`}>
                      {statusMap[bc.status]?.icon}
                      {bc.status}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2">{bc.body}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[11px] text-gray-400">
                      Создано {new Date(bc.created_at).toLocaleDateString()}
                    </span>
                    {bc.template_name && (
                      <span className="text-[11px] badge-purple">Шаблон: {bc.template_name}</span>
                    )}
                    {bc.segment && Object.keys(bc.segment).length > 0 && (
                      <span className="text-[11px] badge-blue">
                        Сегмент: {Object.entries(bc.segment).map(([k, v]) => `${k}=${String(v)}`).join(', ')}
                      </span>
                    )}
                    {bc.scheduled_at && (
                      <span className="text-[11px] text-amber-600 flex items-center gap-1">
                        <HiOutlineClock size={11} />
                        {new Date(bc.scheduled_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {bc.status === 'draft' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleSchedule(bc.id, true)}
                      className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5"
                    >
                      <HiOutlinePaperAirplane size={13} /> Отправить
                    </button>
                    <div className="flex items-center gap-1">
                      <input
                        type="datetime-local"
                        className="input-field text-xs py-1.5 w-44"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                      <button
                        onClick={() => handleSchedule(bc.id, false)}
                        className="btn-secondary text-xs p-2"
                        title="Запланировать"
                      >
                        <HiOutlineClock size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {bc.status === 'sending' && (
                  <div className="flex items-center gap-2 text-blue-600 text-xs flex-shrink-0">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Отправка...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${color || 'text-gray-800 dark:text-white'}`}>{value}</p>
    </div>
  );
}

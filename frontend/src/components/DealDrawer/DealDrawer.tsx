import { useState, useEffect } from 'react';
import type { Lead, Activity, Stage, User } from '../../api/types';
import { leadsApi, pipelinesApi, usersApi, callsApi, messagesApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import {
  HiXMark, HiOutlinePhone, HiOutlineChatBubbleLeft,
  HiOutlinePaperAirplane, HiOutlineTag, HiOutlineClock,
  HiOutlineGlobeAlt, HiOutlineArrowPath, HiOutlineShieldCheck,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
}

const activityConfig: Record<string, { icon: string; color: string }> = {
  message:      { icon: '💬', color: 'bg-blue-100 dark:bg-blue-900/30' },
  call:         { icon: '📞', color: 'bg-emerald-100 dark:bg-emerald-900/30' },
  stage_change: { icon: '📋', color: 'bg-purple-100 dark:bg-purple-900/30' },
  assignment:   { icon: '👤', color: 'bg-amber-100 dark:bg-amber-900/30' },
  note:         { icon: '📝', color: 'bg-gray-100 dark:bg-gray-700' },
};

const sourceEmoji: Record<string, string> = {
  whatsapp: '💬', sipuni: '📞', website: '🌐', manual: '✏️',
};

export default function DealDrawer({ lead, onClose, onUpdate }: Props) {
  const [timeline, setTimeline] = useState<Activity[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [selectedStage, setSelectedStage] = useState(lead.stage_id || 0);
  const [selectedManager, setSelectedManager] = useState(lead.manager_id || 0);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'head';

  useEffect(() => {
    setLoadingTimeline(true);
    leadsApi.timeline(lead.id)
      .then(setTimeline)
      .catch(() => {})
      .finally(() => setLoadingTimeline(false));

    pipelinesApi.list().then((p) => {
      const def = p.find((x) => x.is_default) || p[0];
      if (def) setStages(def.stages);
    });

    if (isAdmin) usersApi.list().then(setManagers).catch(() => {});
  }, [lead.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleStageChange = async (stageId: number) => {
    setSelectedStage(stageId);
    try {
      await leadsApi.update(lead.id, { stage_id: stageId });
      toast.success('Этап обновлён');
      onUpdate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleManagerChange = async (managerId: number) => {
    setSelectedManager(managerId);
    try {
      await leadsApi.update(lead.id, { manager_id: managerId });
      toast.success('Менеджер переназначен');
      onUpdate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSendMessage = async () => {
    if (!msgText.trim()) return;
    setSending(true);
    try {
      await messagesApi.send(lead.id, msgText);
      setMsgText('');
      toast.success('Сообщение отправлено');
      leadsApi.timeline(lead.id).then(setTimeline);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleCall = async () => {
    try {
      await callsApi.clickToCall(lead.phone, lead.id);
      toast.success('Звонок инициирован');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const timeAgo = lead.last_activity_at
    ? formatTimeAgo(new Date(lead.last_activity_at))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-[500px] max-w-[90vw] bg-white dark:bg-gray-800 h-full shadow-2xl overflow-hidden flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-800 dark:text-white truncate">{lead.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400 font-mono">{lead.phone}</span>
                  {lead.is_returning && <span className="badge-yellow text-[9px]">Вернувшийся</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
              <HiXMark size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoItem icon={<HiOutlineGlobeAlt size={14} />} label="Источник" value={`${sourceEmoji[lead.source] || '📋'} ${lead.source}`} />
            <InfoItem icon={<HiOutlineTag size={14} />} label="Язык" value={lead.language.toUpperCase()} />
            <InfoItem icon={<HiOutlineClock size={14} />} label="Создан" value={new Date(lead.created_at).toLocaleDateString()} />
            <InfoItem icon={<HiOutlineArrowPath size={14} />} label="Активность" value={timeAgo || 'Нет активности'} />
          </div>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div>
              <label className="input-label mb-1.5">Теги</label>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium">
                    {String(tag)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={handleCall} className="btn-secondary flex items-center justify-center gap-1.5 flex-1 py-2.5">
              <HiOutlinePhone size={16} /> Звонок
            </button>
            <button
              onClick={() => document.getElementById('drawer-msg')?.focus()}
              className="btn-secondary flex items-center justify-center gap-1.5 flex-1 py-2.5"
            >
              <HiOutlineChatBubbleLeft size={16} /> Сообщение
            </button>
          </div>

          {/* Stage selector */}
          <div>
            <label className="input-label mb-1.5">Этап</label>
            <div className="flex flex-wrap gap-1.5">
              {stages.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStageChange(s.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
                    selectedStage === s.id
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                  }`}
                  style={selectedStage === s.id ? { backgroundColor: s.color } : undefined}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Manager selector */}
          {isAdmin && (
            <div>
              <label className="input-label mb-1.5">Менеджер</label>
              <select
                value={selectedManager}
                onChange={(e) => handleManagerChange(Number(e.target.value))}
                className="input-field"
              >
                <option value={0}>Не назначен</option>
                {managers.filter((m) => m.role === 'manager').map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Quick message */}
          <div>
            <label className="input-label mb-1.5">Быстрое сообщение</label>
            <div className="flex gap-2">
              <input
                id="drawer-msg"
                className="input-field flex-1"
                placeholder="Введите сообщение..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !msgText.trim()}
                className="btn-primary px-3 disabled:opacity-50"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <HiOutlinePaperAirplane size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Хронология</h3>
            {loadingTimeline ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 w-24" />
                      <div className="skeleton h-2.5 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : timeline.length === 0 ? (
              <div className="text-center py-8">
                <HiOutlineClock size={24} className="mx-auto text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-400 mt-2">Нет активности</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-200 dark:bg-gray-700" />

                <div className="space-y-4">
                  {timeline.map((a) => {
                    const config = activityConfig[a.kind] || activityConfig.note;
                    return (
                      <div key={a.id} className="flex gap-3 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 z-10 ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {a.kind.replace('_', ' ')}
                          </p>
                          {a.meta && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {String(a.meta.text || a.meta.content_preview || (a.meta.from !== undefined ? `${String(a.meta.from)} → ${String(a.meta.to)}` : ''))}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">
                            {new Date(a.created_at).toLocaleDateString()} at {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 capitalize">{value}</p>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days} дн назад`;
  return date.toLocaleDateString();
}

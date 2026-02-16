import { useState, useEffect, useRef } from 'react';
import { messagesApi, leadsApi, callsApi } from '../../api/endpoints';
import type { Message, Lead, Call } from '../../api/types';
import { useWSStore } from '../../store/wsStore';
import {
  HiOutlinePaperAirplane, HiOutlineHashtag,
  HiOutlineInformationCircle, HiOutlineXMark,
  HiOutlinePlayCircle, HiOutlinePhoneArrowDownLeft, HiOutlinePhoneArrowUpRight,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

interface Props {
  leadId: number;
}

const TEMPLATES = [
  { name: 'greeting', label: 'Приветствие', text: 'Ассаламу алейкум! Спасибо за обращение в Atlas Tourism. Чем можем помочь?' },
  { name: 'pricing', label: 'Цены', text: 'Стоимость тура на Умру начинается от 450 000 тенге. Включено: перелёт, проживание, трансфер. Хотите узнать подробнее?' },
  { name: 'follow_up', label: 'Напоминание', text: 'Здравствуйте! Хотели уточнить — остался ли интерес к нашему предложению? Будем рады ответить на вопросы.' },
  { name: 'docs', label: 'Документы', text: 'Для оформления тура понадобятся: паспорт (срок действия от 6 мес.), фото 3x4, копия удостоверения личности.' },
  { name: 'confirm', label: 'Подтверждение', text: 'Ваша бронь подтверждена! Детали поездки отправим в ближайшее время. Если есть вопросы — пишите.' },
];

interface TimelineItem {
  type: 'message' | 'call';
  timestamp: string;
  message?: Message;
  call?: Call;
}

export default function ChatView({ leadId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [text, setText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastEvent = useWSStore((s) => s.lastEvent);

  const fetchData = () => {
    Promise.all([
      messagesApi.byLead(leadId).then(setMessages),
      leadsApi.get(leadId).then(setLead),
      callsApi.byLead(leadId).then(setCalls),
    ]).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    inputRef.current?.focus();
  }, [leadId]);

  useEffect(() => {
    if (lastEvent?.event === 'message:new') {
      const data = lastEvent.data as any;
      if (data?.lead_id === leadId) fetchData();
    }
    if (lastEvent?.event === 'call:new') fetchData();
  }, [lastEvent]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, calls]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await messagesApi.send(leadId, text);
      setText('');
      fetchData();
      inputRef.current?.focus();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleTemplate = async (tpl: typeof TEMPLATES[0]) => {
    setShowTemplates(false);
    setSending(true);
    try {
      await messagesApi.send(leadId, tpl.text, tpl.name);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'read': return <span className="text-blue-200">✓✓</span>;
      case 'delivered': return <span className="text-primary-200">✓✓</span>;
      case 'sent': return <span className="text-primary-300">✓</span>;
      case 'failed': return <HiOutlineXMark size={12} className="text-red-300" />;
      default: return null;
    }
  };

  // Merge messages and calls into timeline
  const timeline: TimelineItem[] = [
    ...messages.map((m) => ({ type: 'message' as const, timestamp: m.created_at, message: m })),
    ...calls.map((c) => ({ type: 'call' as const, timestamp: c.created_at, call: c })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Group by date
  const groupedTimeline: { date: string; items: TimelineItem[] }[] = [];
  timeline.forEach((item) => {
    const date = new Date(item.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const last = groupedTimeline[groupedTimeline.length - 1];
    if (last && last.date === date) {
      last.items.push(item);
    } else {
      groupedTimeline.push({ date, items: [item] });
    }
  });

  const formatDuration = (s: number) => {
    if (s === 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 min-w-0">
      {/* Header */}
      {lead && (
        <div className="h-[60px] border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">{lead.name.charAt(0)}</div>
            <div className="min-w-0">
              <p className="font-semibold text-[13px] text-gray-800 dark:text-white truncate">{lead.name}</p>
              <p className="text-[11px] text-gray-400">{lead.phone} · {lead.source}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {lead.stage && <span className="badge text-white text-[10px] mr-2" style={{ backgroundColor: lead.stage.color }}>{lead.stage.name}</span>}
          </div>
        </div>
      )}

      {/* Timeline area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
        {loading ? (
          <div className="space-y-4 py-4">
            {[1,2,3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="skeleton h-14 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <div className="empty-state py-20">
            <HiOutlineInformationCircle size={32} className="text-gray-300 dark:text-gray-600" />
            <p className="text-sm mt-2 text-gray-400">Сообщений пока нет</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Отправьте первое сообщение</p>
          </div>
        ) : (
          groupedTimeline.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-4">
                <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-0.5 rounded-full">{group.date}</span>
              </div>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  // Call card
                  if (item.type === 'call' && item.call) {
                    const call = item.call;
                    return (
                      <div key={`call-${call.id}`} className="flex justify-center my-3">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 max-w-[320px] w-full shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              call.direction === 'in' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                            }`}>
                              {call.direction === 'in' ? <HiOutlinePhoneArrowDownLeft size={14} /> : <HiOutlinePhoneArrowUpRight size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                {call.direction === 'in' ? 'Входящий звонок' : 'Исходящий звонок'}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                <span>{formatDuration(call.duration)}</span>
                                {call.result && (
                                  <span className={call.result === 'answered' ? 'text-emerald-500' : 'text-red-400'}>
                                    {call.result === 'answered' ? 'Отвечен' : call.result === 'no_answer' ? 'Без ответа' : call.result === 'busy' ? 'Занято' : call.result}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {call.recording_url && (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-1.5">
                                <HiOutlinePlayCircle size={14} className="text-primary-600 flex-shrink-0" />
                                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Запись разговора</span>
                              </div>
                              <audio
                                controls
                                preload="none"
                                className="w-full h-8 rounded-lg"
                                src={call.recording_url}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Message bubble
                  const msg = item.message!;
                  return (
                    <div key={`msg-${msg.id}`} className={`flex ${msg.sender_type === 'client' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[65%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm ${
                        msg.sender_type === 'client'
                          ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-100 dark:border-gray-700'
                          : 'bg-primary-600 text-white rounded-br-sm'
                      }`}>
                        {msg.type === 'template' && (
                          <div className={`text-[10px] font-medium mb-1 ${msg.sender_type === 'client' ? 'text-primary-500' : 'text-primary-200'}`}>Шаблон</div>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender_type === 'client' ? 'text-gray-400' : 'text-primary-200'}`}>
                          <span className="text-[10px]">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.sender_type !== 'client' && statusIcon(msg.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Composer */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        {showTemplates && (
          <div className="border-b border-gray-100 dark:border-gray-700 p-3 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Быстрые шаблоны</p>
              <button onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-gray-600"><HiOutlineXMark size={16} /></button>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {TEMPLATES.map((tpl) => (
                <button key={tpl.name} onClick={() => handleTemplate(tpl)} className="text-left p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600">{tpl.label}</span>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{tpl.text}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 p-3">
          <button onClick={() => setShowTemplates(!showTemplates)} className={`btn-icon flex-shrink-0 ${showTemplates ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : ''}`} title="Шаблоны">
            <HiOutlineHashtag size={18} />
          </button>
          <input ref={inputRef} className="input-field flex-1 py-2" placeholder="Введите сообщение..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} disabled={sending} />
          <button onClick={handleSend} disabled={!text.trim() || sending} className="btn-primary p-2.5 rounded-xl disabled:opacity-30">
            {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiOutlinePaperAirplane size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

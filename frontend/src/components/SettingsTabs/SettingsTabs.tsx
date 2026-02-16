import { useState, useEffect } from 'react';
import { usersApi, pipelinesApi, distributionApi } from '../../api/endpoints';
import type { User, Pipeline, Stage, DistributionRule } from '../../api/types';
import { useAuthStore } from '../../store/authStore';
import {
  HiOutlineUsers, HiOutlineViewColumns, HiOutlineCog6Tooth,
  HiOutlinePuzzlePiece, HiOutlinePlus, HiOutlineXMark,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineShieldCheck,
  HiOutlinePencil, HiOutlineTrash, HiOutlineCheck,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'Users', label: 'Пользователи', icon: <HiOutlineUsers size={16} /> },
  { key: 'Pipelines', label: 'Воронки', icon: <HiOutlineViewColumns size={16} /> },
  { key: 'Distribution', label: 'Распределение', icon: <HiOutlineCog6Tooth size={16} /> },
  { key: 'Integrations', label: 'Интеграции', icon: <HiOutlinePuzzlePiece size={16} /> },
];

export default function SettingsTabs() {
  const [tab, setTab] = useState('Users');

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t.key
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'Users' && <UsersTab />}
      {tab === 'Pipelines' && <PipelinesTab />}
      {tab === 'Distribution' && <DistributionTab />}
      {tab === 'Integrations' && <IntegrationsTab />}
    </div>
  );
}

/* =================== USERS TAB =================== */
function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'manager' });
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', password: '', is_active: true });

  const fetchUsers = () => {
    usersApi.list()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Все поля обязательны');
      return;
    }
    setCreating(true);
    try {
      await usersApi.create(form);
      toast.success('Пользователь создан');
      setShowCreate(false);
      setForm({ email: '', name: '', password: '', role: 'manager' });
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setEditForm({ name: u.name, email: u.email, role: u.role, password: '', is_active: u.is_active });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      const data: Record<string, unknown> = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        is_active: editForm.is_active,
      };
      if (editForm.password.trim()) data.password = editForm.password;
      await usersApi.update(editingId, data as any);
      toast.success('Пользователь обновлён');
      setEditingId(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeactivate = async (u: User) => {
    const action = u.is_active ? 'деактивировать' : 'активировать';
    try {
      await usersApi.update(u.id, { is_active: !u.is_active } as any);
      toast.success(`Пользователь ${u.is_active ? 'деактивирован' : 'активирован'}`);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { admin: 'badge-red', head: 'badge-purple', manager: 'badge-blue' };
    const labels: Record<string, string> = { admin: 'Админ', head: 'Руководитель', manager: 'Менеджер' };
    return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[role] || 'badge-gray'}`}>{labels[role] || role}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{users.length} пользователей</p>
        <button
          onClick={() => { setShowCreate(!showCreate); setEditingId(null); }}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
            showCreate ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'btn-primary'
          }`}
        >
          {showCreate ? <HiOutlineXMark size={15} /> : <HiOutlinePlus size={15} />}
          {showCreate ? 'Отмена' : 'Добавить'}
        </button>
      </div>

      {showCreate && (
        <div className="card p-5 animate-fade-in-up">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Новый пользователь</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="input-label">Имя</label>
              <input className="input-field" placeholder="Иван Петров" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input className="input-field" placeholder="ivan@atlas.tld" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Пароль</label>
              <input className="input-field" placeholder="Минимум 8 символов" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Роль</label>
              <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="manager">Менеджер</option>
                <option value="head">Руководитель</option>
                <option value="admin">Админ</option>
              </select>
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary mt-4">
            {creating ? 'Создание...' : 'Создать'}
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full rounded" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left p-3 pl-5">Пользователь</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Роль</th>
                <th className="text-left p-3">Статус</th>
                <th className="text-left p-3 pr-5">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((u) => (
                editingId === u.id ? (
                  <tr key={u.id} className="bg-primary-50/50 dark:bg-primary-900/10">
                    <td className="p-3 pl-5">
                      <input className="input-field py-1.5 text-sm" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </td>
                    <td className="p-3">
                      <input className="input-field py-1.5 text-sm" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                    </td>
                    <td className="p-3">
                      <select className="input-field py-1.5 text-sm" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                        <option value="manager">Менеджер</option>
                        <option value="head">Руководитель</option>
                        <option value="admin">Админ</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input className="input-field py-1.5 text-sm" placeholder="Новый пароль (необязательно)" type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                    </td>
                    <td className="p-3 pr-5">
                      <div className="flex items-center gap-1">
                        <button onClick={handleUpdate} className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100" title="Сохранить">
                          <HiOutlineCheck size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200" title="Отмена">
                          <HiOutlineXMark size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id} className="table-row">
                    <td className="p-3 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="p-3">{roleBadge(u.role)}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                        {u.is_active ? <HiOutlineCheckCircle size={12} /> : <HiOutlineXCircle size={12} />}
                        {u.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="p-3 pr-5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(u)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600" title="Редактировать">
                          <HiOutlinePencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeactivate(u)}
                          className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${u.is_active ? 'text-red-400 hover:text-red-600' : 'text-emerald-400 hover:text-emerald-600'}`}
                          title={u.is_active ? 'Деактивировать' : 'Активировать'}
                        >
                          {u.is_active ? <HiOutlineXCircle size={15} /> : <HiOutlineCheckCircle size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* =================== PIPELINES TAB =================== */
const STAGE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

function PipelinesTab() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStage, setShowAddStage] = useState<number | null>(null);
  const [stageForm, setStageForm] = useState({ name: '', color: STAGE_COLORS[0] });
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [editStageForm, setEditStageForm] = useState({ name: '', color: '' });
  const [showCreatePipeline, setShowCreatePipeline] = useState(false);
  const [pipelineName, setPipelineName] = useState('');

  const fetchPipelines = () => {
    pipelinesApi.list()
      .then(setPipelines)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPipelines(); }, []);

  const handleCreatePipeline = async () => {
    if (!pipelineName.trim()) { toast.error('Введите название воронки'); return; }
    try {
      await pipelinesApi.create({ name: pipelineName });
      toast.success('Воронка создана');
      setPipelineName('');
      setShowCreatePipeline(false);
      fetchPipelines();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddStage = async (pipelineId: number) => {
    if (!stageForm.name.trim()) { toast.error('Введите название этапа'); return; }
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    const maxPos = pipeline ? Math.max(0, ...pipeline.stages.map((s) => s.position)) : 0;
    try {
      await pipelinesApi.createStage({ pipeline_id: pipelineId, name: stageForm.name, position: maxPos + 1, color: stageForm.color });
      toast.success('Этап добавлен');
      setStageForm({ name: '', color: STAGE_COLORS[0] });
      setShowAddStage(null);
      fetchPipelines();
    } catch (e: any) { toast.error(e.message); }
  };

  const startEditStage = (s: Stage) => {
    setEditingStage(s.id);
    setEditStageForm({ name: s.name, color: s.color });
  };

  const handleUpdateStage = async (stageId: number) => {
    try {
      await pipelinesApi.updateStage(stageId, { name: editStageForm.name, color: editStageForm.color });
      toast.success('Этап обновлён');
      setEditingStage(null);
      fetchPipelines();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteStage = async (stageId: number) => {
    try {
      await pipelinesApi.deleteStage(stageId);
      toast.success('Этап удалён');
      fetchPipelines();
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="skeleton h-48 w-full rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{pipelines.length} воронок</p>
        <button
          onClick={() => setShowCreatePipeline(!showCreatePipeline)}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
            showCreatePipeline ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'btn-primary'
          }`}
        >
          {showCreatePipeline ? <HiOutlineXMark size={15} /> : <HiOutlinePlus size={15} />}
          {showCreatePipeline ? 'Отмена' : 'Новая воронка'}
        </button>
      </div>

      {showCreatePipeline && (
        <div className="card p-5 animate-fade-in-up">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Новая воронка</h3>
          <div className="flex gap-3">
            <input className="input-field flex-1" placeholder="Название воронки" value={pipelineName} onChange={(e) => setPipelineName(e.target.value)} />
            <button onClick={handleCreatePipeline} className="btn-primary">Создать</button>
          </div>
        </div>
      )}

      {pipelines.map((p) => (
        <div key={p.id} className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <HiOutlineViewColumns size={20} className="text-primary-600" />
            <h3 className="font-semibold text-gray-800 dark:text-white">{p.name}</h3>
            {p.is_default && <span className="badge-green text-[10px]">По умолчанию</span>}
            <span className="text-xs text-gray-400 ml-auto">{p.stages.length} этапов</span>
          </div>

          {/* Stages list */}
          <div className="space-y-2">
            {p.stages.sort((a, b) => a.position - b.position).map((s) => (
              editingStage === s.id ? (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-primary-50/50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800">
                  <input className="input-field py-1.5 text-sm flex-1" value={editStageForm.name} onChange={(e) => setEditStageForm({ ...editStageForm, name: e.target.value })} />
                  <div className="flex items-center gap-1">
                    {STAGE_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditStageForm({ ...editStageForm, color: c })}
                        className={`w-5 h-5 rounded-full transition-transform ${editStageForm.color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button onClick={() => handleUpdateStage(s.id)} className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100">
                    <HiOutlineCheck size={15} />
                  </button>
                  <button onClick={() => setEditingStage(null)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200">
                    <HiOutlineXMark size={15} />
                  </button>
                </div>
              ) : (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/30 group hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-gray-800 flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 flex-1">{s.name}</span>
                  <span className="text-[10px] text-gray-400">#{s.position}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditStage(s)} className="p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20" title="Редактировать">
                      <HiOutlinePencil size={13} />
                    </button>
                    <button onClick={() => handleDeleteStage(s.id)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Удалить">
                      <HiOutlineTrash size={13} />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Add stage */}
          {showAddStage === p.id ? (
            <div className="mt-3 flex items-center gap-2 animate-fade-in-up">
              <input className="input-field py-1.5 text-sm flex-1" placeholder="Название этапа" value={stageForm.name} onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })} />
              <div className="flex items-center gap-1">
                {STAGE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setStageForm({ ...stageForm, color: c })}
                    className={`w-5 h-5 rounded-full transition-transform ${stageForm.color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button onClick={() => handleAddStage(p.id)} className="btn-primary text-xs px-3 py-1.5">Добавить</button>
              <button onClick={() => setShowAddStage(null)} className="btn-ghost text-xs px-2 py-1.5">Отмена</button>
            </div>
          ) : (
            <button onClick={() => setShowAddStage(p.id)} className="mt-3 flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium">
              <HiOutlinePlus size={14} /> Добавить этап
            </button>
          )}
        </div>
      ))}

      {pipelines.length === 0 && (
        <div className="empty-state py-12">
          <HiOutlineViewColumns size={32} />
          <p className="text-sm mt-2">Нет настроенных воронок</p>
        </div>
      )}
    </div>
  );
}

/* =================== DISTRIBUTION TAB =================== */
function DistributionTab() {
  const [rules, setRules] = useState<DistributionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ algorithm: 'round_robin' as string, source: '', language: '', priority: 1, is_active: true });

  const fetchRules = () => {
    distributionApi.getRules()
      .then(setRules)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRules(); }, []);

  const saveRules = async (newRules: Partial<DistributionRule>[]) => {
    try {
      const updated = await distributionApi.updateRules(newRules);
      setRules(updated);
      toast.success('Правила обновлены');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreate = async () => {
    const newRule: Partial<DistributionRule> = {
      algorithm: form.algorithm as any,
      source: form.source || null,
      language: form.language || null,
      priority: form.priority,
      is_active: form.is_active,
    };
    const allRules = [...rules.map((r) => ({
      id: r.id, algorithm: r.algorithm, source: r.source, language: r.language, priority: r.priority, is_active: r.is_active,
    })), newRule];
    await saveRules(allRules);
    setShowCreate(false);
    setForm({ algorithm: 'round_robin', source: '', language: '', priority: rules.length + 1, is_active: true });
    fetchRules();
  };

  const handleToggle = async (ruleId: number) => {
    const updated = rules.map((r) => ({
      id: r.id, algorithm: r.algorithm, source: r.source, language: r.language, priority: r.priority,
      is_active: r.id === ruleId ? !r.is_active : r.is_active,
    }));
    await saveRules(updated);
    fetchRules();
  };

  const handleDelete = async (ruleId: number) => {
    const updated = rules.filter((r) => r.id !== ruleId).map((r) => ({
      id: r.id, algorithm: r.algorithm, source: r.source, language: r.language, priority: r.priority, is_active: r.is_active,
    }));
    await saveRules(updated);
    fetchRules();
  };

  const algoBadge = (algo: string) => {
    const map: Record<string, string> = { round_robin: 'badge-blue', load_based: 'badge-green', language_based: 'badge-purple', source_based: 'badge-yellow' };
    const labels: Record<string, string> = { round_robin: 'По очереди', load_based: 'По нагрузке', language_based: 'По языку', source_based: 'По источнику' };
    return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[algo] || 'badge-gray'}`}>{labels[algo] || algo}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Правила распределения</h3>
          <p className="text-xs text-gray-400 mt-0.5">Правила выполняются по приоритету (меньше = выше приоритет)</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
            showCreate ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'btn-primary'
          }`}
        >
          {showCreate ? <HiOutlineXMark size={15} /> : <HiOutlinePlus size={15} />}
          {showCreate ? 'Отмена' : 'Новое правило'}
        </button>
      </div>

      {showCreate && (
        <div className="card p-5 animate-fade-in-up">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Новое правило</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="input-label">Алгоритм</label>
              <select className="input-field" value={form.algorithm} onChange={(e) => setForm({ ...form, algorithm: e.target.value })}>
                <option value="round_robin">По очереди (Round Robin)</option>
                <option value="load_based">По нагрузке</option>
                <option value="language_based">По языку</option>
                <option value="source_based">По источнику</option>
              </select>
            </div>
            <div>
              <label className="input-label">Приоритет</label>
              <input className="input-field" type="number" min={1} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>
            <div>
              <label className="input-label">Фильтр: Источник</label>
              <select className="input-field" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="">Любой</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sipuni">Sipuni</option>
                <option value="website">Сайт</option>
                <option value="manual">Вручную</option>
              </select>
            </div>
            <div>
              <label className="input-label">Фильтр: Язык</label>
              <select className="input-field" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                <option value="">Любой</option>
                <option value="ru">Русский</option>
                <option value="kz">Казахский</option>
                <option value="en">Английский</option>
              </select>
            </div>
          </div>
          <button onClick={handleCreate} className="btn-primary mt-4">Создать правило</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[1, 2].map((i) => <div key={i} className="skeleton h-14 w-full rounded" />)}</div>
        ) : rules.length === 0 ? (
          <div className="empty-state py-12">
            <HiOutlineCog6Tooth size={32} />
            <p className="text-sm mt-2">Нет правил распределения</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left p-3 pl-5">Статус</th>
                <th className="text-left p-3">Алгоритм</th>
                <th className="text-left p-3">Источник</th>
                <th className="text-left p-3">Язык</th>
                <th className="text-left p-3">Приоритет</th>
                <th className="text-left p-3 pr-5">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rules.sort((a, b) => a.priority - b.priority).map((r) => (
                <tr key={r.id} className="table-row">
                  <td className="p-3 pl-5">
                    <button onClick={() => handleToggle(r.id)} className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors ${r.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {r.is_active ? <HiOutlineCheckCircle size={12} /> : <HiOutlineXCircle size={12} />}
                      {r.is_active ? 'Активно' : 'Выключено'}
                    </button>
                  </td>
                  <td className="p-3">{algoBadge(r.algorithm)}</td>
                  <td className="p-3"><span className="text-gray-600 dark:text-gray-400 capitalize">{r.source || 'Любой'}</span></td>
                  <td className="p-3"><span className="text-gray-600 dark:text-gray-400 uppercase">{r.language || 'Любой'}</span></td>
                  <td className="p-3"><span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded text-xs font-mono">{r.priority}</span></td>
                  <td className="p-3 pr-5">
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600" title="Удалить">
                      <HiOutlineTrash size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* =================== INTEGRATIONS TAB =================== */
function IntegrationsTab() {
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-xl">💬</div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">WhatsApp Cloud API</h3>
            <p className="text-xs text-gray-400 mt-0.5">Интеграция с Meta WhatsApp Business API</p>
          </div>
          <span className="badge-green text-[10px] ml-auto">Подключено</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="input-label">Phone Number ID</label>
            <input className="input-field bg-gray-50 dark:bg-gray-700" placeholder="Через WHATSAPP_PHONE_ID" disabled />
          </div>
          <div>
            <label className="input-label">Access Token</label>
            <input className="input-field bg-gray-50 dark:bg-gray-700" type="password" placeholder="Через WHATSAPP_TOKEN" disabled />
          </div>
        </div>
        <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
          <p className="text-[12px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <HiOutlineShieldCheck size={14} />
            Учётные данные настраиваются через переменные окружения
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xl">📞</div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Sipuni Телефония</h3>
            <p className="text-xs text-gray-400 mt-0.5">Отслеживание звонков и click-to-call</p>
          </div>
          <span className="badge-green text-[10px] ml-auto">Подключено</span>
        </div>
        <div>
          <label className="input-label">Webhook URL</label>
          <div className="flex items-center gap-2">
            <input className="input-field bg-gray-50 dark:bg-gray-700 flex-1 font-mono text-[12px]" value="/api/v1/integrations/sipuni/webhook" disabled />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/api/v1/integrations/sipuni/webhook`);
                toast.success('Скопировано');
              }}
              className="btn-secondary text-xs px-3 py-2"
            >
              Копировать
            </button>
          </div>
        </div>
        <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
          <p className="text-[12px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <HiOutlineShieldCheck size={14} />
            API ключ настраивается через SIPUNI_API_KEY
          </p>
        </div>
      </div>
    </div>
  );
}

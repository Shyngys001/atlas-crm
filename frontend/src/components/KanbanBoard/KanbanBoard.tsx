import { useState, useEffect } from 'react';
import {
  DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { pipelinesApi, leadsApi } from '../../api/endpoints';
import type { Pipeline, Lead } from '../../api/types';
import { useWSStore } from '../../store/wsStore';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import DealDrawer from '../DealDrawer/DealDrawer';
import { HiOutlinePlus, HiOutlineViewColumns } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function KanbanBoard() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const lastEvent = useWSStore((s) => s.lastEvent);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchData = async () => {
    try {
      const [pData, lData] = await Promise.all([pipelinesApi.list(), leadsApi.list({ limit: 500 })]);
      setPipelines(pData);
      setLeads(lData);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (lastEvent?.event === 'lead:updated') fetchData();
  }, [lastEvent]);

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find((l) => l.id === event.active.id);
    if (lead) setActiveLead(lead);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as number;
    const targetStageId = over.id as number;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage_id === targetStageId) return;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage_id: targetStageId } : l))
    );

    try {
      await leadsApi.update(leadId, { stage_id: targetStageId });
      toast.success('Этап обновлён');
    } catch (e: any) {
      toast.error(e.message);
      fetchData();
    }
  };

  const pipeline = pipelines.find((p) => p.is_default) || pipelines[0];
  const filteredLeads = search
    ? leads.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search))
    : leads;

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="flex-shrink-0 w-72 rounded-xl bg-gray-100 dark:bg-gray-800/50 p-3">
            <div className="skeleton h-5 w-24 mb-3" />
            <div className="space-y-2">
              <div className="skeleton h-20 w-full rounded-lg" />
              <div className="skeleton h-20 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="empty-state">
        <HiOutlineViewColumns size={40} />
        <p className="text-base font-medium mt-3">Воронка не настроена</p>
        <p className="text-sm mt-1">Перейдите в Настройки, чтобы создать воронку</p>
      </div>
    );
  }

  return (
    <>
      {/* Search bar */}
      <div className="mb-4 flex items-center gap-3">
        <input
          className="input-field max-w-xs"
          placeholder="Поиск по имени или телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-xs text-gray-400">{filteredLeads.length} лидов</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-14rem)]">
          {pipeline.stages.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage_id === stage.id);
            return (
              <KanbanColumn key={stage.id} stage={stage} count={stageLeads.length}>
                <SortableContext items={stageLeads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                  {stageLeads.map((lead) => (
                    <KanbanCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                  ))}
                </SortableContext>
                {stageLeads.length === 0 && (
                  <div className="text-center py-8 text-gray-300 dark:text-gray-600">
                    <p className="text-xs">Нет лидов</p>
                  </div>
                )}
              </KanbanColumn>
            );
          })}
        </div>
        <DragOverlay>
          {activeLead && <KanbanCard lead={activeLead} overlay />}
        </DragOverlay>
      </DndContext>

      {selectedLead && (
        <DealDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => { fetchData(); }}
        />
      )}
    </>
  );
}

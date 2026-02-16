import { useDroppable } from '@dnd-kit/core';
import type { Stage } from '../../api/types';

interface Props {
  stage: Stage;
  count: number;
  children: React.ReactNode;
}

export default function KanbanColumn({ stage, count, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[280px] flex flex-col rounded-xl transition-all duration-200 ${
        isOver
          ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-300 dark:ring-primary-700 ring-dashed'
          : 'bg-gray-100/80 dark:bg-gray-800/40'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-gray-800" style={{ backgroundColor: stage.color }} />
          <h3 className="font-semibold text-[13px] text-gray-700 dark:text-gray-300 truncate">{stage.name}</h3>
        </div>
        <span className="text-[11px] bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium shadow-sm flex-shrink-0 ml-2">
          {count}
        </span>
      </div>
      <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto min-h-[80px] scrollbar-thin">
        {children}
      </div>
    </div>
  );
}

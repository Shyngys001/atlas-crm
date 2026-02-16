import KanbanBoard from '../components/KanbanBoard/KanbanBoard';
import { HiOutlineViewColumns } from 'react-icons/hi2';

export default function Kanban() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
          <HiOutlineViewColumns size={18} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">Воронка продаж</h1>
          <p className="text-xs text-gray-400">Перетаскивайте лиды между этапами</p>
        </div>
      </div>
      <KanbanBoard />
    </div>
  );
}

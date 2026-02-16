import { useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useWSStore } from '../../store/wsStore';
import { HiOutlineSun, HiOutlineMoon, HiOutlineBell } from 'react-icons/hi2';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Дашборд',
  '/kanban': 'Воронка продаж',
  '/chats': 'Чаты',
  '/calls': 'История звонков',
  '/clients': 'Клиенты',
  '/broadcasts': 'Рассылки',
  '/settings': 'Настройки',
};

export default function Topbar() {
  const { darkMode, toggleDarkMode } = useUIStore();
  const connected = useWSStore((s) => s.connected);
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'Atlas Tourism CRM';

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium mr-2 ${
          connected
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
          {connected ? 'Онлайн' : 'Оффлайн'}
        </div>

        <button className="btn-icon relative">
          <HiOutlineBell size={19} />
        </button>

        <button onClick={toggleDarkMode} className="btn-icon">
          {darkMode ? <HiOutlineSun size={19} /> : <HiOutlineMoon size={19} />}
        </button>
      </div>
    </header>
  );
}

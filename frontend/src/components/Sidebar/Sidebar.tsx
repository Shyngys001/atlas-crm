import { NavLink, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import {
  HiOutlineViewColumns, HiOutlineChatBubbleLeftRight, HiOutlinePhone,
  HiOutlineUsers, HiOutlineMegaphone, HiOutlineCog6Tooth, HiOutlineChartBar,
  HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';

const navItems = [
  { to: '/dashboard', label: 'Дашборд', icon: HiOutlineChartBar, section: 'main' },
  { to: '/kanban', label: 'Воронка', icon: HiOutlineViewColumns, section: 'main' },
  { to: '/chats', label: 'Чаты', icon: HiOutlineChatBubbleLeftRight, section: 'main' },
  { to: '/calls', label: 'Звонки', icon: HiOutlinePhone, section: 'main' },
  { to: '/clients', label: 'Клиенты', icon: HiOutlineUsers, section: 'main' },
  { to: '/broadcasts', label: 'Рассылки', icon: HiOutlineMegaphone, section: 'tools' },
  { to: '/settings', label: 'Настройки', icon: HiOutlineCog6Tooth, section: 'tools' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const mainItems = navItems.filter((i) => i.section === 'main');
  const toolItems = navItems.filter((i) => i.section === 'tools');

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-[68px]'}`}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        {sidebarOpen ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
              AT
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">Atlas Tourism</p>
              <p className="text-[10px] text-gray-400 -mt-0.5">CRM Платформа</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-sm mx-auto shadow-sm">
            AT
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2.5 overflow-y-auto">
        <div className="space-y-0.5">
          {sidebarOpen && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Меню</p>}
          {mainItems.map((item) => (
            <SidebarLink key={item.to} item={item} collapsed={!sidebarOpen} />
          ))}
        </div>

        <div className="my-4 mx-3 border-t border-gray-100 dark:border-gray-700" />

        <div className="space-y-0.5">
          {sidebarOpen && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Инструменты</p>}
          {toolItems.map((item) => (
            <SidebarLink key={item.to} item={item} collapsed={!sidebarOpen} />
          ))}
        </div>
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        {sidebarOpen && user && (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
              <p className="text-[11px] text-gray-400 capitalize">{user.role === 'admin' ? 'Админ' : user.role === 'head' ? 'Руководитель' : 'Менеджер'}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1 px-2 pb-2">
          <button
            onClick={logout}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors ${!sidebarOpen ? 'mx-auto' : 'flex-1'}`}
            title="Выйти"
          >
            <HiOutlineArrowRightOnRectangle size={18} />
            {sidebarOpen && <span className="text-sm">Выйти</span>}
          </button>
          <button
            onClick={toggleSidebar}
            className="btn-icon flex-shrink-0"
            title={sidebarOpen ? 'Свернуть' : 'Развернуть'}
          >
            {sidebarOpen ? <HiOutlineChevronLeft size={16} /> : <HiOutlineChevronRight size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ item, collapsed }: { item: typeof navItems[0]; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group relative ${
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm shadow-primary-100 dark:shadow-none'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-600 rounded-r-full" />}
          <item.icon size={19} className="flex-shrink-0" />
          {!collapsed && <span>{item.label}</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

import BroadcastForm from '../components/BroadcastForm/BroadcastForm';
import { HiOutlineMegaphone } from 'react-icons/hi2';

export default function Broadcasts() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
          <HiOutlineMegaphone size={18} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">Рассылки WhatsApp</h1>
          <p className="text-xs text-gray-400">Создание и управление кампаниями рассылок</p>
        </div>
      </div>
      <BroadcastForm />
    </div>
  );
}

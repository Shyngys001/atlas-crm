import CallsTable from '../components/CallsTable/CallsTable';
import { HiOutlinePhone } from 'react-icons/hi2';

export default function Calls() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
          <HiOutlinePhone size={18} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">История звонков</h1>
          <p className="text-xs text-gray-400">Отслеживание входящих и исходящих звонков</p>
        </div>
      </div>
      <CallsTable />
    </div>
  );
}

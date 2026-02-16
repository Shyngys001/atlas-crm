import { useState } from 'react';
import ChatInbox from '../components/ChatInbox/ChatInbox';
import ChatView from '../components/ChatView/ChatView';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';

export default function Chats() {
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-6 bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      <ChatInbox onSelect={setSelectedLeadId} selectedLeadId={selectedLeadId} />
      {selectedLeadId ? (
        <ChatView leadId={selectedLeadId} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <HiOutlineChatBubbleLeftRight size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Выберите переписку</p>
            <p className="text-xs text-gray-400 mt-0.5">Выберите чат из левой панели для начала общения</p>
          </div>
        </div>
      )}
    </div>
  );
}

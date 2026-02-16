import { create } from 'zustand';

interface WSState {
  socket: WebSocket | null;
  connected: boolean;
  lastEvent: { event: string; data: unknown } | null;
  connect: () => void;
  disconnect: () => void;
}

export const useWSStore = create<WSState>((set, get) => ({
  socket: null,
  connected: false,
  lastEvent: null,

  connect: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const existing = get().socket;
    if (existing && existing.readyState === WebSocket.OPEN) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    let wsUrl: string;
    if (backendUrl) {
      const url = new URL(backendUrl);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${url.host}/ws?token=${token}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    }
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => set({ connected: true });
    ws.onclose = () => {
      set({ connected: false, socket: null });
      setTimeout(() => {
        if (localStorage.getItem('access_token')) {
          get().connect();
        }
      }, 3000);
    };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        set({ lastEvent: data });
      } catch {}
    };
    ws.onerror = () => ws.close();

    set({ socket: ws });
  },

  disconnect: () => {
    const ws = get().socket;
    if (ws) ws.close();
    set({ socket: null, connected: false });
  },
}));

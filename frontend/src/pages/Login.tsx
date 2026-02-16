import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Заполните все поля'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Добро пожаловать в Atlas Tourism CRM');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 border border-white/30 rounded-full" />
          <div className="absolute bottom-32 right-16 w-96 h-96 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 border border-white/25 rounded-full" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-8">AT</div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Atlas Tourism<br />CRM Платформа</h1>
          <p className="text-primary-200 text-lg leading-relaxed max-w-md">
            Воронка продаж, WhatsApp-мессенджер, телефония и аналитика для вашего туристического бизнеса Хадж и Умра.
          </p>
          <div className="mt-12 space-y-4">
            <Feature text="Канбан-воронка с drag & drop" />
            <Feature text="Интеграция WhatsApp Business API" />
            <Feature text="Авто-распределение лидов и RBAC" />
            <Feature text="Аналитика в реальном времени" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-primary-600/30">AT</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Atlas Tourism</h1>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Вход в систему</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Введите данные для доступа к CRM</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="email" className="input-field pl-10" placeholder="admin@atlas.tld" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </div>
            </div>
            <div>
              <label className="input-label">Пароль</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type={showPassword ? 'text' : 'password'} className="input-field pl-10 pr-10" placeholder="Введите пароль" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
              {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Вход...</>) : 'Войти'}
            </button>
          </form>
          <div className="mt-8 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30">
            <p className="text-xs font-medium text-primary-700 dark:text-primary-400 mb-2">Демо доступ</p>
            <div className="space-y-1 text-xs text-primary-600 dark:text-primary-300 font-mono">
              <p>Админ: admin@atlas.tld / Admin123!</p>
              <p>Менеджер: manager1@atlas.tld / Manager123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </div>
      <span className="text-primary-100 text-sm">{text}</span>
    </div>
  );
}

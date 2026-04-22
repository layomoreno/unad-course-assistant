import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Bell, 
  BookOpen, 
  AlertCircle, 
  CheckCircle, 
  ChevronRight, 
  Clock,
  ExternalLink,
  LogOut,
  User
} from 'lucide-react';
import { COURSES, Activity } from './constants';
import { getEventDate, getReminders, formatDate } from './lib/dateUtils';
import { format, parseISO, startOfDay } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PendingSync = {
  activity: Activity;
  courseName: string;
  courseCode: string;
};

export default function App() {
  const [selectedCourseId, setSelectedCourseId] = useState(COURSES[0].id);
  const [syncedActivities, setSyncedActivities] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState<PendingSync | null>(null);
  const [today] = useState(() => new Date());
  const todayStart = useMemo(() => startOfDay(today), [today]);

  // Check auth status on mount
  useEffect(() => {
    void checkAuthStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        void checkAuthStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !pendingSync) {
      return;
    }

    void syncActivity(pendingSync);
    setPendingSync(null);
  }, [isLoggedIn, pendingSync]);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsLoggedIn(Boolean(data.isAuthenticated));
      if (!data.isAuthenticated) {
        setSyncedActivities(new Set());
      }
      return Boolean(data.isAuthenticated);
    } catch (e) {
      console.error('Auth check failed', e);
      setAuthError('No se pudo validar la sesión con Google.');
      return false;
    }
  };

  const selectedCourse = useMemo(() => 
    COURSES.find(c => c.id === selectedCourseId) || COURSES[0], 
  [selectedCourseId]);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo iniciar sesión con Google.');
      }

      const { url } = data;
      if (!url) {
        throw new Error('No se recibió la URL de autenticación de Google.');
      }

      // Open in a centered popup
      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        url,
        'google_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('El navegador bloqueó la ventana de Google. Habilita popups para continuar.');
      }
      return true;
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Error al conectar con Google. Verifica la configuración OAuth.';
      setAuthError(message);
      return false;
    }
  };

  const handleLogout = async () => {
    setAuthError(null);
    setSyncError(null);
    setPendingSync(null);
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setSyncedActivities(new Set());
  };

  const syncActivity = async ({ activity, courseName, courseCode }: PendingSync) => {
    setSyncError(null);
    setIsSyncing(activity.id);
    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          activity: {
            ...activity,
            courseName,
            courseCode,
          },
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear el evento en Google Calendar.');
      }

      setSyncedActivities(prev => {
        const next = new Set(prev);
        next.add(activity.id);
        return next;
      });
    } catch (e) {
      console.error('Sync failed', e);
      const message =
        e instanceof Error
          ? e.message
          : 'Falló la sincronización con Google Calendar.';
      setSyncError(message);
    } finally {
      setIsSyncing(null);
    }
  };

  const handleSync = async (activity: Activity) => {
    const syncRequest: PendingSync = {
      activity,
      courseName: selectedCourse.name,
      courseCode: selectedCourse.code,
    };

    if (!isLoggedIn) {
      setPendingSync(syncRequest);
      const opened = await handleLogin();
      if (!opened) {
        setPendingSync(null);
      }
      return;
    }

    await syncActivity(syncRequest);
  };

  const getActivityStatus = (endDateStr: string) => {
    const endDate = parseISO(endDateStr);
    const diffDays = Math.ceil((endDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Cerrada', color: 'bg-gray-100 text-gray-500', icon: CheckCircle };
    if (diffDays <= 3) return { label: 'Cierra pronto (3d)', color: 'bg-red-100 text-red-600', icon: AlertCircle };
    if (diffDays <= 7) return { label: 'Cierra pronto (7d)', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    return { label: 'Habilitada', color: 'bg-green-100 text-green-600', icon: CheckCircle };
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
      {/* Topbar */}
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Agenda UNAD</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gestor de Calendario</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Hoy: {formatDate(today)}</span>
            </div>
            
            {isLoggedIn ? (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
              >
                <User className="h-4 w-4" />
                Entrar con Google
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {authError && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {authError}
          </div>
        )}
        {syncError && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {syncError}
          </div>
        )}

        {!isLoggedIn && (
           <div className="mb-8 rounded-2xl bg-amber-50 border border-amber-200 p-6 flex flex-col sm:flex-row items-center gap-4">
             <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
               <AlertCircle className="h-6 w-6" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-amber-900">Sincronización deshabilitada</h3>
               <p className="text-sm text-amber-700">Inicia sesión con cualquier cuenta de Google para crear recordatorios automáticos de tus actividades en Calendar.</p>
             </div>
             <button 
              onClick={handleLogin}
              className="mt-4 sm:ml-auto sm:mt-0 whitespace-nowrap bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95"
             >
               Conectar Google
             </button>
           </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Course Selector Column */}
          <aside className="lg:col-span-4 lg:space-y-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-400 uppercase tracking-widest px-2">Mis Cursos</h2>
            <div className="space-y-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
              {COURSES.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all",
                    selectedCourseId === course.id 
                      ? "bg-indigo-50 text-indigo-700 font-medium" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className={cn("h-5 w-5", selectedCourseId === course.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                    <span className="truncate max-w-[200px]">{course.name}</span>
                  </div>
                  <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", selectedCourseId === course.id ? "rotate-90 text-indigo-400" : "text-slate-300 opacity-0 group-hover:opacity-100")} />
                </button>
              ))}
            </div>
          </aside>

          {/* Activities Column */}
          <section className="lg:col-span-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedCourse.name}</h2>
              <p className="text-slate-500 font-medium italic">Mostrando cronograma de actividades</p>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {selectedCourse.activities.map((activity, index) => {
                  const status = getActivityStatus(activity.endDate);
                  const isSynced = syncedActivities.has(activity.id);
                  const eventDate = getEventDate(activity.endDate);
                  const reminders = getReminders(activity.endDate);

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-xl hover:shadow-slate-200/50"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider", status.color)}>
                              <status.icon className="h-3.5 w-3.5" />
                              {status.label}
                            </span>
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">Peso: {activity.weight} puntos</span>
                          </div>
                          
                          <h3 className="text-lg font-bold text-slate-900">
                            {activity.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                            {activity.description}
                          </p>

                          <div className="mt-4 grid grid-cols-2 gap-4 sm:flex sm:gap-12 text-xs">
                            <div>
                              <p className="font-bold text-slate-400 mb-1 uppercase tracking-tighter">Apertura</p>
                              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(parseISO(activity.startDate))}
                              </div>
                            </div>
                            <div>
                               <p className="font-bold text-slate-400 mb-1 uppercase tracking-tighter">Cierre</p>
                               <div className="flex items-center gap-1.5 font-medium text-rose-600">
                                <Calendar className="h-3.5 w-3.5 text-rose-400" />
                                {formatDate(parseISO(activity.endDate))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 sm:mt-0 sm:text-right">
                          {isSynced ? (
                             <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700 ring-1 ring-emerald-100 shadow-sm">
                               <CheckCircle className="h-5 w-5" />
                               <div className="text-left leading-tight">
                                 <p className="text-sm font-bold">En Google Calendar</p>
                                 <p className="text-[10px] opacity-80">Sincronizado con éxito</p>
                               </div>
                             </div>
                          ) : (
                            <button
                              disabled={isSyncing === activity.id}
                              onClick={() => handleSync(activity)}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200"
                              )}
                            >
                              {isSyncing === activity.id ? (
                                <Clock className="h-5 w-5 animate-spin" />
                              ) : (
                                <Calendar className="h-5 w-5" />
                              )}
                              {isSyncing === activity.id ? 'Sincronizando...' : 'Sincronizar a Google'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded View for Programmed Reminders */}
                      {isSynced && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="mt-6 pt-6 border-t border-slate-100 overflow-hidden"
                        >
                          <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            <Bell className="h-4 w-4" />
                            Plan de Seguimiento Programado
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 p-4">
                              <p className="text-[10px] font-bold text-indigo-500 uppercase mb-2">Evento de Entrega (Fecha límite)</p>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                  {format(eventDate, 'd')}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{activity.name}</p>
                                  <p className="text-[10px] text-slate-500 italic">Fecha: {formatDate(eventDate)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {reminders.map((r, i) => (
                                <div key={i} className="flex items-center justify-between text-[11px] bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                  <span className="font-semibold text-slate-600">{r.label}</span>
                                  <span className="text-slate-400 font-mono tracking-tighter">{format(r.date, 'dd/MM')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-10 px-4 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 grayscale opacity-40">
            <Calendar className="h-5 w-5" />
            <span className="font-bold tracking-tighter">UNAD ACTIVITY MANAGER</span>
          </div>
          <p className="text-sm text-slate-500 flex items-center justify-center gap-1">
            Gestión automática de cronogramas <ExternalLink className="h-3 w-3" />
          </p>
        </div>
      </footer>
    </div>
  );
}

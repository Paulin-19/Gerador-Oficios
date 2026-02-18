import { BrowserRouter, Routes, Route, Link, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { FileText, Users, Building2, History, LayoutDashboard } from 'lucide-react';

// Seus componentes
import { GeradorTab } from '@/components/gerador/GeradorTab';
import { GeradorOficiosTab } from '@/components/gerador/GeradorOficiosTab';
import { ConselhosTab } from '@/components/conselhos/ConselhosTab';
import { FormandosTab } from '@/components/formandos/FormandosTab';
import NotFound from '@/pages/NotFound';

const Layout = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Gerar Ofício', icon: <FileText size={20} /> },
    { path: '/conselhos', label: 'Conselhos', icon: <Building2 size={20} /> },
    { path: '/formandos', label: 'Formandos', icon: <Users size={20} /> },
    { path: '/historico', label: 'Histórico', icon: <History size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      
      {/* BARRA LATERAL ESCURA (Igual ao print) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-10 border-r border-slate-800">
        
        {/* Logo / Título */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">Ofícios</h1>
            <span className="text-xs text-slate-400">Gerador de Documentos</span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' // Ativo: Azul
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white' // Inativo: Cinza
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé do Menu */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          &copy; 2026 Gestão NEAD
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 md:ml-64 p-8 overflow-x-hidden bg-slate-50/50">
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<GeradorTab />} />
          <Route path="/historico" element={<GeradorOficiosTab />} />
          <Route path="/conselhos" element={<ConselhosTab />} />
          <Route path="/formandos" element={<FormandosTab />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
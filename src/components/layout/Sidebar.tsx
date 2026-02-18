import { FileText, Users, Building2, FilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TabType } from '@/types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const menuItems = [
  { id: 'gerar', label: 'Gerar Ofício', icon: FilePlus, description: 'Criar novo documento' },
  { id: 'conselhos', label: 'Conselhos', icon: Building2, description: 'Gerenciar conselhos' },
  { id: 'formandos', label: 'Formandos', icon: Users, description: 'Lista de formandos' },
  { id: 'oficios', label: 'Histórico', icon: FileText, description: 'Documentos gerados' },
] as const;

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 min-w-[256px] max-w-[256px] flex-shrink-0 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
      {/* Cabeçalho da Sidebar */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex-shrink-0 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-lg leading-tight truncate">Gerador de<br />Ofícios</h1>
          </div>
        </div>
      </div>

      {/* Navegação - overflow-y-auto caso tenha muitos itens no futuro */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id as TabType)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left group',
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="font-medium text-sm truncate">{item.label}</span>
              <span className="text-[10px] text-slate-500 truncate group-hover:text-slate-300">
                {item.description}
              </span>
            </div>
          </button>
        ))}
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-slate-800">
        <div className="px-3 py-2 rounded-lg bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Sistema Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
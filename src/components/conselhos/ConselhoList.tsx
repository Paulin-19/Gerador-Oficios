import { Conselho } from '@/types';
import { Trash2, Pencil, Building2, MapPin, User, Briefcase, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ConselhoListProps {
  conselhos: Conselho[];
  onDelete: (id: string) => void;
  onEdit: (conselho: Conselho) => void;
  selecionados: string[];
  setSelecionados: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ConselhoList({ conselhos, onDelete, onEdit, selecionados, setSelecionados }: ConselhoListProps) {

  const toggleTodos = (checked: boolean) => {
    setSelecionados(checked ? conselhos.map(c => c.id) : []);
  };

  const toggleUm = (id: string, checked: boolean) => {
    setSelecionados(prev => checked ? [...prev, id] : prev.filter(item => item !== id));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="p-4 w-10">
                <Checkbox 
                  checked={selecionados.length === conselhos.length && conselhos.length > 0}
                  onCheckedChange={(checked) => toggleTodos(!!checked)}
                />
              </th>
              <th className="px-4 py-3">Conselho / Entidade</th>
              <th className="px-4 py-3 text-center">UF</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3 text-right pr-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {conselhos.map((item) => (
              <tr 
                key={item.id} 
                className={`transition-all duration-200 ${selecionados.includes(item.id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'}`}
              >
                <td className="p-4">
                  <Checkbox 
                    checked={selecionados.includes(item.id)}
                    onCheckedChange={(checked) => toggleUm(item.id, !!checked)}
                  />
                </td>
                
                {/* Nome do Conselho */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                      <Building2 size={16} />
                    </div>
                    <span className="font-bold text-slate-800">{item.nome}</span>
                  </div>
                </td>
                
                {/* Estado (Badge) */}
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center gap-1 text-slate-600 font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    <MapPin size={10} />
                    {item.estado}
                  </div>
                </td>

                {/* Responsável */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <User size={14} className="text-slate-400" />
                    <span className="font-medium text-xs">{item.responsavel}</span>
                  </div>
                </td>

                {/* Cargo */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Briefcase size={14} className="text-slate-300" />
                    <span className="text-xs uppercase font-semibold">{item.cargo}</span>
                  </div>
                </td>

                {/* Ações */}
                <td className="px-4 py-3 text-right pr-4 space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { if(confirm('Excluir?')) onDelete(item.id); }} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {conselhos.length === 0 && (
          <div className="p-16 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-300" size={24} />
            </div>
            <p className="text-slate-400 text-sm">Nenhum conselho cadastrado.</p>
          </div>
        )}
      </div>
      
      <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
        <span>{conselhos.length} registros</span>
        {selecionados.length > 0 && <span className="text-blue-500 font-bold">{selecionados.length} selecionados</span>}
      </div>
    </div>
  );
}
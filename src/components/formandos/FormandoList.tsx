import { Formando } from '@/types';
import { Trash2, Pencil, GraduationCap, MapPin, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface FormandoListProps {
  formandos: Formando[];
  onDelete: (id: string) => void;
  onEdit: (formando: Formando) => void;
  selecionados: string[];
  setSelecionados: React.Dispatch<React.SetStateAction<string[]>>;
}

export function FormandoList({ formandos, onDelete, onEdit, selecionados, setSelecionados }: FormandoListProps) {

  // Função para formatar data ISO para o padrão brasileiro
  const formatarData = (data: string) => {
    if (!data || data === '') return '---';
    const partes = data.split('-');
    if (partes.length !== 3) return data;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  };

  const toggleTodos = (checked: boolean) => {
    if (checked) {
      setSelecionados(formandos.map(f => f.id));
    } else {
      setSelecionados([]);
    }
  };

  const toggleUm = (id: string, checked: boolean) => {
    if (checked) {
      setSelecionados(prev => [...prev, id]);
    } else {
      setSelecionados(prev => prev.filter(item => item !== id));
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="p-4 w-10">
                <Checkbox
                  checked={selecionados.length === formandos.length && formandos.length > 0}
                  onCheckedChange={(checked) => toggleTodos(!!checked)}
                />
              </th>
              <th className="px-4 py-3">RA / Nome</th>
              <th className="px-4 py-3">Curso</th>
              <th className="px-4 py-3 text-center">UF</th>
              <th className="px-4 py-3">Conclusão</th>
              <th className="px-4 py-3">Colação</th>
              <th className="px-4 py-3 text-right pr-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {formandos.map((formando) => (
              <tr
                key={formando.id}
                className={`transition-all duration-200 ${selecionados.includes(formando.id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'}`}
              >
                <td className="p-4">
                  <Checkbox
                    checked={selecionados.includes(formando.id)}
                    onCheckedChange={(checked) => toggleUm(formando.id, !!checked)}
                  />
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">{formando.nome}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">RA: {formando.ra}</div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 text-xs">
                  <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded font-medium">
                    {formando.curso}
                  </span>
                </td>

                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center gap-1 text-slate-500 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">
                    <MapPin size={10} />
                    {formando.estado || '--'}
                  </div>
                </td>

                <td className="px-4 py-3 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-400" />
                    {formatarData(formando.dataConclusao)}
                  </div>
                </td>

                <td className="px-4 py-3 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-400" />
                    {formatarData(formando.dataColacao || '')}
                  </div>
                </td>

                <td className="px-4 py-3 text-right pr-4 space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(formando)}
                    className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { if (confirm('Excluir este formando?')) onDelete(formando.id); }}
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {formandos.length === 0 && (
          <div className="p-16 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-300" size={24} />
            </div>
            <p className="text-slate-400 text-sm">Nenhum formando encontrado na base de dados.</p>
          </div>
        )}
      </div>

      <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
        <span>{formandos.length} registros no total</span>
        {selecionados.length > 0 && (
          <span className="text-blue-500 font-bold">{selecionados.length} selecionados</span>
        )}
      </div>
    </div>
  );
}
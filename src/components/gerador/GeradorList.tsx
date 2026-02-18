import { FileText, Printer, User, Building2, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

// Definição do Tipo (Pode ser importado de @/types futuramente)
export interface Documento {
  id: string;
  protocolo: string;
  conselho: string;
  aluno: string;
  dataEmissao: string;
  status: string;
}

interface GeradorListProps {
  documentos: Documento[];
  selecionados: string[];
  onToggleOne: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}

export function GeradorList({ documentos, selecionados, onToggleOne, onToggleAll }: GeradorListProps) {
  const todosMarcados = documentos.length > 0 && selecionados.length === documentos.length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="p-4 w-10">
                <Checkbox 
                  checked={todosMarcados} 
                  onCheckedChange={(checked) => onToggleAll(!!checked)} 
                />
              </th>
              <th className="px-4 py-3">Protocolo</th>
              <th className="px-4 py-3">Destinatário</th>
              <th className="px-4 py-3">Aluno Relacionado</th>
              <th className="px-4 py-3">Emissão</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right pr-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documentos.map((item) => (
              <tr 
                key={item.id} 
                className={`transition-all duration-200 ${selecionados.includes(item.id) ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`}
              >
                <td className="p-4">
                  <Checkbox 
                    checked={selecionados.includes(item.id)} 
                    onCheckedChange={() => onToggleOne(item.id)} 
                  />
                </td>
                
                {/* Protocolo */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 shadow-sm">
                      <FileText size={16} />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700">{item.protocolo}</span>
                  </div>
                </td>
                
                {/* Conselho */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">{item.conselho}</span>
                  </div>
                </td>

                {/* Aluno */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User size={14} className="text-slate-400" />
                    <span className="text-xs font-medium">{item.aluno}</span>
                  </div>
                </td>

                {/* Data */}
                <td className="px-4 py-3 text-slate-500 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {item.dataEmissao}
                  </div>
                </td>

                {/* Status Badge Moderno */}
                <td className="px-4 py-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm ${
                    item.status === 'enviado' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {item.status === 'enviado' ? 'ENVIADO' : 'PENDENTE'}
                  </span>
                </td>

                {/* Ações */}
                <td className="px-4 py-3 text-right pr-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                    <Printer size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Estado Vazio */}
        {documentos.length === 0 && (
          <div className="p-16 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Search className="text-slate-300" size={24} />
            </div>
            <p className="text-slate-500 font-medium">Nenhum ofício encontrado.</p>
            <p className="text-slate-400 text-sm mt-1">Tente ajustar os filtros de busca.</p>
          </div>
        )}
      </div>
      
      {/* Rodapé da Tabela */}
      <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
        <span>Mostrando {documentos.length} registros</span>
        {selecionados.length > 0 && (
          <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            {selecionados.length} selecionados
          </span>
        )}
      </div>
    </div>
  );
}
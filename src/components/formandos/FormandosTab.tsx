import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormandos } from '@/hooks/useFormandos';
import { FormandoList } from './FormandoList';
import { FormandoForm } from './FormandoForm';
import { ImportFormandosModal } from './ImportFormandosModal';
import { Plus, Search, FileSpreadsheet, Trash2, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Formando } from '@/types';

export function FormandosTab() {
  const { formandos, addFormando, removeFormando, updateFormando, importFormandosBatch } = useFormandos();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [cursoSelecionado, setCursoSelecionado] = useState('todos');
  const [formandoEmEdicao, setFormandoEmEdicao] = useState<Formando | null>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const cursosDisponiveis = useMemo(() => {
    const cursos = formandos.map(f => f.curso).filter(Boolean);
    return Array.from(new Set(cursos)).sort();
  }, [formandos]);

  const formandosFiltrados = formandos.filter(f => {
    const bateBusca = f.nome.toLowerCase().includes(busca.toLowerCase()) || 
                     f.ra.toLowerCase().includes(busca.toLowerCase());
    const bateCurso = cursoSelecionado === 'todos' || f.curso === cursoSelecionado;
    return bateBusca && bateCurso;
  });

  const handleExcluirMassa = async () => {
    if (confirm(`Deseja excluir os ${selecionados.length} selecionados?`)) {
      for (const id of selecionados) {
        await removeFormando(id);
      }
      setSelecionados([]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Container Superior de Ações */}
      <div className="relative flex justify-end items-start h-12">
        <div className="flex gap-3">
          {/* BOTÃO IMPORTAR EXCEL - Estilo Renovado */}
          <Button 
            variant="outline" 
            onClick={() => setIsImportOpen(true)} 
            className="gap-2 border-green-200 text-green-700 bg-white hover:bg-green-50 hover:border-green-300 transition-all shadow-sm active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> 
            <span className="font-semibold">Importar EXCEL</span>
          </Button>
          
          <Button 
            onClick={() => { setFormandoEmEdicao(null); setIsFormOpen(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> 
            <span className="font-semibold">Novo Formando</span>
          </Button>
        </div>

        {/* BOTÃO EXCLUIR FLUTUANTE - Estilo "Bontinho" */}
        {selecionados.length > 0 && (
          <div className="absolute top-14 right-0 z-10">
            <Button 
              onClick={handleExcluirMassa}
              className="bg-red-500 hover:bg-red-600 text-white gap-2 shadow-lg border-2 border-white animate-in slide-in-from-right-4 duration-300 rounded-full px-6"
            >
              <Trash2 size={16} />
              <span className="font-bold">Excluir {selecionados.length} selecionado(s)</span>
            </Button>
          </div>
        )}
      </div>

      {/* BARRA DE FILTROS - Visual mais "Clean" */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-50/50">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Buscar por nome ou RA..." 
            className="pl-10 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-64 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={cursoSelecionado} onValueChange={setCursoSelecionado}>
            <SelectTrigger className="bg-white border-slate-200 rounded-xl">
              <SelectValue placeholder="Todos os cursos" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todos">Todos os cursos</SelectItem>
              {cursosDisponiveis.map(curso => (
                <SelectItem key={curso} value={curso}>{curso}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABELA - Com bordas mais arredondadas e sombra leve */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <FormandoList 
          formandos={formandosFiltrados} 
          onDelete={removeFormando}
          onEdit={(f) => { setFormandoEmEdicao(f); setIsFormOpen(true); }}
          selecionados={selecionados}
          setSelecionados={setSelecionados}
        />
      </div>

      {/* MODAIS */}
      {isFormOpen && (
        <FormandoForm 
          initialData={formandoEmEdicao || undefined}
          onClose={() => setIsFormOpen(false)} 
          onSave={async (d) => {
            if (formandoEmEdicao) await updateFormando(formandoEmEdicao.id, d);
            else await addFormando(d);
            setIsFormOpen(false);
          }} 
        />
      )}
      {isImportOpen && (
        <ImportFormandosModal onClose={() => setIsImportOpen(false)} onImport={importFormandosBatch} />
      )}
    </div>
  );
}
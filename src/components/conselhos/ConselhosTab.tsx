import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConselhos } from '@/hooks/useConselhos';
import { ConselhoList } from './ConselhoList';
import { ConselhoForm } from './ConselhoForm';
import { ImportConselhosModal } from './ImportConselhosModal';
import { Plus, Search, FileSpreadsheet, Trash2, Filter } from 'lucide-react';
import { Conselho } from '@/types';

export function ConselhosTab() {
  const { conselhos, addConselho, removeConselho, updateConselho, importConselhosBatch } = useConselhos();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [conselhoEmEdicao, setConselhoEmEdicao] = useState<Conselho | null>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // ✅ FILTRO SEGURO: Previne erros se algum campo vier nulo do banco
  const conselhosFiltrados = conselhos.filter(c => {
    const termo = busca.toLowerCase();
    const nome = (c.nome || '').toLowerCase();
    const responsavel = (c.responsavel || '').toLowerCase();
    const cargo = (c.cargo || '').toLowerCase();
    
    return nome.includes(termo) || 
           responsavel.includes(termo) ||
           cargo.includes(termo);
  });

  const handleExcluirMassa = async () => {
    if (confirm(`Deseja excluir os ${selecionados.length} conselhos selecionados?`)) {
      for (const id of selecionados) {
        await removeConselho(id);
      }
      setSelecionados([]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. TOPO: Botões + Espaço para o botão flutuante (mb-10) */}
      <div className="relative flex justify-end items-start h-10 mb-10">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsImportOpen(true)} 
            className="gap-2 border-green-200 text-green-700 bg-white hover:bg-green-50 shadow-sm active:scale-95 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> 
            <span className="font-semibold">Importar EXCEL</span>
          </Button>
          
          <Button 
            onClick={() => { setConselhoEmEdicao(null); setIsFormOpen(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> 
            <span className="font-semibold">Novo Conselho</span>
          </Button>
        </div>

        {/* Botão de Exclusão em Massa (Flutuante) */}
        {selecionados.length > 0 && (
          <div className="absolute top-14 right-0 z-20">
            <Button 
              onClick={handleExcluirMassa}
              className="bg-red-500 hover:bg-red-600 text-white gap-2 shadow-xl border-2 border-white animate-in slide-in-from-top-2 duration-300 rounded-full px-6"
            >
              <Trash2 size={16} />
              <span className="font-bold">Excluir {selecionados.length} selecionado(s)</span>
            </Button>
          </div>
        )}
      </div>

      {/* 2. BUSCA: Visual Clean e Placeholder correto */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Buscar por Conselho, Responsável ou Cargo..." 
            className="pl-10 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl shadow-sm h-10"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* 3. LISTAGEM */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <ConselhoList 
          conselhos={conselhosFiltrados} 
          onDelete={removeConselho}
          onEdit={(c) => { setConselhoEmEdicao(c); setIsFormOpen(true); }}
          selecionados={selecionados}
          setSelecionados={setSelecionados}
        />
      </div>

      {/* MODAIS */}
      {isFormOpen && (
        <ConselhoForm 
          initialData={conselhoEmEdicao || undefined}
          onClose={() => setIsFormOpen(false)} 
          onSave={async (d) => {
            if (conselhoEmEdicao) await updateConselho(conselhoEmEdicao.id, d);
            else await addConselho(d);
            setIsFormOpen(false);
          }} 
        />
      )}
      
      {isImportOpen && (
        <ImportConselhosModal 
          onClose={() => setIsImportOpen(false)} 
          onImport={importConselhosBatch} 
        />
      )}
    </div>
  );
}
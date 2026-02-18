import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Conselho } from '@/types';
import { Upload, FileSearch, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportConselhosProps {
  // ✅ Ajustado para omitir apenas o 'id' (ou createdAt se houver)
  onImport: (conselhos: Omit<Conselho, 'id'>[]) => void;
  onCancel: () => void;
}

export function ImportConselhos({ onImport, onCancel }: ImportConselhosProps) {
  const [csvData, setCsvData] = useState('');
  const [preview, setPreview] = useState<Omit<Conselho, 'id'>[]>([]);
  const { toast } = useToast();

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const conselhos: Omit<Conselho, 'id'>[] = [];
    
    // Pula o cabeçalho se ele contiver a palavra "nome"
    const startIndex = lines[0].toLowerCase().includes('nome') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Espera formato: Nome, Estado, Responsavel, Cargo
      const parts = line.split(',');
      
      if (parts.length >= 4) {
        conselhos.push({
          nome: parts[0].trim(),
          // ✅ Ajuste: Pega o primeiro estado e garante que seja apenas uma string (Ex: "PR")
          estado: parts[1].split(';')[0].trim().toUpperCase().substring(0, 2),
          responsavel: parts[2].trim(),
          // ✅ Ajuste: Nome do campo é 'cargo', conforme seu formulário de cadastro
          cargo: parts[3].trim(),
        });
      }
    }
    return conselhos;
  };

  const handlePreview = () => {
    try {
      const data = parseCSV(csvData);
      if (data.length === 0) {
        toast({ 
          title: "Erro na leitura", 
          description: "Certifique-se de que os dados estão separados por vírgula.",
          variant: "destructive" 
        });
        return;
      }
      setPreview(data);
    } catch (error) {
      toast({ title: "Erro ao processar CSV", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-xl bg-white shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-2">
        <FileSearch className="text-blue-600 w-5 h-5" />
        <h3 className="text-lg font-bold text-slate-800">Importar Conselhos (CSV)</h3>
      </div>
      
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Formato Esperado:</p>
        <code className="text-[11px] text-blue-700">Nome, Estado, Responsável, Cargo</code>
      </div>
      
      {!preview.length ? (
        <Textarea 
          placeholder="Cole aqui os dados copiados da sua planilha..." 
          value={csvData}
          onChange={e => setCsvData(e.target.value)}
          rows={8}
          className="font-mono text-sm focus-visible:ring-blue-500"
        />
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b text-xs font-bold text-slate-500 flex justify-between">
            <span>{preview.length} Registros Identificados</span>
            <button onClick={() => setPreview([])} className="text-blue-600 hover:underline">Limpar</button>
          </div>
          <div className="max-h-60 overflow-y-auto p-0">
            <table className="w-full text-xs text-left">
              <thead className="bg-white sticky top-0 border-b">
                <tr>
                  <th className="px-4 py-2">Conselho</th>
                  <th className="px-4 py-2">UF</th>
                  <th className="px-4 py-2">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.map((c, i) => (
                  <tr key={i} className="hover:bg-blue-50/30">
                    <td className="px-4 py-2 font-medium">{c.nome}</td>
                    <td className="px-4 py-2">{c.estado}</td>
                    <td className="px-4 py-2 text-slate-500">{c.responsavel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel} className="text-slate-500">Cancelar</Button>
        {preview.length === 0 ? (
          <Button onClick={handlePreview} className="bg-blue-600 hover:bg-blue-700">
            Processar Dados
          </Button>
        ) : (
          <Button onClick={() => onImport(preview)} className="bg-green-600 hover:bg-green-700">
            <Upload className="w-4 h-4 mr-2" /> Confirmar Importação
          </Button>
        )}
      </div>
    </div>
  );
}
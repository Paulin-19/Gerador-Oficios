import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, FileSpreadsheet, Check, UploadCloud } from 'lucide-react';
import { Conselho } from '@/types'; // Certifique-se de que o tipo existe
import * as XLSX from 'xlsx';

interface ImportConselhosModalProps {
  onClose: () => void;
  onImport: (dados: Omit<Conselho, 'id'>[]) => Promise<void>;
}

export function ImportConselhosModal({ onClose, onImport }: ImportConselhosModalProps) {
  const [previewData, setPreviewData] = useState<Omit<Conselho, 'id'>[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processarDadosExcel = (dadosBrutos: any[]) => {
    const dadosFormatados: Omit<Conselho, 'id'>[] = dadosBrutos.map((row: any) => {
      
      // ✅ Busca Inteligente: Ignora acentos, espaços e maiúsculas
      const findValue = (keywords: string[]) => {
        const keys = Object.keys(row);
        const foundKey = keys.find(k => {
          const normalizedKey = k.trim().toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
          return keywords.some(word => normalizedKey.includes(word.toUpperCase()));
        });
        return foundKey ? row[foundKey] : '';
      };

      return {
        // Mapeamento flexível das colunas
        nome: String(findValue(['NOME', 'CONSELHO', 'ENTIDADE', 'ORGAO']) || '').trim(),
        estado: String(findValue(['ESTADO', 'UF', 'SIGLA']) || '').trim(),
        responsavel: String(findValue(['RESPONSAVEL', 'PRESIDENTE', 'NOME DO RESPONSAVEL', 'CONTATO']) || '').trim(),
        cargo: String(findValue(['CARGO', 'FUNCAO', 'TITULO']) || '').trim(),
      };
    });

    // Filtra para garantir que pelo menos o Nome do conselho exista
    const filtrados = dadosFormatados.filter(c => c.nome);
    setPreviewData(filtrados);
    setStep('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      processarDadosExcel(data);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg text-green-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-slate-900">Importar Conselhos</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {step === 'upload' ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 py-12 border-2 border-dashed border-slate-300 rounded-xl bg-white">
              <UploadCloud className="w-12 h-12 text-blue-500 mb-4" />
              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-slate-700">Selecione a Planilha Excel</h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  O sistema buscará as colunas: <br/>
                  <strong>Nome do Conselho, Estado (UF), Responsável e Cargo.</strong>
                </p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 px-10 shadow-lg shadow-blue-100">
                Escolher Arquivo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                <h4 className="font-bold text-slate-700">Conferência: {previewData.length} registros encontrados</h4>
                <Button variant="outline" size="sm" onClick={() => setStep('upload')}>Trocar Arquivo</Button>
              </div>

              <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 border-b text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Nome do Conselho</th>
                      <th className="px-4 py-3 text-center">UF</th>
                      <th className="px-4 py-3">Responsável</th>
                      <th className="px-4 py-3">Cargo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800">{item.nome}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                            {item.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.responsavel}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs uppercase font-medium">{item.cargo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="p-6 border-t flex justify-end gap-3 bg-white">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {step === 'preview' && (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white px-8" 
              onClick={async () => {
                setLoading(true);
                try {
                  await onImport(previewData);
                  onClose(); // ✅ Fecha a aba automaticamente ao terminar
                } catch (error) {
                  console.error("Erro ao importar conselhos:", error);
                  alert("Erro ao salvar dados.");
                } finally {
                  setLoading(false);
                }
              }} 
              disabled={loading}
            >
              <Check className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Confirmar Importação'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, FileSpreadsheet, Check, UploadCloud } from 'lucide-react';
import { Formando } from '@/types';
import * as XLSX from 'xlsx';

interface ImportFormandosModalProps {
  onClose: () => void;
  onImport: (dados: Omit<Formando, 'id'>[]) => Promise<void>;
}

export function ImportFormandosModal({ onClose, onImport }: ImportFormandosModalProps) {
  const [previewData, setPreviewData] = useState<Omit<Formando, 'id'>[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processarDadosExcel = (dadosBrutos: any[]) => {
    const dadosFormatados: Omit<Formando, 'id'>[] = dadosBrutos.map((row: any) => {
      
      // Busca inteligente: ignora acentos e espaços
      const findValue = (keywords: string[]) => {
        const keys = Object.keys(row);
        const foundKey = keys.find(k => {
          const normalizedKey = k.trim().toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
          return keywords.some(word => normalizedKey.includes(word.toUpperCase()));
        });
        return foundKey ? row[foundKey] : '';
      };

      // Conversão de data do Excel para YYYY-MM-DD
      const formatarDataExcel = (val: any) => {
        if (!val) return '';
        let d: Date;
        if (val instanceof Date) {
          d = val;
        } else if (typeof val === 'number') {
          // Converte número serial do Excel
          d = new Date(Math.round((val - 25569) * 86400 * 1000));
        } else {
          d = new Date(val);
        }
        if (isNaN(d.getTime())) return '';
        // Ajuste de fuso horário
        const dataLocal = new Date(d.getTime() + Math.abs(d.getTimezoneOffset() * 60000));
        return dataLocal.toISOString().split('T')[0];
      };

      return {
        ra: String(findValue(['RA', 'REGISTRO', 'MATRICULA']) || '').trim(),
        nome: String(findValue(['NOME', 'ALUNO', 'FORMANDO']) || '').trim(),
        curso: String(findValue(['CURSO']) || '').trim(),
        estado: String(findValue(['ESTADO', 'UF', 'ESTADO(UF)']) || '').trim(),
        polo: String(findValue(['POLO']) || '').trim(),
        dataConclusao: formatarDataExcel(findValue(['CONCLUSAO', 'DATA DA CONCLUSAO'])),
        dataColacao: formatarDataExcel(findValue(['COLACAO', 'DATA DE COLACAO']))
      };
    });

    const filtrados = dadosFormatados.filter(f => f.ra && f.nome);
    setPreviewData(filtrados);
    setStep('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      processarDadosExcel(data);
    };
    reader.readAsBinaryString(file);
  };

  const exibirDataBR = (dataISO: string) => {
    if (!dataISO || dataISO === '') return '---';
    const partes = dataISO.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg text-green-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl">Importação de Formandos</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* CORPO / TABELA DE CONFERÊNCIA */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {step === 'upload' ? (
            <div className="h-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-300 rounded-xl bg-white">
              <UploadCloud className="w-12 h-12 text-blue-500 mb-4" />
              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold">Selecione a Planilha Excel</h4>
                <p className="text-sm text-slate-500">O sistema mapeará as colunas: RA, Nome, Curso, UF, Polo, Data Conclusão e Data Colação.</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 px-10">Escolher Arquivo</Button>
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
                      <th className="px-4 py-3">RA</th>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Curso</th>
                      <th className="px-4 py-3 text-center">UF</th>
                      <th className="px-4 py-3">Conclusão</th>
                      <th className="px-4 py-3">Colação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/50">
                        <td className="px-4 py-3 font-mono text-xs">{item.ra}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{item.nome}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{item.curso}</td>
                        <td className="px-4 py-3 text-center">{item.estado}</td>
                        <td className="px-4 py-3 text-blue-600 font-bold">{exibirDataBR(item.dataConclusao)}</td>
                        <td className="px-4 py-3 text-blue-600 font-bold">{exibirDataBR(item.dataColacao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ COM FECHAMENTO AUTOMÁTICO */}
        <div className="p-6 border-t flex justify-end gap-3 bg-white">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {step === 'preview' && (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white px-10" 
              onClick={async () => {
                setLoading(true);
                try {
                  // ✅ Tenta importar os dados
                  await onImport(previewData);
                  // ✅ Se funcionar, fecha a aba
                  onClose();
                } catch (error) {
                  console.error("Erro na importação:", error);
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
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
      
      const findValue = (label: string) => {
        const key = Object.keys(row).find(k => k.trim().toUpperCase() === label.toUpperCase());
        return key ? row[key] : '';
      };

      const formatarDataExcel = (val: any) => {
        if (!val) return '';
        try {
          const d = new Date(val);
          if (isNaN(d.getTime())) return '';
          // Ajuste para evitar que a data mude de dia devido ao fuso horário
          const dataCorrigida = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
          return dataCorrigida.toISOString().split('T')[0];
        } catch { return ''; }
      };

      // ✅ CORREÇÃO: Nomes das propriedades devem ser IDÊNTICOS aos da sua Interface (src/types/index.ts)
      return {
        ra: String(findValue('RA') || '').trim(),
        nome: String(findValue('NOME') || '').trim(),
        curso: String(findValue('CURSO') || '').trim(),
        estado: String(findValue('ESTADO(UF)') || '').trim(),
        polo: String(findValue('POLO') || '').trim(),
        dataConclusao: formatarDataExcel(findValue('DATA DA CONCLUSÃO')),
        dataColacao: formatarDataExcel(findValue('DATA DE COLAÇÃO'))
      };
    });

    setPreviewData(dadosFormatados.filter(f => f.ra && f.nome));
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

  // ✅ CORREÇÃO: Função para exibir na tela dd/mm/aaaa
  const exibirDataBR = (dataISO: string) => {
    if (!dataISO || dataISO === '') return '-';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg text-green-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl">Importação de Formandos</h3>
          </div>
          <Button variant="ghost" onClick={onClose}><X /></Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === 'upload' ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-slate-50">
              <UploadCloud className="w-12 h-12 text-blue-500 mb-4" />
              <p className="text-sm text-slate-600 mb-4 text-center">
                A planilha deve conter exatamente estes cabeçalhos na 1ª linha:<br/>
                <strong>RA | NOME | CURSO | ESTADO(UF) | POLO | DATA DA CONCLUSÃO | DATA DE COLAÇÃO</strong>
              </p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()}>Selecionar Planilha</Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-3">RA</th>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Curso</th>
                    <th className="px-4 py-3 text-center">UF</th>
                    <th className="px-4 py-3">Conclusão</th>
                    <th className="px-4 py-3">Colação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {previewData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30">
                      <td className="px-4 py-3 font-mono text-xs">{item.ra}</td>
                      <td className="px-4 py-3 font-bold">{item.nome}</td>
                      <td className="px-4 py-3 text-xs">{item.curso}</td>
                      <td className="px-4 py-3 text-center">{item.estado}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">
                        {exibirDataBR(item.dataConclusao)}
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-medium">
                        {exibirDataBR(item.dataColacao)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3 bg-slate-50">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {step === 'preview' && (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={async () => {
                setLoading(true);
                await onImport(previewData);
                setLoading(false);
              }} 
              disabled={loading}
            >
              <Check className="mr-2 h-4 w-4" /> 
              {loading ? 'Processando...' : 'Confirmar Importação'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
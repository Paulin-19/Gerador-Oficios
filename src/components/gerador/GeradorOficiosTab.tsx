import { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Download, Trash2, FileText, Calendar, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ✅ Importando a função nova 'atualizarListaOficios'
import { getOficios, atualizarListaOficios } from '@/lib/storage';
import { Oficio } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { DocumentPreview } from './DocumentPreview';
import { getLogosBase64 } from '@/lib/logoBase64';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function GeradorOficiosTab() {
  const [oficios, setOficios] = useState<Oficio[]>([]);
  const [busca, setBusca] = useState('');
  
  // Estado para os itens selecionados
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [selectedOficio, setSelectedOficio] = useState<Oficio | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [logos, setLogos] = useState<{ vitru: string; unicesumar: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    carregarOficios();
    getLogosBase64().then(setLogos);
  }, []);

  const carregarOficios = () => {
    const dados = getOficios();
    // Ordenação segura
    const ordenados = dados.sort((a, b) => {
        const dateA = new Date(a.data).getTime();
        const dateB = new Date(b.data).getTime();
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    });
    setOficios(ordenados);
  };

  const oficiosFiltrados = oficios.filter(o => 
    o.numero.toLowerCase().includes(busca.toLowerCase()) ||
    o.conselho.nome.toLowerCase().includes(busca.toLowerCase()) ||
    o.assunto.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === oficiosFiltrados.length && oficiosFiltrados.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(oficiosFiltrados.map(o => o.id));
    }
  };

  // ✅ CORRIGIDO: Exclusão Individual usando a chave correta
  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro do histórico?')) {
      const novosOficios = oficios.filter(o => o.id !== id);
      
      // Salva no LocalStorage usando a função correta
      atualizarListaOficios(novosOficios);
      
      // Atualiza o estado da tela
      setOficios(novosOficios);
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
      
      toast({ title: 'Ofício excluído', description: 'O registro foi removido.' });
    }
  };

  // ✅ CORRIGIDO: Exclusão em Massa usando a chave correta
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;

    if (confirm(`Tem certeza que deseja excluir ${selectedIds.length} ofícios selecionados?`)) {
      const novosOficios = oficios.filter(o => !selectedIds.includes(o.id));
      
      // Salva no LocalStorage usando a função correta
      atualizarListaOficios(novosOficios);
      
      setOficios(novosOficios);
      setSelectedIds([]); 
      
      toast({ title: 'Exclusão Concluída', description: `${selectedIds.length} ofícios foram removidos.` });
    }
  };

  const handleOpenPreview = (oficio: Oficio) => {
    setSelectedOficio(oficio);
    setIsPreviewOpen(true);
  };

  const handleDownloadPDF = async () => {
    const input = document.getElementById('historico-preview-content');
    if (!input) return;

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        height: input.scrollHeight,
        windowHeight: input.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / pdfWidth;
      const imgHeightInPdf = imgHeight / ratio;

      let heightLeft = imgHeightInPdf;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightInPdf;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;
      }

      const nomeSeguro = selectedOficio ? selectedOficio.numero.replace(/\//g, '-') : 'Documento';
      pdf.save(`Copia_Oficio_${nomeSeguro}.pdf`);
      toast({ title: "Download Concluído", description: "Cópia baixada." });
    } catch (error) {
      console.error("Erro ao baixar:", error);
      toast({ title: "Erro", description: "Falha ao gerar PDF.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Histórico de Ofícios</h2>
          <p className="text-slate-500">Consulte e gerencie os documentos emitidos</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto items-center">
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBatchDelete}
              className="animate-in fade-in slide-in-from-right-5 mr-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir ({selectedIds.length})
            </Button>
          )}

          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar..." 
              className="pl-9 bg-white"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <Checkbox 
                  checked={
                    oficiosFiltrados.length > 0 && 
                    selectedIds.length === oficiosFiltrados.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>

              <TableHead className="w-[180px]">Número / Data</TableHead>
              <TableHead>Conselho</TableHead>
              <TableHead>Formandos</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {oficiosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-slate-300" />
                    <p>Nenhum ofício encontrado.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              oficiosFiltrados.map((oficio) => (
                <TableRow 
                  key={oficio.id} 
                  className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(oficio.id) ? 'bg-blue-50/50' : ''}`}
                >
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={selectedIds.includes(oficio.id)}
                      onCheckedChange={() => toggleSelect(oficio.id)}
                      aria-label={`Selecionar ofício ${oficio.numero}`}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{oficio.numero}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {!isNaN(new Date(oficio.data).getTime()) 
                          ? format(new Date(oficio.data), "dd/MM/yyyy", { locale: ptBR })
                          : '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-medium">{oficio.conselho.nome}</span>
                      <span className="text-xs text-slate-500">{oficio.conselho.estado}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100">
                      {oficio.formandos.length}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{oficio.responsavelAssinatura}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleOpenPreview(oficio)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(oficio.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 outline-none border-0 shadow-2xl bg-slate-50">
          
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 relative z-10">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800">
                Visualização do Ofício
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                {selectedOficio?.numero || 'Carregando...'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                onClick={handleDownloadPDF} 
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
                size="sm"
              >
                <Download className="w-4 h-4" /> Baixar PDF
              </Button>

              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2.5 bg-slate-100 text-slate-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-all border border-slate-200 shadow-sm group"
                title="Fechar (Esc)"
              >
                <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-slate-200/50 p-8 flex justify-center items-start">
            {selectedOficio ? (
              <div 
                id="historico-preview-content"
                className="bg-white shadow-xl origin-top transition-transform duration-300"
                style={{ 
                  width: '210mm', 
                  minHeight: '297mm',
                  padding: '0',
                  transform: 'scale(0.85) translateY(0)',
                  marginBottom: '2rem'
                }}
              >
                <DocumentPreview
                  numeroOficio={selectedOficio.numero}
                  data={selectedOficio.data}
                  conselho={selectedOficio.conselho}
                  assunto={selectedOficio.assunto}
                  corpo={selectedOficio.corpo}
                  formandos={selectedOficio.formandos}
                  responsavelAssinatura={selectedOficio.responsavelAssinatura}
                  cargoAssinatura={selectedOficio.cargoAssinatura}
                  logos={logos}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                 <FileText className="w-10 h-10 animate-pulse" />
                 <p>Carregando documento...</p>
              </div>
            )}
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}
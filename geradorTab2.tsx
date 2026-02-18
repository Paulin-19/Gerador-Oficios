import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Bibliotecas
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Icons
import { FileText, Download, Eye, Building2, Users, Loader2, Layers, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Hooks e Serviços
import { useConselhos } from '@/hooks/useConselhos';
import { useFormandos } from '@/hooks/useFormandos';
import { DocumentPreview } from './DocumentPreview';
import { MODELO_CORPO_OFICIO } from '@/lib/constants';
import { getProximoNumeroOficio, saveOficio } from '@/lib/storage';
import { getLogosBase64 } from '@/lib/logoBase64';
import { Oficio } from '@/types';

export function GeradorTab() {
  const { conselhos } = useConselhos();
  const { formandos } = useFormandos();
  const { toast } = useToast();

  // Estados do Formulário
  const [selectedConselhoId, setSelectedConselhoId] = useState<string>('');
  const [selectedCursos, setSelectedCursos] = useState<string[]>([]);
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState(MODELO_CORPO_OFICIO);
  const [iniciaisColaborador, setIniciaisColaborador] = useState('');
  
  // Assinatura
  const [responsavelAssinatura, setResponsavelAssinatura] = useState('');
  const [cargoAssinatura, setCargoAssinatura] = useState('');

  // Estados de Controle
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState(''); 
  
  // MODO LOTE
  const [isBatchMode, setIsBatchMode] = useState(false);

  // Estados para renderização oculta
  const [oficioParaImpressao, setOficioParaImpressao] = useState<Oficio | null>(null);
  const [ultimoNumeroGerado, setUltimoNumeroGerado] = useState<string | null>(null);
  const [logos, setLogos] = useState<{ vitru: string; unicesumar: string } | null>(null);

  useEffect(() => {
    getLogosBase64().then(setLogos);
  }, []);

  // Efeito para download INDIVIDUAL
  useEffect(() => {
    if (oficioParaImpressao && !isBatchMode) {
      const gerar = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await generateSinglePDF(oficioParaImpressao.numero);
        setOficioParaImpressao(null); 
        setIsGenerating(false);
      };
      gerar();
    }
  }, [oficioParaImpressao, isBatchMode]);

  const cursosDisponiveis = useMemo(() => {
    return Array.from(new Set(formandos.map(f => f.curso))).sort();
  }, [formandos]);

  const selectedConselho = useMemo(() => {
    return conselhos.find((c) => c.id === selectedConselhoId);
  }, [conselhos, selectedConselhoId]);

  // Filtro INDIVIDUAL
  const filteredFormandosIndividual = useMemo(() => {
    if (selectedCursos.length === 0 || !selectedConselho) return [];
    return formandos.filter((f) => 
      selectedCursos.includes(f.curso) && f.estado === selectedConselho.estado
    );
  }, [formandos, selectedCursos, selectedConselho]);

  // Filtro LOTE
  const conselhosAptosParaLote = useMemo(() => {
    if (selectedCursos.length === 0) return [];
    const estadosComAlunos = new Set(
      formandos
        .filter(f => selectedCursos.includes(f.curso))
        .map(f => f.estado)
    );
    return conselhos.filter(c => estadosComAlunos.has(c.estado));
  }, [formandos, selectedCursos, conselhos]);

  // ✅ AQUI ESTÁ A ALTERAÇÃO: Seleção automática ao mudar o conselho
  const handleConselhoChange = (id: string) => {
    setSelectedConselhoId(id);
    const conselho = conselhos.find((c) => c.id === id);
    
    if (conselho) {
      // 1. Configura assinatura
      setResponsavelAssinatura(conselho.responsavel);
      setCargoAssinatura(conselho.cargo); 

      // 2. LÓGICA NOVA: Busca alunos desse estado e seleciona seus cursos automaticamente
      const alunosDoEstado = formandos.filter(f => f.estado === conselho.estado);
      
      if (alunosDoEstado.length > 0) {
        // Pega os cursos únicos desses alunos
        const cursosParaSelecionar = Array.from(new Set(alunosDoEstado.map(f => f.curso)));
        
        // Atualiza os cursos selecionados
        setSelectedCursos(cursosParaSelecionar);
        
        // Atualiza o assunto automaticamente
        setAssunto(`Envio de Relação de Formandos dos cursos de ${cursosParaSelecionar.join(', ')}`);
        
        toast({
          title: "Seleção Automática",
          description: `Cursos do estado ${conselho.estado} selecionados.`,
        });
      } else {
        // Se não tiver alunos nesse estado, limpa a seleção para evitar confusão
        setSelectedCursos([]);
        toast({
          variant: "destructive",
          title: "Atenção",
          description: `Não há formandos cadastrados no estado ${conselho.estado}.`,
        });
      }
    }
  };

  const handleCursoToggle = (curso: string) => {
    const newCursos = selectedCursos.includes(curso)
      ? selectedCursos.filter((c) => c !== curso)
      : [...selectedCursos, curso];
    setSelectedCursos(newCursos);
    if (newCursos.length > 0) {
      setAssunto(`Envio de Relação de Formandos dos cursos de ${newCursos.join(', ')}`);
    }
  };

  const createPDFBlob = async (elementId: string): Promise<{ blob: Blob | null }> => {
    const input = document.getElementById(elementId);
    if (!input) return { blob: null };

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
      
      return { blob: pdf.output('blob') };
    } catch (error) {
      console.error(error);
      return { blob: null };
    }
  };

  const generateSinglePDF = async (numeroProtocolo: string) => {
    const { blob } = await createPDFBlob('print-area-hidden');
    if (blob) {
      const nomeSeguro = numeroProtocolo.replace(/\//g, '-');
      saveAs(blob, `Oficio_${nomeSeguro}.pdf`);
      toast({ title: 'Sucesso!', description: `Ofício ${numeroProtocolo} salvo e baixado.` });
    } else {
      toast({ title: "Erro", description: "Falha ao gerar PDF.", variant: "destructive" });
    }
  };

  const handleGenerateIndividual = () => {
    if (!selectedConselho) return;
    setIsGenerating(true);
    
    const numero = getProximoNumeroOficio();
    const ano = new Date().getFullYear();
    const numeroOficio = `${String(numero).padStart(3, '0')}/${ano}/${iniciaisColaborador.toUpperCase()}/UNICESUMAR/NEAD`;

    const novoOficio: Oficio = {
      id: crypto.randomUUID(),
      numero: numeroOficio,
      data: new Date().toISOString(),
      conselho: selectedConselho,
      assunto,
      corpo,
      formandos: filteredFormandosIndividual,
      responsavelAssinatura,
      cargoAssinatura,
    };

    saveOficio(novoOficio);
    setUltimoNumeroGerado(numeroOficio);
    setOficioParaImpressao(novoOficio);
  };

  const handleGenerateBatch = async () => {
    if (conselhosAptosParaLote.length === 0) return;
    
    setIsGenerating(true);
    const zip = new JSZip();
    const folder = zip.folder(`Oficios_Gerados_${new Date().toISOString().slice(0,10)}`);
    
    let processados = 0;
    const total = conselhosAptosParaLote.length;

    try {
      for (const conselho of conselhosAptosParaLote) {
        processados++;
        setProgressText(`Gerando ${processados} de ${total}...`);

        const alunosDoConselho = formandos.filter(f => 
          selectedCursos.includes(f.curso) && f.estado === conselho.estado
        );

        if (alunosDoConselho.length === 0) continue;

        const numero = getProximoNumeroOficio();
        const ano = new Date().getFullYear();
        const numeroOficio = `${String(numero).padStart(3, '0')}/${ano}/${iniciaisColaborador.toUpperCase()}/UNICESUMAR/NEAD`;

        const oficioTemp: Oficio = {
          id: crypto.randomUUID(),
          numero: numeroOficio,
          data: new Date().toISOString(),
          conselho: conselho,
          assunto,
          corpo,
          formandos: alunosDoConselho,
          responsavelAssinatura: conselho.responsavel,
          cargoAssinatura: conselho.cargo,
        };

        saveOficio(oficioTemp);
        setOficioParaImpressao(oficioTemp);
        
        await new Promise(r => setTimeout(r, 200)); 

        const { blob } = await createPDFBlob('print-area-hidden');
        
        if (blob && folder) {
          const nomeArquivo = `Oficio_${numeroOficio.replace(/\//g, '-')}_${conselho.estado}.pdf`;
          folder.file(nomeArquivo, blob);
        }
      }

      setProgressText('Compactando arquivos...');
      const zipContent = await zip.generateAsync({ type: 'blob' });
      saveAs(zipContent, `Oficios_Lote_${new Date().getTime()}.zip`);

      toast({ 
        title: 'Lote Concluído!', 
        description: `${processados} ofícios gerados e baixados em ZIP.` 
      });

    } catch (error) {
      console.error(error);
      toast({ title: 'Erro no Lote', description: 'Houve um problema durante a geração em massa.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
      setOficioParaImpressao(null);
      setProgressText('');
    }
  };

  const canGenerateIndividual = selectedConselho && filteredFormandosIndividual.length > 0 && assunto && corpo && iniciaisColaborador;
  const canGenerateBatch = conselhosAptosParaLote.length > 0 && assunto && corpo && iniciaisColaborador;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900">Gerar Ofício</h2>
        <p className="text-slate-500">Crie um novo documento de ofício para enviar aos conselhos</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start relative">
        
        {/* ÁREA OCULTA PARA IMPRESSÃO */}
        <div style={{ position: 'absolute', left: '-5000px', top: 0 }}>
          <div id="print-area-hidden" style={{ width: '210mm', height: 'auto', background: 'white' }}>
            {oficioParaImpressao && (
              <DocumentPreview
                numeroOficio={oficioParaImpressao.numero}
                data={oficioParaImpressao.data}
                conselho={oficioParaImpressao.conselho}
                assunto={oficioParaImpressao.assunto}
                corpo={oficioParaImpressao.corpo}
                formandos={oficioParaImpressao.formandos}
                responsavelAssinatura={oficioParaImpressao.responsavelAssinatura}
                cargoAssinatura={oficioParaImpressao.cargoAssinatura}
                logos={logos}
              />
            )}
          </div>
        </div>

        {/* COLUNA ESQUERDA: FORMULÁRIO */}
        <div className="space-y-6">
          
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <Users className="w-5 h-5 text-slate-500" /> Formandos
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {cursosDisponiveis.map((curso) => (
                <label key={curso} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <Checkbox 
                    checked={selectedCursos.includes(curso)} 
                    onCheckedChange={() => handleCursoToggle(curso)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">{curso}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                  {isBatchMode ? <Layers className="w-5 h-5 text-blue-600" /> : <Building2 className="w-5 h-5 text-slate-500" />}
                  {isBatchMode ? 'Geração em Lote' : 'Destinatário'}
                </CardTitle>
                <p className="text-sm text-slate-500">
                  {isBatchMode ? 'Gerar para todos os conselhos aptos' : 'Selecione um conselho ou ative o lote'}
                </p>
              </div>
              
              <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                <Checkbox 
                  id="batch-mode" 
                  checked={isBatchMode} 
                  onCheckedChange={(c) => setIsBatchMode(c === true)} 
                  className="data-[state=checked]:bg-blue-600 border-slate-300"
                />
                <Label htmlFor="batch-mode" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Modo Lote
                </Label>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              
              {isBatchMode ? (
                // --- MODO LOTE ---
                <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 text-blue-800 font-semibold">
                    <Layers className="w-5 h-5" />
                    <span>Resumo do Lote</span>
                  </div>
                  
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Com base nos cursos selecionados, o sistema identificou:
                  </p>
                  
                  <div>
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm font-medium rounded-full shadow-sm">
                      {conselhosAptosParaLote.length} Conselhos Aptos
                    </Badge>
                  </div>
                  
                  <ul className="space-y-1 mt-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {conselhosAptosParaLote.length > 0 ? (
                      conselhosAptosParaLote.map(c => (
                        <li key={c.id} className="text-sm text-blue-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          {c.nome} <span className="text-blue-400">({c.estado})</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-blue-400 italic">Nenhum conselho encontrado para os cursos selecionados.</li>
                    )}
                  </ul>
                </div>
              ) : (
                // --- MODO INDIVIDUAL ---
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                  <div className="space-y-2">
                    <Label>Conselho de Classe</Label>
                    <Select value={selectedConselhoId} onValueChange={handleConselhoChange}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Selecione um conselho" /></SelectTrigger>
                      <SelectContent>
                        {conselhos.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome} ({c.estado})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedConselho && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-slate-400 block">Responsável</span>
                          <span className="text-sm font-medium">{selectedConselho.responsavel}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block">Cargo</span>
                          <span className="text-sm font-medium">{selectedConselho.cargo}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600">
                          {filteredFormandosIndividual.length} formando(s)
                        </Badge>
                        <span className="text-xs text-slate-400">neste conselho</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>

          {/* DADOS DO DOCUMENTO */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-slate-500" /> Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="space-y-2">
                <Label>Iniciais do Colaborador</Label>
                <Input 
                  placeholder="EX: LH" 
                  value={iniciaisColaborador} 
                  onChange={(e) => setIniciaisColaborador(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Assunto (REF.)</Label>
                <Input 
                  value={assunto} 
                  onChange={(e) => setAssunto(e.target.value)} 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Corpo do Documento</Label>
                <Textarea 
                  value={corpo} 
                  onChange={(e) => setCorpo(e.target.value)} 
                  rows={8} 
                  className="text-sm font-serif min-h-[150px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA: PREVIEW E AÇÃO */}
        <div className="hidden lg:flex flex-col gap-3 lg:sticky lg:top-4 self-start h-[calc(100vh-2rem)]">
          
          <div className="flex items-center justify-between">
             <h3 className="font-bold text-slate-800">
               {isBatchMode ? 'Modo de Geração em Lote' : 'Pré-visualização'}
             </h3>
             <Badge variant="outline" className="text-xs">
               {isBatchMode ? 'Múltiplos Arquivos' : (ultimoNumeroGerado ? 'Ofício Gerado' : 'Rascunho')}
             </Badge>
          </div>
          
          <div className="flex-1 border border-slate-200 rounded-xl shadow-sm bg-slate-100/50 overflow-hidden relative">
             
             {isBatchMode ? (
               // PREVIEW MODO LOTE
               <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                 <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                   <Layers className="w-10 h-10 text-blue-600" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-700 mb-2">Pronto para Gerar</h3>
                 <p className="text-slate-500 max-w-xs text-sm leading-relaxed">
                   O sistema irá gerar <strong>{conselhosAptosParaLote.length} arquivos PDF</strong> individualmente e compactá-los em um arquivo .ZIP para download.
                 </p>
                 <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
                   <CheckCircle2 className="w-4 h-4 text-green-500" />
                   <span>Numeração automática sequencial</span>
                 </div>
               </div>
             ) : (
               // PREVIEW MODO INDIVIDUAL
               <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6 flex justify-center items-start">
                  <div className="transform origin-top scale-[0.60] xl:scale-[0.70] 2xl:scale-[0.80] transition-all shadow-xl bg-white mb-8">
                     {selectedConselho ? (
                       <DocumentPreview
                         numeroOficio={ultimoNumeroGerado || `XXX/${new Date().getFullYear()}/${iniciaisColaborador || 'XX'}/UNICESUMAR/NEAD`}
                         data={new Date()}
                         conselho={selectedConselho}
                         assunto={assunto}
                         corpo={corpo}
                         formandos={filteredFormandosIndividual}
                         responsavelAssinatura={responsavelAssinatura}
                         cargoAssinatura={cargoAssinatura}
                         logos={logos}
                       />
                     ) : (
                       <div className="w-[21cm] h-[29.7cm] flex flex-col items-center justify-center text-slate-300">
                         <Eye size={48} className="mb-4 opacity-20" />
                         <p>Selecione um conselho para visualizar</p>
                       </div>
                     )}
                  </div>
               </div>
             )}
          </div>
          
          <Button 
            className={`w-full h-14 shadow-sm text-md font-medium transition-all ${
              isBatchMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`} 
            onClick={isBatchMode ? handleGenerateBatch : handleGenerateIndividual} 
            disabled={
              isGenerating || 
              (isBatchMode ? !canGenerateBatch : !canGenerateIndividual)
            }
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
                {progressText || 'Processando...'}
              </>
            ) : (
              <>
                {isBatchMode ? (
                  <>
                    <Download className="w-5 h-5 mr-2" /> 
                    Gerar Lote (.ZIP)
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" /> 
                    Gerar Ofício Único
                  </>
                )}
              </>
            )}
          </Button>

        </div>
      </div>
    </div>
  );
}
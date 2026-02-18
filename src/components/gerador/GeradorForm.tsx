'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Eye, Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Bibliotecas de PDF
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Imports Locais
import { useConselhos } from '@/hooks/useConselhos';
import { useFormandos } from '@/hooks/useFormandos';
import { DocumentPreview } from './DocumentPreview';
import { getProximoNumeroOficio, saveOficio } from '@/lib/storage';
import { getLogosBase64 } from '@/lib/logoBase64';
import { Oficio, Conselho } from '@/types'; // ✅ Importado Conselho para tipagem correta

const TEXTO_PADRAO = `Vimos, através deste, encaminhar a relação dos alunos formandos desta Instituição de Ensino, conforme anexo, para fins de registro profissional junto a este conceituado Conselho.\n\nInformamos que os alunos listados colaram grau nas datas informadas e estão aptos a exercerem a profissão.\n\nAgradecemos a atenção e colocamo-nos à disposição para quaisquer esclarecimentos.`;

interface GeradorFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function GeradorForm({ onCancel, onSuccess }: GeradorFormProps) {
  const { conselhos = [] } = useConselhos(); // ✅ Ajustado para desestruturação segura
  const { formandos = [] } = useFormandos();
  const { toast } = useToast();

  const [selectedConselhoId, setSelectedConselhoId] = useState<string>('');
  const [selectedCursos, setSelectedCursos] = useState<string[]>([]);
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState(TEXTO_PADRAO);
  const [responsavelAssinatura, setResponsavelAssinatura] = useState('');
  const [cargoAssinatura, setCargoAssinatura] = useState('');
  const [iniciaisColaborador, setIniciaisColaborador] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para as logos (Base64)
  const [logos, setLogos] = useState<{ vitru: string; unicesumar: string } | null>(null);

  // ✅ Carregamento Seguro de Logos
  useEffect(() => {
    async function loadLogos() {
      try {
        const loaded = await getLogosBase64();
        setLogos(loaded);
      } catch (error) {
        console.error("Falha ao carregar logos:", error);
      }
    }
    loadLogos();
  }, []);

  const listaCursos = useMemo(() => {
    const cursosUnicos = Array.from(new Set(formandos.map(f => f.curso)));
    return cursosUnicos.sort();
  }, [formandos]);

  const selectedConselho = useMemo(() =>
    conselhos.find((c) => c.id === selectedConselhoId),
    [conselhos, selectedConselhoId]);

  // ✅ Filtro de Formandos Corrigido (Comparação direta de string 'estado')
  const filteredFormandos = useMemo(() => {
    if (selectedCursos.length === 0 || !selectedConselho) return [];
    return formandos.filter((f) => 
      selectedCursos.includes(f.curso) && f.estado === selectedConselho.estado
    );
  }, [formandos, selectedCursos, selectedConselho]);

  const handleConselhoChange = (id: string) => {
    setSelectedConselhoId(id);
    const conselho = conselhos.find((c) => c.id === id);
    if (conselho) {
      setResponsavelAssinatura(conselho.responsavel || '');
      // ✅ Sincronizado com 'cargo' (conforme seu banco de dados)
      setCargoAssinatura(conselho.cargo || '');

      if (selectedCursos.length > 0) {
        setAssunto(`Envio de Relação de Formandos dos cursos de ${selectedCursos.join(', ')}`);
      }
    }
  };

  const generatePDF = async (oficioNumero: string) => {
    const element = document.getElementById('document-preview');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 3, // ✅ Aumentado para máxima nitidez na impressão
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / pdfWidth;
      const heightInPdf = imgHeight / ratio;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, heightInPdf);
      const safeName = oficioNumero.replace(/\//g, '-');
      pdf.save(`Oficio_${safeName}.pdf`);

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({ title: "Erro", description: "Falha ao gerar o PDF.", variant: "destructive" });
    }
  };

  const handleGenerate = async () => {
    if (!selectedConselho) return;
    setIsSubmitting(true);

    try {
      const numero = getProximoNumeroOficio();
      const ano = new Date().getFullYear();
      const iniciais = iniciaisColaborador || 'XX';
      const numeroOficio = `${String(numero).padStart(3, '0')}/${ano}/${iniciais.toUpperCase()}/UNICESUMAR/NEAD`;

      const novoOficio: Oficio = {
        id: crypto.randomUUID(),
        numero: numeroOficio,
        data: new Date().toISOString(),
        conselho: selectedConselho,
        assunto,
        corpo,
        formandos: filteredFormandos,
        responsavelAssinatura,
        cargoAssinatura,
      };

      saveOficio(novoOficio);
      await generatePDF(numeroOficio);

      toast({ title: "Sucesso", description: `Ofício ${numeroOficio} gerado!` });
      onSuccess();

    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao processar.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right duration-300 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onCancel} className="gap-2">
            <ArrowLeft size={16} /> Voltar
          </Button>
          <h2 className="text-2xl font-bold text-slate-800">Novo Ofício</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* COLUNA ESQUERDA: FORMULÁRIO */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Dados do Documento</CardTitle>
            <CardDescription>Preencha os campos abaixo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Conselho de Destino <span className="text-red-500">*</span></Label>
              <Select value={selectedConselhoId} onValueChange={handleConselhoChange}>
                <SelectTrigger><SelectValue placeholder="Selecione o conselho..." /></SelectTrigger>
                <SelectContent>
                  {conselhos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} ({c.estado})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex justify-between">
                <span>Cursos Relacionados <span className="text-red-500">*</span></span>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                  {filteredFormandos.length} alunos aptos
                </Badge>
              </Label>
              <div className="grid grid-cols-2 gap-2 border p-3 rounded-lg max-h-40 overflow-y-auto bg-slate-50">
                {listaCursos.map((curso) => (
                  <div key={curso} className="flex items-center space-x-2">
                    <Checkbox
                      id={curso}
                      checked={selectedCursos.includes(curso)}
                      onCheckedChange={(checked) => {
                        const newCursos = checked ? [...selectedCursos, curso] : selectedCursos.filter(c => c !== curso);
                        setSelectedCursos(newCursos);
                        if (newCursos.length > 0) {
                          setAssunto(`Envio de Relação de Formandos dos cursos de ${newCursos.join(', ')}`);
                        }
                      }}
                    />
                    <label htmlFor={curso} className="text-xs font-medium cursor-pointer truncate">{curso}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Iniciais (Ex: PB)</Label>
                <Input value={iniciaisColaborador} onChange={(e) => setIniciaisColaborador(e.target.value.toUpperCase())} maxLength={3} />
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input value={responsavelAssinatura} onChange={(e) => setResponsavelAssinatura(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assunto (REF.)</Label>
              <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Corpo do Texto</Label>
              <Textarea value={corpo} onChange={(e) => setCorpo(e.target.value)} className="min-h-[120px] font-serif text-sm" />
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-md"
              disabled={!canGenerate(selectedConselho, filteredFormandos, iniciaisColaborador) || isSubmitting}
              onClick={handleGenerate}
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
              {isSubmitting ? 'Processando...' : 'Salvar e Baixar PDF'}
            </Button>
          </CardContent>
        </Card>

        {/* COLUNA DIREITA: PREVIEW */}
        <div className="hidden lg:flex flex-col gap-3 sticky top-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Eye size={18} /> Preview A4</h3>
          </div>

          <div className="border rounded-xl shadow-inner bg-slate-100 p-6 flex justify-center overflow-y-auto max-h-[80vh]">
            {selectedConselho ? (
              <div id="document-preview" className="transform origin-top scale-[0.65] xl:scale-[0.75] transition-all shadow-2xl">
                <DocumentPreview
                  numeroOficio={`XXX/${new Date().getFullYear()}/${iniciaisColaborador || 'XX'}/UNICESUMAR/NEAD`}
                  data={new Date()}
                  conselho={selectedConselho}
                  assunto={assunto}
                  corpo={corpo}
                  formandos={filteredFormandos}
                  responsavelAssinatura={responsavelAssinatura}
                  cargoAssinatura={cargoAssinatura}
                  logos={logos}
                />
              </div>
            ) : (
              <div className="text-center text-slate-400 py-20">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Selecione um conselho para visualizar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Função auxiliar de validação
function canGenerate(conselho: any, formandos: any[], iniciais: string) {
  return conselho && formandos.length > 0 && iniciais.length >= 2;
}
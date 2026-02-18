import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Adicionei o X para o botão fechar e o Eye para visualizar
import { FileText, Download, Eye, X } from 'lucide-react'; 

// Importe o componente de Preview que já usamos na outra aba
import { DocumentPreview } from '@/components/gerador/DocumentPreview'; 
// Se precisar buscar dados reais, importe aqui o getSavedOficios do storage
// import { getSavedOficios } from '@/lib/storage'; 

export function HistoricoTab() {
  // Estado para controlar qual ofício está sendo visualizado (Modal)
  const [viewingOficio, setViewingOficio] = useState<any | null>(null);

  // Dados fictícios (futuramente você pode trocar por useEffect carregando do localStorage)
  const historico = [
    { 
      id: '1', 
      numero: '001/2025/LH/UNICESUMAR/NEAD', 
      data: '10/01/2025', 
      conselho: { nome: 'CREA-PR', estado: 'PR', responsavel: 'João', cargo: 'Presidente' }, 
      formandos: [], // Adicione dados reais aqui se necessário para o preview funcionar
      assunto: 'Envio de Lista',
      corpo: 'Segue lista...',
      responsavelAssinatura: 'Fulano',
      cargoAssinatura: 'Reitor'
    },
    { 
      id: '2', 
      numero: '002/2025/LH/UNICESUMAR/NEAD', 
      data: '12/01/2025', 
      conselho: { nome: 'COREN-SP', estado: 'SP', responsavel: 'Maria', cargo: 'Diretora' }, 
      formandos: [],
      assunto: 'Envio de Lista',
      corpo: 'Segue lista...',
      responsavelAssinatura: 'Fulano',
      cargoAssinatura: 'Reitor'
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Histórico de Ofícios Gerados</h2>
      </div>

      <div className="grid gap-4">
        {historico.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow border-slate-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-2 rounded-full">
                  <FileText className="text-blue-600 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Ofício {item.numero.split('/')[0]}...</h4>
                  <p className="text-xs text-slate-500">
                    {item.conselho.nome} • {item.data}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Botão Visualizar (Abre o Modal) */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setViewingOficio(item)}
                  className="text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver
                </Button>

                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {historico.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Nenhum ofício encontrado no histórico.</p>
          </div>
        )}
      </div>

      {/* --- MODAL DE VISUALIZAÇÃO --- */}
      {viewingOficio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          
          {/* Container do Documento */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            
            {/* 🔴 BOTÃO FECHAR (X) CUSTOMIZADO */}
            <button
              onClick={() => setViewingOficio(null)}
              className="absolute top-4 right-4 z-50 p-3 bg-white text-slate-500 rounded-full shadow-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:scale-105 transition-all duration-200 cursor-pointer group"
              title="Fechar visualização"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Visualizando Ofício</h3>
                <p className="text-sm text-slate-500">{viewingOficio.numero}</p>
              </div>
              {/* Espaço vazio para não ficar por baixo do botão X */}
              <div className="w-12"></div> 
            </div>

            {/* Área de Scroll do Documento */}
            <div className="flex-1 overflow-y-auto bg-slate-200/50 p-8 flex justify-center">
              <div className="bg-white shadow-xl scale-[0.8] origin-top transform">
                 {/* Reutilizando o componente de Preview */}
                 <DocumentPreview
                    numeroOficio={viewingOficio.numero}
                    data={new Date()} // Você precisaria converter a string data para Date se necessário
                    conselho={viewingOficio.conselho}
                    assunto={viewingOficio.assunto}
                    corpo={viewingOficio.corpo}
                    formandos={viewingOficio.formandos || []}
                    responsavelAssinatura={viewingOficio.responsavelAssinatura}
                    cargoAssinatura={viewingOficio.cargoAssinatura}
                    logos={null} // Se tiver logos carregadas, passe aqui
                  />
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setViewingOficio(null)}>
                Fechar
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
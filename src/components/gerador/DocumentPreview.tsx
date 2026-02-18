import React from 'react';
import { Conselho, Formando } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DocumentPreviewProps {
  numeroOficio: string;
  data: Date | string;
  conselho: Conselho;
  assunto: string;
  corpo: string;
  formandos: Formando[];
  responsavelAssinatura: string;
  cargoAssinatura: string;
  logos: { vitru: string; unicesumar: string } | null;
}

export function DocumentPreview({
  numeroOficio,
  data,
  conselho,
  assunto,
  corpo,
  formandos,
  responsavelAssinatura,
  cargoAssinatura,
  logos,
}: DocumentPreviewProps) {
  
  const formatDate = (val: any) => {
    try { 
      return format(new Date(val), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }); 
    } catch { 
      return String(val); 
    }
  };

  const cursos = [...new Set(formandos.map((f) => f.curso))].join(', ');

  return (
    <div className="bg-white text-black p-[1.5cm] shadow-lg mx-auto w-[21cm] min-h-[29.7cm] font-serif leading-relaxed">
      
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center mb-10 border-b pb-4">
        {logos?.vitru && (
          <img src={logos.vitru} alt="Vitru" style={{ height: '50px', objectFit: 'contain' }} />
        )}
        {logos?.unicesumar && (
          <img src={logos.unicesumar} alt="Unicesumar" style={{ height: '55px', objectFit: 'contain' }} />
        )}
      </div>

      {/* DATA E NÚMERO */}
      <div className="text-right mb-10">
        <p>Maringá/PR, {formatDate(data)}</p>
        <p className="font-bold">Ofício nº {numeroOficio}</p>
      </div>

      {/* DESTINATÁRIO */}
      <div className="mb-8">
        <p>Ao <strong>{conselho?.nome}</strong></p>
        <p>A/C Sr(a). {conselho?.responsavel}</p>
        <p>{conselho?.cargo}</p>
      </div>

      {/* ASSUNTO */}
      <div className="mb-8 font-bold">REF.: {assunto}</div>

      {/* CORPO */}
      <div className="text-justify mb-12 whitespace-pre-wrap text-[11pt]">
        {corpo || "Texto do ofício..."}
      </div>

      {/* ASSINATURA */}
      <div className="mt-16 mb-16">
        <p className="mb-10">Atenciosamente,</p>
        <div className="border-t border-black w-64 pt-2">
          <div className="font-bold">{responsavelAssinatura}</div>
          <div className="text-sm">{cargoAssinatura}</div>
        </div>
      </div>

      {/* ANEXO - SEM LINHAS PONTILHADAS AGORA */}
      {formandos.length > 0 && (
        <div className="pt-8 mt-8 page-break-before">
          <h2 className="text-center font-bold mb-2">ANEXO I – LISTA DE FORMANDOS</h2>
          <p className="text-center text-sm mb-4">Cursos: {cursos}</p>
          
          <table className="w-full border-collapse border border-black text-[9pt]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1">RA</th>
                <th className="border border-black p-1">Nome</th>
                <th className="border border-black p-1">Curso</th>
                <th className="border border-black p-1">Estado</th>
                <th className="border border-black p-1">Polo</th>
                <th className="border border-black p-1">Data Colação</th>
              </tr>
            </thead>
            <tbody>
              {formandos.map((f, i) => (
                <tr key={i}>
                  <td className="border border-black p-1 text-center font-mono">{f.ra}</td>
                  <td className="border border-black p-1">{f.nome}</td>
                  <td className="border border-black p-1">{f.curso}</td>
                  <td className="border border-black p-1 text-center">{f.estado}</td>
                  <td className="border border-black p-1 text-center">{f.polo || '-'}</td>
                  <td className="border border-black p-1 text-center">
                    {f.dataColacao ? format(new Date(f.dataColacao), 'dd/MM/yyyy') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[8pt] text-gray-500 mt-2 text-center">
            Total de {formandos.length} formando(s) listado(s).
          </p>
        </div>
      )}
    </div>
  );
}
import { Oficio } from '@/types';

export const printOficio = (oficio: Oficio, logos?: { vitru: string; unicesumar: string }) => {
  const dataFormatada = new Date(oficio.data).toLocaleDateString('pt-BR');
  const formandos = oficio.formandos || [];
  const cursosUnicos = Array.from(new Set(formandos.map(f => f.curso))).sort().join(', ');

  // No seu PDF 005: Vitru na Esquerda, Unicesumar na Direita
  const logoEsq = logos?.vitru || ''; 
  const logoDir = logos?.unicesumar || '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Ofício ${oficio.numero}</title>
      <style>
        /* CONFIGURAÇÃO EXATA DA PÁGINA A4 */
        @page {
          size: A4 portrait;
          margin: 1.5cm 2cm 1.5cm 2cm; /* Margens iguais ao Ofício 005 */
        }

        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
        }

        /* TABELA DE CABEÇALHO (Garante alinhamento perfeito na impressão) */
        table.header {
          width: 100%;
          border-bottom: 0px solid #000; /* Sem linha no cabeçalho conforme seu PDF */
          margin-bottom: 20px;
        }
        table.header td {
          vertical-align: middle;
        }
        
        /* Logos */
        img.logo-esq { height: 50px; object-fit: contain; }
        img.logo-dir { height: 55px; object-fit: contain; }

        /* CORPO */
        .meta-data { text-align: right; margin-bottom: 30px; margin-top: 10px; }
        .destinatario { margin-bottom: 30px; font-weight: normal; }
        .assunto { margin-bottom: 25px; }
        
        .corpo-texto {
          text-align: justify;
          text-justify: inter-word;
          margin-bottom: 40px;
          white-space: pre-wrap;
        }

        /* ASSINATURA */
        .assinatura-box { margin-top: 60px; text-align: left; /* Seu PDF alinha à esquerda */ }
        
        /* ANEXO (PÁGINA 2) */
        .page-break { page-break-before: always; }
        
        /* Tabela de Alunos igual ao Excel do anexo */
        table.tabela-dados {
          width: 100%;
          border-collapse: collapse;
          font-family: Arial, Helvetica, sans-serif; /* Tabela costuma ser Arial */
          font-size: 10pt;
          margin-top: 15px;
        }
        table.tabela-dados th, table.tabela-dados td {
          border: 1px solid #000;
          padding: 5px 8px;
          text-align: left;
        }
        table.tabela-dados th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .text-center { text-align: center; }

      </style>
    </head>
    <body>

      <table class="header">
        <tr>
          <td align="left" width="50%">
            ${logoEsq ? `<img src="${logoEsq}" class="logo-esq">` : ''}
          </td>
          <td align="right" width="50%">
            ${logoDir ? `<img src="${logoDir}" class="logo-dir">` : ''}
          </td>
        </tr>
      </table>

      <div class="meta-data">
        <div>Maringá/PR, ${dataFormatada}</div>
        <div style="font-weight: bold; margin-top: 5px;">Ofício nº ${oficio.numero}</div>
      </div>

      <div class="destinatario">
        <div>Ao <strong>${oficio.conselho.nome}</strong></div>
        <div>A/C Sr(a). ${oficio.conselho.responsavel}</div>
        <div style="font-style: italic;">${oficio.conselho.cargoResponsavel}</div>
      </div>

      <div class="assunto">
        <strong>REF.:</strong> ${oficio.assunto}
      </div>

      <div class="corpo-texto">Prezado(a) Senhor(a),<br><br>${oficio.corpo}</div>

      <div class="assinatura-box">
        <p>Atenciosamente,</p>
        <br><br>
        <div style="font-weight: bold;">${oficio.responsavelAssinatura}</div>
        <div>${oficio.cargoAssinatura}</div>
      </div>

      ${formandos.length > 0 ? `
        <div class="page-break"></div>
        
        <table class="header">
          <tr>
            <td align="left">${logoEsq ? `<img src="${logoEsq}" class="logo-esq">` : ''}</td>
            <td align="right">${logoDir ? `<img src="${logoDir}" class="logo-dir">` : ''}</td>
          </tr>
        </table>

        <div style="text-align: center; font-weight: bold; font-family: Arial, sans-serif; font-size: 12pt; margin-top: 20px;">
          ANEXO I – LISTA DE FORMANDOS
        </div>
        <div style="text-align: center; font-family: Arial, sans-serif; font-size: 10pt; margin-bottom: 10px;">
          Cursos: ${cursosUnicos}
        </div>

        <table class="tabela-dados">
          <thead>
            <tr>
              <th width="15%" class="text-center">RA</th>
              <th>Nome</th>
              <th>Curso</th>
              <th width="10%" class="text-center">Estado</th>
              <th width="15%" class="text-center">Data Colação</th>
            </tr>
          </thead>
          <tbody>
            ${formandos.map(f => `
              <tr>
                <td class="text-center">${f.ra}</td>
                <td>${f.nome}</td>
                <td>${f.curso}</td>
                <td class="text-center">${f.estado}</td>
                <td class="text-center">
                  ${f.dataColacao ? new Date(f.dataColacao).toLocaleDateString('pt-BR') : 
                    (f.dataConclusao ? new Date(f.dataConclusao).toLocaleDateString('pt-BR') : '-')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align: right; font-size: 9pt; font-family: Arial; margin-top: 5px;">
          Total: ${formandos.length}
        </div>
      ` : ''}

      <script>
        window.onload = function() {
          // Delay maior para garantir que as imagens carregaram
          setTimeout(function() { window.print(); }, 1000);
        }
      </script>
    </body>
    </html>
  `;

  const width = window.innerWidth * 0.8;
  const height = window.innerHeight * 0.9;
  const printWindow = window.open('', '_blank', `width=${width},height=${height}`);
  
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert("Permita pop-ups para imprimir.");
  }
};
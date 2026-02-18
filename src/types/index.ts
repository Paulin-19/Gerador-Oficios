export type TabType = 'gerar' | 'conselhos' | 'formandos' | 'oficios';

export interface Conselho {
  id: string;
  nome: string;
  estado: string; // UF do conselho
  responsavel: string;
  cargo: string; // Nome unificado para o cargo do responsável
  estados?: string[]; // Mantido como opcional para compatibilidade com o Excel
}

// ✅ ISSO RESOLVE O ERRO DE "NÃO ENCONTRADO" NO GERADOR
export type ConselhoProfissional = Conselho;

export interface Formando {
  id: string;
  ra: string;
  nome: string;
  curso: string;
  estado: string;
  polo?: string;
  dataConclusao: string;
  dataColacao?: string;
}

export interface Oficio {
  id: string;
  numero: string;
  data: string | Date;
  conselho: Conselho;
  assunto: string;
  corpo: string;
  formandos: Formando[];
  responsavelAssinatura: string;
  cargoAssinatura: string;
  createdAt?: string | Date;
}
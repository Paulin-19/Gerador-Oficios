export interface Formando {
  id: number;
  nome: string;
  curso: string;
  estado: string;
  polo: string;
}

export const db = {
  formandos: [
    { id: 1, nome: "Paulo Augusto", curso: "Engenharia", estado: "PR", polo: "Maringá" }
  ]
};
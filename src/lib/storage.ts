// src/lib/storage.ts
import { Conselho, Formando, Oficio } from '@/types';

const STORAGE_KEYS = {
  CONSELHOS: 'oficios_conselhos',
  FORMANDOS: 'oficios_formandos',
  OFICIOS: 'oficios_documentos',
  ULTIMO_NUMERO: 'oficios_ultimo_numero',
};

// --- CONSELHOS ---
export function getConselhos(): Conselho[] {
  const data = localStorage.getItem(STORAGE_KEYS.CONSELHOS);
  if (!data) return [];
  return JSON.parse(data).map((c: any) => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  }));
}

export function saveConselho(conselho: Conselho): void {
  const conselhos = getConselhos();
  const index = conselhos.findIndex((c) => c.id === conselho.id);
  if (index >= 0) {
    conselhos[index] = conselho;
  } else {
    conselhos.push(conselho);
  }
  localStorage.setItem(STORAGE_KEYS.CONSELHOS, JSON.stringify(conselhos));
}

export function deleteConselho(id: string): void {
  const conselhos = getConselhos().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CONSELHOS, JSON.stringify(conselhos));
}

// --- FORMANDOS ---
export function getFormandos(): Formando[] {
  const data = localStorage.getItem(STORAGE_KEYS.FORMANDOS);
  if (!data) return [];
  return JSON.parse(data).map((f: any) => ({
    ...f,
    createdAt: new Date(f.createdAt),
  }));
}

export function saveFormando(formando: Formando): void {
  const formandos = getFormandos();
  const index = formandos.findIndex((f) => f.id === formando.id);
  if (index >= 0) {
    formandos[index] = formando;
  } else {
    formandos.push(formando);
  }
  localStorage.setItem(STORAGE_KEYS.FORMANDOS, JSON.stringify(formandos));
}

export function saveFormandos(novosFormandos: Formando[]): void {
  const formandos = getFormandos();
  novosFormandos.forEach((novo) => {
    const index = formandos.findIndex((f) => f.ra === novo.ra);
    if (index >= 0) {
      formandos[index] = novo;
    } else {
      formandos.push(novo);
    }
  });
  localStorage.setItem(STORAGE_KEYS.FORMANDOS, JSON.stringify(formandos));
}

export function deleteFormando(id: string): void {
  const formandos = getFormandos().filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEYS.FORMANDOS, JSON.stringify(formandos));
}

export function deleteFormandos(ids: string[]): void {
  const formandos = getFormandos().filter((f) => !ids.includes(f.id));
  localStorage.setItem(STORAGE_KEYS.FORMANDOS, JSON.stringify(formandos));
}

// --- OFÍCIOS ---
export function getOficios(): Oficio[] {
  const data = localStorage.getItem(STORAGE_KEYS.OFICIOS);
  if (!data) return [];
  try {
    return JSON.parse(data).map((o: any) => ({
      ...o,
      createdAt: new Date(o.createdAt),
    }));
  } catch (e) {
    console.error("Erro ao ler ofícios", e);
    return [];
  }
}

export function saveOficio(oficio: Oficio): void {
  const oficios = getOficios();
  oficios.push(oficio); 
  localStorage.setItem(STORAGE_KEYS.OFICIOS, JSON.stringify(oficios));
}

// ✅ [NOVO] Esta função é necessária para o botão "Excluir Selecionados" funcionar
export function atualizarListaOficios(listaAtualizada: Oficio[]): void {
  localStorage.setItem(STORAGE_KEYS.OFICIOS, JSON.stringify(listaAtualizada));
}

export function getProximoNumeroOficio(): number {
  const ultimo = localStorage.getItem(STORAGE_KEYS.ULTIMO_NUMERO);
  const proximo = ultimo ? parseInt(ultimo, 10) + 1 : 1;
  localStorage.setItem(STORAGE_KEYS.ULTIMO_NUMERO, proximo.toString());
  return proximo;
}

export function clearOficios(): void {
  localStorage.removeItem(STORAGE_KEYS.OFICIOS);
  localStorage.removeItem(STORAGE_KEYS.ULTIMO_NUMERO);
}

export function deleteOficio(id: string): void {
  const oficios = getOficios();
  const oficiosFiltrados = oficios.filter(o => o.id !== id);
  localStorage.setItem(STORAGE_KEYS.OFICIOS, JSON.stringify(oficiosFiltrados));
}
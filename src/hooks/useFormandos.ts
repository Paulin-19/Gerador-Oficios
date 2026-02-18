import { useState, useEffect, useCallback } from 'react';
import { Formando } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useFormandos() {
  const [formandos, setFormandos] = useState<Formando[]>([]);
  const { toast } = useToast();
  const API_URL = 'http://localhost:3000/api/formandos';

  const fetchFormandos = useCallback(async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setFormandos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar:", error);
    }
  }, []);

  useEffect(() => { fetchFormandos(); }, [fetchFormandos]);

  const addFormando = async (dados: Omit<Formando, 'id'>) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      if (!res.ok) throw new Error();
      const novo = await res.json();
      setFormandos(prev => [...prev, novo]);
      toast({ title: "Sucesso", description: "Formando cadastrado!" });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    }
  };

  const removeFormando = async (id: string) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setFormandos(prev => prev.filter(f => f.id !== id));
      toast({ title: "Removido", description: "Formando excluído." });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" });
    }
  };

  const updateFormando = async (id: string, dados: Omit<Formando, 'id'>) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      if (!res.ok) throw new Error();
      const atualizado = await res.json();
      setFormandos(prev => prev.map(f => f.id === id ? atualizado : f));
      toast({ title: "Atualizado", description: "Dados alterados com sucesso!" });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" });
    }
  };

  // ✅ FUNÇÃO QUE O MODAL DE EXCEL CHAMA
  const importFormandosBatch = async (listaDados: Omit<Formando, 'id'>[]) => {
    let sucessos = 0;
    
    // Enviamos um por um para o servidor (método simples e seguro)
    for (const dados of listaDados) {
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados),
        });
        
        if (res.ok) {
          const novo = await res.json();
          // Atualiza a tela aos poucos ou no final
          setFormandos(prev => [...prev, novo]);
          sucessos++;
        }
      } catch (e) {
        console.error("Falha ao importar linha:", dados);
      }
    }

    if (sucessos > 0) {
      toast({ 
        title: "Importação Concluída", 
        description: `${sucessos} formandos importados do Excel com sucesso.` 
      });
    } else {
      toast({ 
        title: "Erro na Importação", 
        description: "Nenhum dado foi salvo.", 
        variant: "destructive" 
      });
    }
  };

  return { formandos, addFormando, removeFormando, updateFormando, importFormandosBatch };
}
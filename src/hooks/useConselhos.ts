import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Conselho } from "@/types";
import { useToast } from "@/hooks/use-toast"; // Adicionei o Toast para mensagens bonitas

export function useConselhos() {
  const [conselhos, setConselhos] = useState<Conselho[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // 1. Buscar (GET)
  const fetchConselhos = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/conselhos");
      setConselhos(response.data);
    } catch (error) {
      console.error("Erro ao buscar conselhos:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar lista.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConselhos();
  }, [fetchConselhos]);

  // 2. Adicionar (POST)
  const addConselho = async (dados: Omit<Conselho, "id">) => {
    try {
      await api.post("/conselhos", dados);
      await fetchConselhos();
      toast({ title: "Sucesso", description: "Conselho cadastrado!" });
    } catch (error) {
      console.error("Erro ao adicionar:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao salvar.",
      });
    }
  };

  // 3. Atualizar (PUT)
  const updateConselho = async (id: string, dados: Omit<Conselho, "id">) => {
    try {
      await api.put(`/conselhos/${id}`, dados);
      setConselhos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...dados } : c)),
      );
      toast({
        title: "Atualizado",
        description: "Dados alterados com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar.",
      });
    }
  };

  // 4. Remover (DELETE)
  const removeConselho = async (id: string) => {
    try {
      await api.delete(`/conselhos/${id}`);
      setConselhos((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Removido", description: "Conselho excluído." });
    } catch (error) {
      console.error("Erro ao remover:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir.",
      });
    }
  };

const importConselhosBatch = async (dados: Omit<Conselho, 'id'>[]) => {
    setIsLoading(true);
    try {
      for (const item of dados) {
        await api.post('/conselhos', item);
      }
      await fetchConselhos();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    conselhos,
    isLoading,
    addConselho,
    updateConselho,
    removeConselho,
    importConselhosBatch // ✅ Certifique-se que esta linha existe!
  };
}
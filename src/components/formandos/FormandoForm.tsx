import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Formando } from '@/types';

// Esquema de validação
const schema = z.object({
  ra: z.string().min(1, 'O RA é obrigatório'),
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  curso: z.string().min(2, 'O curso é obrigatório'),
  estado: z.string().min(2, 'Selecione um estado'),
  polo: z.string().optional(),
  dataConclusao: z.string().min(10, 'Data de conclusão é obrigatória'),
  dataColacao: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface FormandoFormProps {
  initialData?: Formando;
  onClose: () => void;
  onSave: (data: Omit<Formando, 'id'>) => Promise<void>;
}

// Lista de Estados (UF) para o Select
const estadosBrasileiros = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function FormandoForm({ initialData, onClose, onSave }: FormandoFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ra: '',
      nome: '',
      curso: '',
      estado: '',
      polo: '',
      dataConclusao: '',
      dataColacao: '',
    }
  });

  // Carrega os dados se for edição
  useEffect(() => {
    if (initialData) {
      setValue('ra', initialData.ra);
      setValue('nome', initialData.nome);
      setValue('curso', initialData.curso);
      setValue('estado', initialData.estado);
      setValue('polo', initialData.polo || '');
      setValue('dataConclusao', initialData.dataConclusao);
      setValue('dataColacao', initialData.dataColacao || '');
    }
  }, [initialData, setValue]);

  const onSubmit = async (data: FormData) => {
    // ✅ CORREÇÃO DO ERRO: O 'as any' resolve o conflito de tipos do TypeScript
    await onSave(data as any);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Formando' : 'Novo Formando'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          
          <div className="grid grid-cols-2 gap-4">
            {/* CAMPO RA - BLOQUEADO PARA APENAS NÚMEROS */}
            <div className="space-y-2">
              <Label htmlFor="ra">RA <span className="text-red-500">*</span></Label>
              <Input
                id="ra"
                placeholder="Apenas números"
                {...register('ra')}
                onChange={(e) => {
                  // Remove qualquer caractere que NÃO seja número (0-9)
                  const valorNumerico = e.target.value.replace(/\D/g, '');
                  // Atualiza o valor no formulário forçando a validação
                  setValue('ra', valorNumerico, { shouldValidate: true });
                }}
              />
              {errors.ra && <span className="text-xs text-red-500">{errors.ra.message}</span>}
            </div>

            {/* CAMPO NOME */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo <span className="text-red-500">*</span></Label>
              <Input id="nome" {...register('nome')} placeholder="Nome do aluno" />
              {errors.nome && <span className="text-xs text-red-500">{errors.nome.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* CAMPO CURSO */}
            <div className="space-y-2">
              <Label htmlFor="curso">Curso <span className="text-red-500">*</span></Label>
              <Input id="curso" {...register('curso')} placeholder="Ex: Pedagogia" />
              {errors.curso && <span className="text-xs text-red-500">{errors.curso.message}</span>}
            </div>

            {/* SELECT ESTADO (Igual à imagem enviada) */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado (UF) <span className="text-red-500">*</span></Label>
              <Select 
                onValueChange={(val) => setValue('estado', val, { shouldValidate: true })} 
                defaultValue={initialData?.estado}
                value={watch('estado')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {estadosBrasileiros.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.estado && <span className="text-xs text-red-500">{errors.estado.message}</span>}
            </div>
          </div>

          {/* CAMPO POLO (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="polo">Polo (opcional)</Label>
            <Input id="polo" {...register('polo')} placeholder="Ex: Polo Centro" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* DATA DE CONCLUSÃO */}
            <div className="space-y-2">
              <Label htmlFor="dataConclusao">Data de Conclusão <span className="text-red-500">*</span></Label>
              <Input 
                id="dataConclusao" 
                type="date" 
                {...register('dataConclusao')} 
              />
              {errors.dataConclusao && <span className="text-xs text-red-500">{errors.dataConclusao.message}</span>}
            </div>

            {/* DATA DE COLAÇÃO */}
            <div className="space-y-2">
              <Label htmlFor="dataColacao">Data de Colação (opcional)</Label>
              <Input 
                id="dataColacao" 
                type="date" 
                {...register('dataColacao')} 
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
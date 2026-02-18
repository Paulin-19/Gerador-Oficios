import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Conselho } from '@/types';

const schema = z.object({
  nome: z.string().min(2, 'O nome do conselho é obrigatório'),
  estado: z.string().min(2, 'Selecione o estado'),
  responsavel: z.string().min(3, 'Nome do responsável é obrigatório'),
  cargo: z.string().min(2, 'O cargo é obrigatório'),
});

type FormData = z.infer<typeof schema>;

interface ConselhoFormProps {
  initialData?: Conselho;
  onClose: () => void;
  onSave: (data: Omit<Conselho, 'id'>) => Promise<void>;
}

const estadosBrasileiros = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function ConselhoForm({ initialData, onClose, onSave }: ConselhoFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', estado: '', responsavel: '', cargo: '' }
  });

  useEffect(() => {
    if (initialData) {
      setValue('nome', initialData.nome);
      setValue('estado', initialData.estado);
      setValue('responsavel', initialData.responsavel);
      setValue('cargo', initialData.cargo);
    }
  }, [initialData, setValue]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Conselho' : 'Novo Conselho Regional'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => onSave(data as any))} className="space-y-4 py-4">
          
          <div className="grid grid-cols-3 gap-4">
            {/* NOME DO CONSELHO */}
            <div className="col-span-2 space-y-2">
              <Label>Nome da Entidade <span className="text-red-500">*</span></Label>
              <Input {...register('nome')} placeholder="Ex: CREA-SP" />
              {errors.nome && <span className="text-xs text-red-500">{errors.nome.message}</span>}
            </div>

            {/* ESTADO */}
            <div className="space-y-2">
              <Label>UF <span className="text-red-500">*</span></Label>
              <Select 
                onValueChange={(val) => setValue('estado', val, { shouldValidate: true })} 
                defaultValue={initialData?.estado}
                value={watch('estado')}
              >
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {estadosBrasileiros.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.estado && <span className="text-xs text-red-500">{errors.estado.message}</span>}
            </div>
          </div>

          {/* RESPONSÁVEL */}
          <div className="space-y-2">
            <Label>Nome do Responsável <span className="text-red-500">*</span></Label>
            <Input {...register('responsavel')} placeholder="Ex: Dr. João da Silva" />
            {errors.responsavel && <span className="text-xs text-red-500">{errors.responsavel.message}</span>}
          </div>

          {/* CARGO */}
          <div className="space-y-2">
            <Label>Cargo / Função <span className="text-red-500">*</span></Label>
            <Input {...register('cargo')} placeholder="Ex: Presidente" />
            {errors.cargo && <span className="text-xs text-red-500">{errors.cargo.message}</span>}
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
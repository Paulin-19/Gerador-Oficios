import { TabType } from '@/types';

interface HeaderProps {
  activeTab: TabType;
}

const titles: Record<TabType, { title: string; subtitle: string }> = {
  gerar: { title: 'Gerar Ofício', subtitle: 'Crie um novo documento de ofício' },
  conselhos: { title: 'Conselhos de Classe', subtitle: 'Gerencie os conselhos profissionais' },
  formandos: { title: 'Formandos', subtitle: 'Gerencie a lista de formandos' },
  oficios: { title: 'Histórico de Ofícios', subtitle: 'Documentos gerados anteriormente' },
};

export function Header({ activeTab }: HeaderProps) {
  const { title, subtitle } = titles[activeTab];

  return (
    <header className="bg-card border-b border-border px-8 py-6">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="text-muted-foreground mt-1">{subtitle}</p>
    </header>
  );
}
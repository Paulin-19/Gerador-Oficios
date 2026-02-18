import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ConselhosTab } from '@/components/conselhos/ConselhosTab';
import { FormandosTab } from '@/components/formandos/FormandosTab';
import { GeradorOficiosTab } from '@/components/gerador/GeradorOficiosTab';
import { HistoricoTab } from '@/components/histórico/HistoricoTab';
import { TabType } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('gerar');

  const renderContent = () => {
    switch (activeTab) {
      case 'conselhos':
        return <ConselhosTab />;
      case 'formandos':
        return <FormandosTab />;
      case 'gerar':
        return <GeradorOficiosTab />;
      case 'oficios':
        return <HistoricoTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex flex-col min-w-0">
        <Header activeTab={activeTab} />
        <div className="flex-1 p-8 overflow-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;

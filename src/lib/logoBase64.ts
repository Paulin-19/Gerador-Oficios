// ✅ 1. Importe as imagens no topo (Isso resolve o caminho correto da URL)
// Certifique-se de que os arquivos existem em src/assets/
import logoVitruPath from '@/assets/logo-vitru.png';
import logoUnicesumarPath from '@/assets/logo-unicesumar.png';

// Helper: Converte URL de imagem para Base64 (usado pelo PDF)
export const getLogoBase64 = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    // 'anonymous' é importante para evitar erros de CORS se a imagem vier de outro domínio
    img.crossOrigin = 'anonymous'; 
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        // Retorna a string base64 completa
        resolve(canvas.toDataURL('image/png'));
      } else {
        console.error('Erro ao criar contexto do canvas');
        resolve('');
      }
    };

    img.onerror = (error) => {
      console.error(`Erro ao carregar imagem: ${imageSrc}`, error);
      resolve(''); // Retorna vazio para não quebrar a aplicação
    };

    img.src = imageSrc;
  });
};

// Cache para não processar a mesma imagem duas vezes
let cachedLogos: { vitru: string; unicesumar: string } | null = null;

// Função principal exportada
export const getLogosBase64 = async (): Promise<{ vitru: string; unicesumar: string }> => {
  // Se já convertemos antes, retorna do cache
  if (cachedLogos) return cachedLogos;
  
  try {
    const [vitru, unicesumar] = await Promise.all([
      getLogoBase64(logoVitruPath),
      getLogoBase64(logoUnicesumarPath),
    ]);
    
    cachedLogos = { vitru, unicesumar };
    return cachedLogos;
  } catch (error) {
    console.error("Erro fatal ao gerar logos:", error);
    return { vitru: '', unicesumar: '' };
  }
};
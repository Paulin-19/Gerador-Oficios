// src/services/bryService.ts

// Acesso seguro às variáveis de ambiente
const env = import.meta.env as any;

const BRY_CONFIG = {
  login: env.VITE_BRY_LOGIN || '09619197950',
  senha: env.VITE_BRY_SENHA || '2141302621Ec!',
  // Rotas via Proxy (configurado no vite.config.ts)
  authUrl: env.VITE_BRY_AUTH_URL || '/bry-api/api/token-service/token',
  certUrl: env.VITE_BRY_CERT_URL || '/bry-api/api/certificate-service/v1/certificates',
  signUrl: env.VITE_BRY_SIGN_URL || '/bry-api/api/kms/v1/assinaturas'
};

/**
 * 1. Autenticação (Login)
 * Obtém o Token de Acesso usando CPF/Email e Senha.
 */
async function getAccessToken(): Promise<string> {
  if (!BRY_CONFIG.login || !BRY_CONFIG.senha) {
    throw new Error('Configure Login e Senha no .env');
  }

  const params = new URLSearchParams();
  // Mudança: Vamos tentar passar o client_id no corpo ao invés do header
  params.append('client_id', 'cloud'); 
  params.append('grant_type', 'password');
  params.append('username', BRY_CONFIG.login);
  params.append('password', BRY_CONFIG.senha);
  params.append('scope', 'offline_access'); 

  console.log(`🔐 Autenticando ${BRY_CONFIG.login}...`);

  const response = await fetch(BRY_CONFIG.authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // ⚠️ REMOVEMOS O HEADER 'Authorization: Basic...' 
      // para ver se o servidor aceita o client_id no corpo
    },
    body: params
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ ERRO LOGIN (${response.status}):`, errorText);
    
    // Se der 401 de novo, o problema é o contrato do usuário
    if (response.status === 401) {
      throw new Error('Usuário sem permissão de API ou Senha incorreta.');
    }
    throw new Error(`Erro Bry: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * 2. Busca de Certificado
 * Encontra o UUID do certificado válido na nuvem.
 */
async function getCertificateUuid(token: string): Promise<string> {
  try {
    const response = await fetch(BRY_CONFIG.certUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error(`❌ ERRO CERTIFICADOS (${response.status}):`, txt);
      throw new Error('Falha ao listar certificados.');
    }

    const data = await response.json();
    const lista = data.certificates || data;
    
    // Procura o primeiro certificado VÁLIDO
    const valido = lista.find((c: any) => c.status === 'VALID' || c.situacao === 'VALIDO');

    if (!valido) {
      console.error("❌ Nenhum certificado válido encontrado na lista:", lista);
      throw new Error('Você não possui certificados válidos nesta conta.');
    }

    console.log(`✅ Certificado encontrado: ${valido.name}`);
    return valido.uuid;
  } catch (error) {
    console.error("❌ Erro ao buscar certificado:", error);
    throw error;
  }
}

/**
 * 3. Assinatura PDF (Função Principal)
 * Exportada como 'signPdfWithBry' para compatibilidade com o frontend.
 */
export async function signPdfWithBry(pdfBlob: Blob, nomeArquivo: string): Promise<Blob> {
  try {
    // Passo A: Login
    const token = await getAccessToken();

    // Passo B: UUID
    const uuid = await getCertificateUuid(token);

    // Passo C: Montagem da Requisição KMS
    const formData = new FormData();
    
    const configKms = JSON.stringify({
      "algoritmoHash": "SHA256",
      "perfil": "CARIMBO", 
      "certificado": { "uuid": uuid },
      "configuracaoImagem": {
        "incluirImagem": true,
        "altura": 50,
        "largura": 150,
        "posicao": "INFERIOR_ESQUERDO",
        "pagina": "PRIMEIRA"
      }
    });

    formData.append('documento', pdfBlob, nomeArquivo);
    formData.append('configuracao', configKms);

    console.log("✍️ Enviando documento para assinatura...");

    const response = await fetch(BRY_CONFIG.signUrl, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'kms_type': 'BRYKMS' // Header essencial para o FW2
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ERRO ASSINATURA (${response.status}):`, errorText);
      throw new Error(`A Bry recusou a assinatura: ${errorText}`);
    }

    // Passo D: Processar Retorno
    const jsonResponse = await response.json();
    
    // Tenta encontrar o campo que contém o PDF assinado (Base64)
    const base64Signed = jsonResponse.conteudo || jsonResponse.content || jsonResponse.assinatura || jsonResponse.documento;

    if (base64Signed) {
      console.log("✅ Documento assinado recebido!");
      return base64ToBlob(base64Signed, "application/pdf");
    }

    throw new Error("A API retornou sucesso, mas não enviou o PDF assinado.");

  } catch (error) {
    console.error("❌ PROCESSO ABORTADO:", error);
    throw error;
  }
}

// Função Auxiliar: Converte Base64 para Blob
function base64ToBlob(base64: string, type: string) {
  const binStr = atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new Blob([arr], { type: type });
}
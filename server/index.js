// @ts-nocheck
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurações de caminho para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. FUNÇÃO DE LEITURA SEGURA (Previne erros se o arquivo sumir) ---
function getDatabase() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { conselhos: [], formandos: [] };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const json = JSON.parse(raw || '{}');
    
    // Garante que os arrays existam para não quebrar o .map no frontend
    return {
      conselhos: Array.isArray(json.conselhos) ? json.conselhos : [],
      formandos: Array.isArray(json.formandos) ? json.formandos : []
    };
  } catch (err) {
    console.error("Erro ao ler banco:", err.message);
    return { conselhos: [], formandos: [] };
  }
}

// --- 2. FUNÇÃO DE SALVAMENTO (Previne erro do OneDrive/Arquivo Ocupado) ---
function saveDatabase(data) {
  try {
    const safeData = {
      conselhos: data.conselhos || [],
      formandos: data.formandos || []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(safeData, null, 2), 'utf-8');
  } catch (err) {
    console.error("Erro ao salvar (arquivo travado?):", err.message);
  }
}

// --- 3. ROTAS DE FORMANDOS ---

// Listar Formandos
app.get('/api/formandos', (req, res) => {
  res.json(getDatabase().formandos);
});

// Criar Formando
app.post('/api/formandos', (req, res) => {
  const db = getDatabase();
  const novo = { id: Date.now().toString(), ...req.body };
  db.formandos.push(novo);
  saveDatabase(db);
  res.status(201).json(novo);
});

// Excluir Formando (Correção do erro de "map")
app.delete('/api/formandos/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  const novaLista = db.formandos.filter(f => f.id !== id);
  
  if (db.formandos.length === novaLista.length) {
    return res.status(404).json({ error: "Formando não encontrado." });
  }

  db.formandos = novaLista;
  saveDatabase(db);
  res.json({ success: true });
});

// --- 4. ROTAS DE CONSELHOS ---

// Listar Conselhos
app.get('/api/conselhos', (req, res) => {
  res.json(getDatabase().conselhos);
});

// Criar Conselho
app.post('/api/conselhos', (req, res) => {
  const db = getDatabase();
  const novo = { id: Date.now().toString(), ...req.body };
  db.conselhos.push(novo);
  saveDatabase(db);
  res.status(201).json(novo);
});

// Excluir Conselho
app.delete('/api/conselhos/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  const novaLista = db.conselhos.filter(c => c.id !== id);
  db.conselhos = novaLista;
  saveDatabase(db);
  res.json({ success: true });
});

// --- 5. INICIALIZAÇÃO ---
app.listen(3000, () => {
  console.log('--------------------------------------------------');
  console.log('🚀 SERVIDOR RODANDO');
  console.log('📂 BANCO DE DADOS: ' + DATA_FILE);
  console.log('--------------------------------------------------');
});
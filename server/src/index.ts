import express from 'express';
import cors from 'cors';
import { db } from './db';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/formandos', (req, res) => {
  res.json(db.formandos);
});

app.listen(3001, () => console.log("🚀 Servidor Node em http://localhost:3001"));
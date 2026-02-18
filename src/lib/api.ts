import axios from 'axios';

export const api = axios.create({
  // Certifique-se que esta porta (3000) é a mesma do seu Back-end
  baseURL: 'http://localhost:3000/api', 
});
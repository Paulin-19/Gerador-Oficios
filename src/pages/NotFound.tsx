import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-slate-800">Página não encontrada</h1>
        <p className="mb-6 text-slate-500">
          A rota que você tentou acessar não existe.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white transition-colors bg-blue-600 rounded-xl hover:bg-blue-700"
        >
          Voltar para o Início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
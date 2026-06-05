import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import Login from './pages/Login/Login';
import AppLayout from './components/Layout/AppLayout.jsx';
import ClientesDashboard from './pages/Clientes/ClientesDashboard';
import ClientesLista from './pages/Clientes/ClienteLista';
import ClientesAniversariantes from './pages/Clientes/ClientesAniversariantes';
import ProcessosDashboard from './pages/Processos/ProcessosDashboard';
import ProcessosLista from './pages/Processos/ProcessoLista';
import ProcessosPrazos from './pages/Processos/ProcessosPrazos';
import AudienciasDashboard from './pages/Audiencias/AudienciasDashboard';
import AudienciaLista from './pages/Audiencias/AudienciaLista';
import GoogleCallback from './pages/GoogleCallback';
import PericiasDashboard from './pages/Pericias/PericiasDashboard';
import PericiaLista from './pages/Pericias/PericiaLista';
import AtendimentosDashboard from './pages/Atendimentos/AtendimentosDashboard';
import AtendimentoLista from './pages/Atendimentos/AtendimentoLista';
import FinanceiroDashboard from './pages/Financeiro/FinanceiroDashboard';
import RecebimentoLista from './pages/Financeiro/RecebimentoLista';
import DespesaLista from './pages/Financeiro/DespesaLista';
import TarefasDashboard from './pages/Tarefas/TarefasDashboard';
import TarefaLista from './pages/Tarefas/TarefaLista';

function App() {
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {

    window.addEventListener('auth:logout', handleLogout);
    
    const interval = setInterval(() => {
      
      const currentToken = localStorage.getItem('token');
      
      if (!currentToken && isAuthenticated) {
        handleLogout();
      } else if (currentToken && !isAuthenticated) {
        setIsAuthenticated(true);
      }

    }, 2000);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      clearInterval(interval);
    };

  }, [isAuthenticated, handleLogout]);

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    
    if (!token && location.pathname !== '/login' && !location.pathname.startsWith('/callback')) {
      setIsAuthenticated(false);
      navigate('/login', { replace: true });
    }

  }, [location.pathname, navigate]);

  if (!isAuthenticated) {

    return (

      <Routes>
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        <Route path="/callback/google" element={<GoogleCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

    );
  }

  return (
    
    <AppLayout>

      <Routes>

        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/" element={<Navigate to="/dashboard" />} /> 
        <Route path="/callback/google" element={<GoogleCallback /> } />  

        <Route path="/clientes/dashboard" element={<ClientesDashboard />} />
        <Route path="/clientes/lista" element={<ClientesLista />} />
        <Route path="/clientes/aniversariantes" element={<ClientesAniversariantes /> } />

        <Route path="/processos/dashboard" element={<ProcessosDashboard /> } />
        <Route path="/processos/lista" element={<ProcessosLista /> } />
        <Route path="/processos/prazos" element={<ProcessosPrazos /> } />

        <Route path="/audiencias/dashboard" element={<AudienciasDashboard /> } />
        <Route path="/audiencias/lista" element={<AudienciaLista /> } />
        
        <Route path="/pericias/dashboard" element={<PericiasDashboard /> } />
        <Route path="/pericias/lista" element={<PericiaLista /> } />

        <Route path="/atendimentos/dashboard" element={<AtendimentosDashboard /> } />
        <Route path="/atendimentos/lista" element={<AtendimentoLista /> } />

        <Route path="/financeiro/dashboard" element={<FinanceiroDashboard /> } />
        <Route path="/financeiro/recebimentos" element={<RecebimentoLista /> } />
        <Route path="/financeiro/despesas" element={<DespesaLista /> } />

        <Route path="/tarefas/dashboard" element={<TarefasDashboard /> } />
        <Route path="/tarefas/lista" element={<TarefaLista /> } />
        
      </Routes>
      
    </AppLayout>
    
  );
}

export default App;
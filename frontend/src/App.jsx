import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

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

function App() {
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      navigate('/login');
      window.location.reload();
    };

    window.addEventListener('auth:logout', handleLogout);
    
    const interval = setInterval(() => {
      
      const currentToken = localStorage.getItem('token');
      
      if (currentToken && !token) {
        setIsAuthenticated(true);
      } else if (!currentToken && token) {
        setIsAuthenticated(false);
        navigate('/login');
      }

    }, 5000);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      clearInterval(interval);
    };
  
  }, [navigate]);

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} />;
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
        
      </Routes>
      
    </AppLayout>
    
  );
}

export default App;
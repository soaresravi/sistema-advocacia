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

function App() {
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  
    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      navigate('/login');
    };
  
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);

  }, [navigate]);

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} />;
  }

  return (
    
    <AppLayout>

      <Routes>

        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />   

        <Route path="/clientes/dashboard" element={<ClientesDashboard />} />
        <Route path="/clientes/lista" element={<ClientesLista />} />
        <Route path="/clientes/aniversariantes" element={<ClientesAniversariantes /> } />

        <Route path="/processos/dashboard" element={<ProcessosDashboard /> } />
        <Route path="/processos/lista" element={<ProcessosLista /> } />
        <Route path="/processos/prazos" element={<ProcessosPrazos /> } />
        
      </Routes>
      
    </AppLayout>
    
  );
}

export default App;
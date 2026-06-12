import { useState, useEffect } from 'react';
import { Layout, Menu, Drawer } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardOutlined, TeamOutlined, FolderOutlined, CalendarOutlined, DollarOutlined, CheckSquareOutlined, SettingOutlined, BarChartOutlined, UnorderedListOutlined, GiftOutlined, ScheduleOutlined, FileTextOutlined, SwapOutlined, WalletOutlined, MenuUnfoldOutlined, MenuFoldOutlined, MenuOutlined} from '@ant-design/icons';
import './AppLayout.css';

const { Sider } = Layout;

function Sidebar({ onCollapseChange, isMobile }) {
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    
    if (isMobile) {
      setCollapsed(true);
      if (onCollapseChange) onCollapseChange(true);
    }

  }, [isMobile]);

  const toggleCollapsed = () => {
    
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      const newState = !collapsed;
      setCollapsed(newState);
      if (onCollapseChange) onCollapseChange(newState);
    }

  };

  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const menuItems = [
    
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Painel de controle', onClick: () => navigate('/dashboard'), },
  
    { key: 'processos', icon: <FolderOutlined />, label: 'Processos',
    
    children: [
      { key: '/processos/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/processos/dashboard'), },
      { key: '/processos/lista', icon: <UnorderedListOutlined />, label: 'Processos', onClick: () => navigate('/processos/lista'), },
      { key: '/processos/prazos', icon: <ScheduleOutlined />, label: 'Prazos', onClick: () => navigate('/processos/prazos'), },
    ], },

    { key: 'clientes', icon: <TeamOutlined />, label: 'Clientes',
    
    children: [
      { key: '/clientes/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/clientes/dashboard'), },
      { key: '/clientes/lista', icon: <UnorderedListOutlined />, label: 'Clientes', onClick: () => navigate('/clientes/lista'), },
      { key: '/clientes/aniversariantes', icon: <GiftOutlined />, label: 'Aniversariantes', onClick: () => navigate('/clientes/aniversariantes'), },
    ], },
    
    { key: 'eventos', icon: <CalendarOutlined />, label: 'Eventos',
    
    children: [
      
      { key: 'audiencias', icon: <CalendarOutlined />, label: 'Audiências',
      
      children: [
        { key: '/audiencias/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/audiencias/dashboard'), },
        { key: '/audiencias/lista', icon: <UnorderedListOutlined />, label: 'Audiências', onClick: () => navigate('/audiencias/lista'), },
      ], },
      
      { key: 'pericias', icon: <CalendarOutlined />, label: 'Perícias',
      
      children: [
        { key: '/pericias/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/pericias/dashboard'), },
        { key: '/pericias/lista', icon: <UnorderedListOutlined />, label: 'Perícias', onClick: () => navigate('/pericias/lista'), },
      ], },

    ], },

    { key: 'atendimentos', icon: <FileTextOutlined />, label: 'Atendimentos',
    
    children: [
      { key: '/atendimentos/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/atendimentos/dashboard'), },
      { key: '/atendimentos/lista', icon: <UnorderedListOutlined />, label: 'Atendimentos', onClick: () => navigate('/atendimentos/lista'), },
    ], },
    
    { key: 'financeiro', icon: <DollarOutlined />, label: 'Financeiro',
    
    children: [
      { key: '/financeiro/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/financeiro/dashboard'), },
      { key: '/financeiro/recebimentos', icon: <WalletOutlined />, label: 'Recebimentos', onClick: () => navigate('/financeiro/recebimentos'), },
      { key: '/financeiro/despesas', icon: <SwapOutlined />, label: 'Despesas', onClick: () => navigate('/financeiro/despesas'), },
    ], },

    { key: 'tarefas', icon: <CheckSquareOutlined />, label: 'Tarefas',
    
    children: [
      { key: '/tarefas/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/tarefas/dashboard'), },
      { key: '/tarefas/lista', icon: <UnorderedListOutlined />, label: 'Tarefas', onClick: () => navigate('/tarefas/lista'), },
    ], },
    
    { key: '/configuracoes', icon: <SettingOutlined />, label: 'Configurações', onClick: () => navigate('/configuracoes'), },

  ];

  if (isMobile) {
    
    return (
    
    <>
      
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000, padding: 16, cursor: 'pointer', background: '#4e0c1e', borderRadius: '0 0 8px 0' }} onClick={toggleCollapsed}>
        <MenuOutlined style={{ fontSize: 20, color: '#fff' }} />
      </div>
      
      <Drawer placement="left" closable={true} onClose={() => setMobileOpen(false)} open={mobileOpen} size={250} styles={{ body: { padding: 0, background: 'linear-gradient(180deg, #4e0c1e 0%, #350511 100%)' } }}>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} defaultOpenKeys={[]} items={menuItems} style={{ background: 'transparent', fontFamily: 'Poppins, sans-serif', height: '100vh' }} />
      </Drawer>
    
    </>
    );

  }

  return (
  
    <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} trigger={null} style={{ background: 'linear-gradient(180deg, #4e0c1e 0%, #350511 100%)', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100 }} theme="dark">
    
    <div onClick={toggleCollapsed} style={{ height: 64, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s', }}>
      
      {collapsed ? (
        <MenuUnfoldOutlined style={{ fontSize: 24, color: '#ffffff' }} />
      ) : (
        <MenuFoldOutlined style={{ fontSize: 24, color: '#ffffff' }} />
      )}
    
    </div>
    
    <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} defaultOpenKeys={[]} items={menuItems} style={{ background: 'transparent', fontFamily: 'Poppins, sans-serif', }} />
  
  </Sider>
  );
}

export default Sidebar;
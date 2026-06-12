import { Layout, Dropdown, Avatar, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../services/configService';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

function Header() {
 
  const navigate = useNavigate();

  const [user, setUser] = useState({ nome: '', email: '' });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    
    carregarUsuario();

    const handleUserUpdate = () => {
      carregarUsuario();
    };
    
    window.addEventListener('user-updated', handleUserUpdate);

    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreen();
    window.addEventListener('resize', checkScreen);

    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
      window.removeEventListener('resize', checkScreen);
    };

  }, []);

  const carregarUsuario = async () => {
   
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(storedUser);
    }

  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const menuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sair', onClick: handleLogout },
  ];

  return (
  
  <AntHeader style={{ background: '#fff', padding: isMobile ? '0 12px' : '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    
    <div>
      <Text strong style={{ color: '#4e0c1e', fontSize: isMobile ? 12 : 14, marginLeft: isMobile ? 50 : 0 }}> Bem-vindo, {user?.nome || 'Usuário'}! </Text>
    </div>
  
    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
      
      <Space style={{ cursor: 'pointer' }}>
        <Avatar icon={<UserOutlined />} size={isMobile ? 'small' : 'default'} />
        {!isMobile && <Text> {user.email} </Text>}
      </Space>
      
    </Dropdown>

  </AntHeader>
  );
}

export default Header;
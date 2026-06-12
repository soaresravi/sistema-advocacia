import { useState, useEffect } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

function AppLayout({ children }) {

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {

        const checkScreen = () => {

            setIsMobile(window.innerWidth < 768);

            if (window.innerWidth < 768 && !sidebarCollapsed) {
                setSidebarCollapsed(true);
            }

        };

        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
        
    }, [sidebarCollapsed]);

    const sidebarWidth = sidebarCollapsed ? (isMobile ? 0 : 80) : 200;
    const marginLeft = isMobile && sidebarCollapsed ? 0 : sidebarWidth;
    
    return (
        
        <Layout style={{ minHeight: '100vh' }}>
            
            <Sidebar onCollapseChange={setSidebarCollapsed} isMobile={isMobile} />
            
            <Layout style={{ marginLeft, transition: 'all 0.2s', background: '#f0f2f5' }}>    
                <Header />
                <Content style={{ margin: isMobile ? '16px 8px' : '24px 16px', padding: isMobile ? 12 : 24, background: '#f0f2f5', minHeight: 'calc(100vh - 112px)' }}> {children} </Content>
            </Layout>

        </Layout>

    );
}

export default AppLayout;
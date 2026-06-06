import { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

function AppLayout({ children }) {

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const sidebarWidth = sidebarCollapsed ? 80 : 200;
    
    return (
        
        <Layout style={{ minHeight: '100vh' }}>
            
            <Sidebar onCollapseChange={setSidebarCollapsed} />
            
            <Layout style={{ marginLeft: sidebarWidth, transition: 'all 0.2s', background: '#f0f2f5' }}>    
                <Header />
                <Content style={{ margin: '24px 16px', padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 112px)' }}> {children} </Content>
            </Layout>

        </Layout>

    );
}

export default AppLayout;
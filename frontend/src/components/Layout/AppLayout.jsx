import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

function AppLayout({ children }) {
    
    return (
    
    <Layout style={{ minHeight: '100vh' }}>
        
        <Sidebar />
        
        <Layout>
            <Header />
            <Content style={{ margin: '24px 16px', padding: 24, background: '#f0f2f5' }}> {children} </Content>
        </Layout>

    </Layout>
    );
}

export default AppLayout;
import { useState, useEffect } from 'react';
import { Tabs, Card, Row, Col, Statistic, Spin, List, Avatar } from 'antd';
import { UserOutlined, ShopOutlined, TeamOutlined, GiftOutlined } from '@ant-design/icons';

import { getDashboardPF, getDashboardPJ, getAniversariantesHoje } from '../../services/clienteService';

import GraficoBarraHorizontal from '../../components/Graficos/GraficoBarraHorizontal';
import GraficoBarraVertical from '../../components/Graficos/GraficoBarraVertical';
import GraficoRosca from '../../components/Graficos/GraficoRosca';
import '../../components/Layout/AppLayout';

function ClientesDashboard() {
  
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [pfData, setPfData] = useState(null);
    const [pjData, setPjData] = useState(null);
    const [aniversariantesHoje, setAniversariantesHoje] = useState([]);
    const [activeTab, setActiveTab] = useState('pf');

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        
        setLoading(true);
        
        try {
            
            const [pf, pj, aniversarios] = await Promise.all([
                getDashboardPF(),
                getDashboardPJ(),
                getAniversariantesHoje(),
            ]);
            
            setPfData(pf);
            setPjData(pj);
            setAniversariantesHoje(aniversarios);
    
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    
    };
    
    if (loading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }
    
    const totalClientes = (pfData?.total || 0) + (pjData?.total || 0);

    const tabItems = [
        
        { key: 'pf', label: 'Pessoa Física', children: pfData && (
            
            <Row gutter={[12, 12]}>
                
                <Col xs={24} md={12}>
                
                    <Card size="small">
                        <GraficoBarraHorizontal data={pfData.estadoCivil} title="Clientes por estado civil" isMobile={isMobile} />
                    </Card>

                </Col>
                    
                <Col xs={24} md={12}>
                   
                    <Card size="small">
                        <GraficoRosca data={pfData.sexo} title="Clientes por sexo" isMobile={isMobile} />
                    </Card>
        
                </Col>
                    
                <Col xs={24} md={12}>
                    
                    <Card size="small">
                        <GraficoBarraVertical data={pfData.faixaEtaria} title="Clientes por faixa etária" isMobile={isMobile} />
                    </Card>
                
                </Col>
                    
                <Col xs={24} md={12}>
            
                    <Card size="small">
                        <GraficoBarraVertical data={pfData.localizacao} title="Localização por estado" isMobile={isMobile} />
                    </Card>
            
                </Col>
                    
                <Col xs={24}>
                    
                    <Card size="small">
                        <GraficoBarraHorizontal data={pfData.comoConheceu} title="Como conheceu o escritório" isMobile={isMobile} />
                    </Card>
                
                </Col>
            
            </Row>
        
        )},

        { key: 'pj', label: 'Pessoa Jurídica', children: pjData && (
            
            <Row gutter={[12, 12]}>
                
                <Col xs={24} md={12}>
                    
                    <Card size="small">
                        <GraficoBarraVertical data={pjData.localizacao} title="Localização por estado" isMobile={isMobile} />
                    </Card>
                
                </Col>
                    
                <Col xs={24} md={12}>
            
                    <Card size="small">
                        <GraficoBarraHorizontal data={pjData.comoConheceu} title="Como conheceu o escritório" isMobile={isMobile} />
                    </Card>
    
                </Col>
                    
                <Col xs={24}>
            
                    <Card size="small">
                        <GraficoBarraVertical data={pjData.segmento} title="Clientes por segmento de atuação" isMobile={isMobile} />
                    </Card>

                </Col>
            </Row>
        )}

    ];
    
    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>
        
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            
            <Col xs={12} sm={12} md={6} lg={6}>
            
                <Card size="small">
                    <Statistic title="Total de clientes" value={totalClientes} prefix={<TeamOutlined />} styles={{ content: { color: '#4e0c1e', fontSize: isMobile ? 16 : 20 } }} />
                </Card>

            </Col>
            
            <Col xs={12} sm={12} md={6} lg={6}>

                <Card size="small">
                    <Statistic title="Pessoas físicas" value={pfData?.total || 0} prefix={<UserOutlined />} styles={{ content: { color: '#4e0c1e', fontSize: isMobile ? 16 : 20 } }} />
                </Card>

            </Col>
            
            <Col xs={12} sm={12} md={6} lg={6}>

                <Card size="small">
                    <Statistic title="Pessoas jurídicas" value={pjData?.total || 0} prefix={<ShopOutlined />} styles={{ content: { color: '#4e0c1e', fontSize: isMobile ? 16 : 20 } }} />
                </Card>

            </Col>
            
            <Col xs={12} sm={12} md={6} lg={6}>
                
                <Card size="small">
                    
                    <Statistic title="Aniversariantes de hoje" value={aniversariantesHoje.length} prefix={<GiftOutlined />} styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
                    
                    {aniversariantesHoje.length > 0 && (
                        
                        <List size="small" dataSource={aniversariantesHoje.slice(0, isMobile ? 3 : 2)} renderItem={(item) => (
                            
                            <List.Item style={{ padding: '4px 0' }}>
                                <List.Item.Meta avatar={<Avatar icon={<UserOutlined />} size={isMobile ? 'small' : 'default'} /> } title={<span style={{ fontSize: isMobile ? 11 : 12 }}>{item.nome}</span>} description={<span style={{ fontSize: isMobile ? 10 : 11 }}>{item.telefone}</span>} />
                            </List.Item>

                        )} style={{ marginTop: 8 }} />
                    )}

                </Card>

            </Col>

        </Row>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" size="small" items={tabItems} />

    </div>
  );
}

export default ClientesDashboard;
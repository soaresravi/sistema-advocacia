import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Spin, Button, Tag, Space } from 'antd';
import { FolderOutlined, TeamOutlined, CalendarOutlined, WarningOutlined, ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined, GiftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import dayjs from "dayjs";

function DashboardPrincipal() {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        
        const checkScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    
    }, []);

    useEffect(() => {
        carregarDashboard();
    }, []);

    const carregarDashboard = async () => {

        setLoading(true);

        try {
            const response = await api.get('/dashboard');
            setData(response.data);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }

    };

    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };
    
    const getUrgenciaColor = (urgencia) => {
        
        const colors = {
            'Exige atenção imediata': '#ff4d4f',
            'Muito urgente': '#ff7a45',
            'Requer atenção': '#faad14',
            'Pouco urgente': '#52c41a',
            'Pode esperar': '#1890ff'
        };
        
        return colors[urgencia] || '#d9d9d9';
      
    };
    
    if (loading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }
    
    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        
            <Col span={12}>
                
                <Card size="small">
                    
                    <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 'bold', color: '#4e0c1e' }}>
                        {data?.dataHoje}
                    </div>
              
                </Card>
            
            </Col>

            <Col span={12} style={{ textAlign: 'right' }}>
                <Button icon={<ReloadOutlined />} onClick={carregarDashboard}> Atualizar </Button>
            </Col>
        
        </Row>
    
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            
            <Col xs={12} sm={12} md={6}>
            
                <Card size="small" style={{ cursor: 'pointer' }} onClick={() => navigate('/processos/lista')}>
                    <Statistic title="Processos ativos" value={data?.cards?.processosAtivos || 0} prefix={<FolderOutlined style={{ color: '#4e0c1e' }} />} styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
                </Card>

            </Col>

            <Col xs={12} sm={12} md={6}>
                
                <Card size="small" style={{ cursor: 'pointer' }} onClick={() => navigate('/clientes/lista')}>
                    <Statistic title="Clientes cadastrados" value={data?.cards?.clientesCadastrados || 0} prefix={<TeamOutlined style={{ color: '#4e0c1e' }} />} styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
                </Card>

            </Col>
            
            <Col xs={12} sm={12} md={6}>
                
                <Card size="small" style={{ cursor: 'pointer' }} onClick={() => navigate('/audiencias/lista')}>      
                    <Statistic title="Audiências agendadas" value={data?.cards?.audienciasAgendadas || 0} prefix={<CalendarOutlined style={{ color: '#8b1a4a' }} />} styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
                </Card>

            </Col>

            <Col xs={12} sm={12} md={6}>
               
                <Card size="small" style={{ cursor: 'pointer' }} onClick={() => navigate('/pericias/lista')}>
                    <Statistic title="Perícias agendadas" value={data?.cards?.periciasAgendadas || 0} prefix={<CalendarOutlined style={{ color: '#c42560' }} />} styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
                </Card>

            </Col>

        </Row>
        
        <Row style={{ marginBottom: 20 }}>
            
            <Col span={24}>
                <Button type="primary" style={{ background: '#4e0c1e', width: '100%' }} onClick={() => navigate('/processos/prazos')}> Ver próximos prazos de processos → </Button>
            </Col>

        </Row>

        <Card size="small" title={<span style={{ color: '#4e0c1e' }}><WarningOutlined style={{ color: '#faad14' }} /> Alertas para hoje</span>} style={{ marginBottom: 20 }}>
            
            <Row gutter={[12, 12]}>
                
                <Col xs={12} md={6}>
                    
                    <div style={{ textAlign: 'center', padding: 8, background: '#fff7e6', borderRadius: 8 }}>
                        
                        <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 'bold', color: '#faad14' }}>
                            {data?.alertasHoje?.prazosAbertosHoje || 0}
                        </div>
                        
                        <div style={{ fontSize: isMobile ? 10 : 12, color: '#666' }}>Prazos em aberto</div>
                    
                    </div>
                
                </Col>
                
                <Col xs={12} md={6}>
                    
                    <div style={{ textAlign: 'center', padding: 8, background: '#f6ffed', borderRadius: 8 }}>
                        
                        <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 'bold', color: '#52c41a' }}>
                            {data?.alertasHoje?.periciasHoje || 0}
                        </div>
                        
                        <div style={{ fontSize: isMobile ? 10 : 12, color: '#666' }}>Perícias agendadas</div>
                    
                    </div>
                
                </Col>
                
                <Col xs={12} md={6}>
                    
                    <div style={{ textAlign: 'center', padding: 8, background: '#e6f7ff', borderRadius: 8 }}>
                        
                        <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 'bold', color: '#1890ff' }}>
                            {data?.alertasHoje?.audienciasHoje || 0}
                        </div>
                        
                        <div style={{ fontSize: isMobile ? 10 : 12, color: '#666' }}>Audiências agendadas</div>
                    
                    </div>
                
                </Col>
                
                <Col xs={12} md={6}>
                    
                    <div style={{ textAlign: 'center', padding: 8, background: '#fff0f6', borderRadius: 8 }}>
                        
                        <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 'bold', color: '#eb2f96' }}>
                            {data?.alertasHoje?.clientesParaRetornarHoje || 0}
                        </div>
                        
                        <div style={{ fontSize: isMobile ? 10 : 12, color: '#666' }}>Clientes para retornar</div>
                    
                    </div>
                
                </Col>
            
            </Row>
            
            {data?.alertasHoje?.clientesAniversariantesHoje > 0 && (
            
                <div style={{ marginTop: 12, padding: 8, background: '#fffbe6', borderRadius: 8 }}>
                    <GiftOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    <span>{data?.alertasHoje?.clientesAniversariantesHoje} cliente(s) aniversariante(s) hoje!</span>
                </div>
           
           )}

        </Card>

        <Card size="small" title={<span style={{ color: '#4e0c1e' }}> Próximos 7 dias</span>} style={{ marginBottom: 20 }}>
            
            <Row gutter={[12, 12]}>
                
                <Col xs={8} style={{ textAlign: 'center' }}>
                    
                    <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 'bold', color: '#faad14' }}>
                        {data?.alertasProximos7Dias?.prazosAbertosProximos7Dias || 0}
                    </div>
                    
                    <div style={{ fontSize: isMobile ? 10 : 12 }}>Prazos</div>
                
                </Col>
                
                <Col xs={8} style={{ textAlign: 'center' }}>
                    
                    <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 'bold', color: '#52c41a' }}>
                        {data?.alertasProximos7Dias?.periciasProximos7Dias || 0}
                    </div>
                    
                    <div style={{ fontSize: isMobile ? 10 : 12 }}>Perícias</div>
                
                </Col>
                
                <Col xs={8} style={{ textAlign: 'center' }}>
                    
                    <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 'bold', color: '#1890ff' }}>
                        {data?.alertasProximos7Dias?.audienciasProximos7Dias || 0}
                    </div>
                    
                    <div style={{ fontSize: isMobile ? 10 : 12 }}>Audiências</div>
                
                </Col>
            
            </Row>

        </Card>
    
        {data?.tarefasAtrasadas?.total > 0 && (
            
            <Card size="small" title={<span style={{ color: '#4e0c1e' }}><WarningOutlined style={{ color: '#ff4d4f' }} /> Tarefas atrasadas ({data?.tarefasAtrasadas?.total})</span>} style={{ marginBottom: 20 }}>
                
                <Space wrap style={{ marginBottom: 12 }}>
                    
                    {data?.tarefasAtrasadas?.exigeAtencaoImediata > 0 && (
                        <Tag color="error">Exige atenção imediata: {data?.tarefasAtrasadas?.exigeAtencaoImediata}</Tag>
                    )}
                    
                    {data?.tarefasAtrasadas?.muitoUrgente > 0 && (
                        <Tag color="orange">Muito urgente: {data?.tarefasAtrasadas?.muitoUrgente}</Tag>
                    )}
                
                    {data?.tarefasAtrasadas?.requerAtencao > 0 && (
                        <Tag color="gold">Requer atenção: {data?.tarefasAtrasadas?.requerAtencao}</Tag>
                    )}
                    
                    {data?.tarefasAtrasadas?.poucoUrgente > 0 && (
                        <Tag color="green">Pouco urgente: {data?.tarefasAtrasadas?.poucoUrgente}</Tag>
                    )}
                
                </Space>

                <div style={{ marginTop: 12 }}>
                    
                    {data?.tarefasAtrasadas?.lista?.slice(0, 5).map((item) => (
                    
                        <div key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', width: '100%'}}>
                            
                            <div style={{ fontWeight: 'bold' }}>{item.tarefa}</div>
                            
                            <div style={{ fontSize: isMobile ? 10 : 12, color: '#666' }}>
                                Prazo: {dayjs(item.prazoTarefa).format('DD/MM/YYYY')} | Atraso: {item.diasAtraso} dias | <Tag color={getUrgenciaColor(item.urgencia)} style={{ marginLeft: 8 }}>{item.urgencia}</Tag>
                            </div>
                        
                        </div>
                    
                    ))}
                
                </div>
                
                {data?.tarefasAtrasadas?.lista?.length > 5 && (
                
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                        <Button type="link" onClick={() => navigate('/tarefas/lista')}> Ver todas as {data?.tarefasAtrasadas?.total} tarefas atrasadas </Button>
                    </div>
                
                )}
                
            </Card>
        
        )}
        
        <Card size="small" title={<span style={{ color: '#4e0c1e' }}>Resumo financeiro</span>}>
            
            <Row gutter={[12, 12]}>
                
                <Col xs={12} sm={6}>
                    
                    <div style={{ textAlign: 'center', padding: 8, background: '#f6ffed', borderRadius: 8 }}>
                        
                        <ArrowUpOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                        
                        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 'bold', color: '#52c41a' }}>
                            {formatCurrency(data?.financeiro?.totalAReceberHoje)}
                        </div>
                        
                        <div style={{ fontSize: isMobile ? 9 : 11 }}>A receber hoje</div>
                    
                    </div>
                    
                </Col>
                
                <Col xs={12} sm={6}>
                    
                    <div style={{ textAlign: 'center', padding: 8, background: '#fff2f0', borderRadius: 8 }}>
                        
                        <ArrowDownOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                        
                        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 'bold', color: '#ff4d4f' }}>
                            {formatCurrency(data?.financeiro?.totalAPagarHoje)}
                        </div>
                        
                        <div style={{ fontSize: isMobile ? 9 : 11 }}>A pagar hoje</div>
                    
                    </div>
                
                </Col>
                
                <Col xs={12} sm={6}>
                    
                    <div style={{ textAlign: 'center', padding: 8, background: '#fff7e6', borderRadius: 8 }}>
                        
                        <WarningOutlined style={{ color: '#faad14', fontSize: 16 }} />
                        
                        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 'bold', color: '#faad14' }}>
                            {formatCurrency(data?.financeiro?.totalRecebimentosAtraso)}
                        </div>
                        
                        <div style={{ fontSize: isMobile ? 9 : 11 }}>Recebimentos atrasados</div>
                    
                    </div>
                
                </Col>
                
                <Col xs={12} sm={6}>
                    
                    <div style={{ textAlign: 'center', padding: 8, background: '#fff2f0', borderRadius: 8 }}>
                        
                        <WarningOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                        
                        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 'bold', color: '#ff4d4f' }}>
                            {formatCurrency(data?.financeiro?.totalDespesasAtraso)}
                        </div>
                        
                        <div style={{ fontSize: isMobile ? 9 : 11 }}>Despesas atrasadas</div>
                    
                    </div>
                
                </Col>
            
            </Row>

        </Card>
    
    </div>
    );
}

export default DashboardPrincipal;
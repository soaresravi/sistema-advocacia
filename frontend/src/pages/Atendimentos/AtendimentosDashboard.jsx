import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Spin, Select, message, Tooltip } from 'antd';
import { DollarOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { getAtendimentosDashboard, getContatosHoje } from '../../services/atendimentoService';

import GraficoLinha from '../../components/Graficos/GraficoLinha';
import GraficoRosca from '../../components/Graficos/GraficoRosca';

function AtendimentosDashboard() {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [contatosHoje, setContatosHoje] = useState([]);
    const [ano, setAno] = useState(new Date().getFullYear());

    useEffect(() => {
        carregarDados();
    }, [ano]);

    const carregarDados = async () => {

        setLoading(true);

        try {

            const [dashboard, contatos] = await Promise.all([
                getAtendimentosDashboard(ano),
                getContatosHoje(),
            ]);

            setData(dashboard);
            setContatosHoje(contatos);

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            message.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }

    };

    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (loading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }

    return (
    
    <div style={{ padding: 16 }}>
        
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            
            <Col xs={12} sm={12} md={8}>
                
                <Card size="small">
                    <Statistic title="Total de atendimentos" value={data?.total || 0} prefix={<TeamOutlined />} styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
                </Card>
            
            </Col>
            
            <Col xs={12} sm={12} md={8}>
                
                <Card size="small">
                    <Statistic title="Valor total em consultas" value={formatCurrency(data?.totalConsultas)} prefix={<DollarOutlined />} styles={{ content: { color: '#8b1a4a', fontSize: 20 } }} />
                </Card>
            
            </Col>
            
            <Col xs={24} sm={24} md={8}>
                
                <Card size="small" title="Contatos a fazer hoje">
                    
                    {contatosHoje.length === 0 ? (
                    
                        <div style={{ textAlign: 'center', padding: 10, color: '#999' }}>
                            Nenhum contato pendente
                        </div>
                    
                    ) : (
                        
                        contatosHoje.map((item) => (
                        
                            <div key={item.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                                
                                <div style={{ fontWeight: 500, color: '#4e0c1e' }}>{item.nome}</div>
                                
                                <div style={{ fontSize: 12, color: '#666' }}>
                                    {item.telefone} | {item.email} | {item.assunto}
                                </div>
                            
                            </div>

                        ))
                    
                    )}

                </Card>
            
            </Col>
        </Row>
        
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            
            <Col xs={24} md={12}>
                
                <Card size="small">
                    <GraficoRosca data={data?.novosAntigos} title="Novos x Antigos clientes" />
                </Card>
                
            </Col>
            
            <Col xs={24} md={12}>
                
                <Card size="small">
                    <GraficoRosca data={data?.fechouContrato} title="Fechou contrato?" />
                </Card>
            </Col>
        
        </Row>
        
        <Row gutter={[12, 12]}>
            
            <Col xs={24}>
                
                <Card size="small">
                    
                    <GraficoLinha data={data?.porMes} title="Atendimentos por mês" ano={ano} />
                    
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                        <Select value={ano} onChange={setAno} size="small" style={{ width: 100 }} options={[2023, 2024, 2025, 2026].map(y => ({ value: y, label: y }))} />
                    </div>
                
                </Card>
            
            </Col>
            
        </Row>

    </div>
    );
}

export default AtendimentosDashboard
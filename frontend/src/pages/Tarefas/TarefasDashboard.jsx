import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Spin, Select, Progress, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { getTarefasDashboard, getTarefasAtrasadas } from '../../services/tarefaService';

import GraficoLinha from '../../components/Graficos/GraficoLinha';

function TarefasDashboard() {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [ano, setAno] = useState(new Date().getFullYear());
    const anoAtual = new Date().getFullYear();
    const anosOptions = [anoAtual - 3, anoAtual - 2, anoAtual - 1, anoAtual].map(y => ({ value: y, label: y }));
    const [tarefasPorMes, setTarefasPorMes] = useState({});
    const [atrasadasPorUrgencia, setAtrasadasPorUrgencia] = useState([]);

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        carregarDados();
        carregarAtrasadas();
    }, [ano]);

    useEffect(() => {

        if (data?.tarefasPorMes) {

            const porMes = {};

            for (let mes = 1; mes <= 12; mes++) {
                porMes[mes] = data.tarefasPorMes[mes]?.total || 0;
            }

            setTarefasPorMes(porMes);

        }

    }, [data]);

    const carregarDados = async () => {

        setLoading(true);

        try {
            const response = await getTarefasDashboard(ano);
            setData(response);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }

    };

    const carregarAtrasadas = async () => {

        try {
            const response = await getTarefasAtrasadas();
            setAtrasadasPorUrgencia(response || []);
        } catch (error) {
            console.error('Erro ao carregar tarefas atrasadas:', error);
        }

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

        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                
            <Col xs={12} sm={12} md={6}>

                <Card size="small">
                    <Statistic title="Total de tarefas" value={data?.total || 0} prefix={<UnorderedListOutlined style={{ color: '#4e0c1e' }} />} styles={{ content: { color: '#4e0c1e', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>

            <Col xs={12} sm={12} md={6}>
        
                <Card size="small">
                    <Statistic title="Concluídas" value={data?.concluidas || 0} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} styles={{ content: { color: '#4e0c1e', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>

            <Col xs={12} sm={12} md={6}>
            
                <Card size="small">
                    <Statistic title="Não concluídas" value={data?.naoConcluidas || 0} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} styles={{ content: { color: '#4e0c1e', fontSize: isMobile ? 16 : 20 } }} />
                </Card>

            </Col>

            <Col xs={12} sm={12} md={6}>
                
                <Card size="small">
                    
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: isMobile ? 10 : 12, color: '#888', marginBottom: 4 }}>Progresso</div>
                        <Progress type="circle" percent={data?.progresso || 0} size={isMobile ? 50 : 60} strokeColor="#4e0c1e" format={(percent) => <span style={{ fontSize: isMobile ? 11 : 14 }}>{percent}%</span>} />
                    </div>

                </Card>
            
            </Col>

        </Row>
        
        {atrasadasPorUrgencia.length > 0 && (
            
            <Card size="small" style={{ marginBottom: 20 }} title={ <span><WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />Tarefas atrasadas ({atrasadasPorUrgencia.length})</span>}>
                
                <div style={{ maxHeight: isMobile ? 250 : 300, overflowY: 'auto' }}>
                    
                    {atrasadasPorUrgencia.map((tarefa, index) => (
                        
                        <div key={index} style={{ padding: '8px 12px', marginBottom: 8, background: '#fafafa', borderRadius: 6, borderLeft: `4px solid ${getUrgenciaColor(tarefa.urgencia)}`}}>
                            
                            <Row justify="space-between" align="middle">
                                
                                <Col span={16}>
                                
                                    <div style={{ fontWeight: 'bold', fontSize: isMobile ? 12 : 13 }}>{tarefa.tarefa}</div>
                                
                                    <div style={{ fontSize: isMobile ? 11 : 12, color: '#666' }}>
                                        Responsável: {tarefa.responsavel || '—'} | Dias de atraso: {tarefa.diasAtraso}
                                    </div>
                                
                                </Col>
                                
                                <Col span={8} style={{ textAlign: 'right' }}>
                                    
                                    <Tag color={getUrgenciaColor(tarefa.urgencia)}>{tarefa.urgencia}</Tag>
                                
                                    <div style={{ fontSize: 11, color: '#999' }}>
                                        Prazo: {new Date(tarefa.prazoTarefa).toLocaleDateString('pt-BR')}
                                    </div>
                                
                                </Col>
                            
                            </Row>

                        </div>   
                    ))}
                </div>
            </Card>
        )}

        <Card size="small">
            
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Select value={ano} onChange={setAno} size="small" style={{ width: isMobile ? '80%' : 100 }} options={anosOptions} />
            </div>
            
            <GraficoLinha data={tarefasPorMes} title="Tarefas por mês" ano={ano} isMobile={isMobile} />
            
        </Card>

    </div>
    );
}

export default TarefasDashboard;
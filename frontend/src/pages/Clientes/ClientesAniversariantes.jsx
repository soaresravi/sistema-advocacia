import { useState, useEffect } from 'react';
import { Card, Select, Table, Row, Col, Statistic, message, Tag, Typography } from 'antd';
import { GiftOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { getAniversariantes, getAniversariantesHoje } from '../../services/clienteService';

function ClientesAniversariantes() {

    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [data, setData] = useState([]);
    const [aniversariantesHoje, setAniversariantesHoje] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const meses = [
        { value: 1, label: 'Janeiro' },
        { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' },
        { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' },
        { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' },
        { value: 12, label: 'Dezembro' },
    ];

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        carregarAniversariantes();
        carregarAniversariantesHoje();
    }, [selectedMonth]);

    const carregarAniversariantes = async () => {

        setLoading(true);

        try {
            const response = await getAniversariantes(selectedMonth);
            setData(response);
        } catch (error) {
            message.error('Erro ao carregar aniversariantes');
        } finally {
            setLoading(false);
        }
        
    };

    const carregarAniversariantesHoje = async () => {

        try {
            const response = await getAniversariantesHoje();
            setAniversariantesHoje(response);
        } catch (error) {
            console.error('Erro ao carregar aniversariantes de hoje:', error);
        }

    };

    const columns = [
        { title: 'ID', dataIndex: 'id', width: 80, sorter: (a, b) => a.id - b.id, },
        { title: 'Nome', dataIndex: 'nome', sorter: (a, b) => a.nome.localeCompare(b.nome), },
        { title: 'Data de nascimento', dataIndex: 'dataNascimento', width: 150, render: (text) => text ? new Date(text).toLocaleDateString('pt-BR') : '-', sorter: (a, b) => new Date(a.dataNascimento) - new Date(b.dataNascimento), },
        { title: 'Idade', dataIndex: 'idade', width: 80, sorter: (a, b) => a.idade - b.idade, },
        { title: 'Telefone', dataIndex: 'telefone', width: 130, },
        { title: 'Email', dataIndex: 'email', ellipsis: true, },
    ];

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            
            <Col xs={24} sm={12} md={8}>
                
                <Card size="small">
                    
                    <Statistic title="Aniversariantes de hoje" value={aniversariantesHoje.length} prefix={<GiftOutlined style={{ color: '#e05580' }} />} styles={{ content: { color: '#4e0c1e', fontSize: isMobile ? 20 : 24 } }} />
                    
                    {aniversariantesHoje.length > 0 && (
                    
                        <div style={{ marginTop: 12 }}>
                            
                            {aniversariantesHoje.slice(0, 3).map((item) => (
                                
                                <div key={item.id} style={{ marginBottom: 8, fontSize: 12 }}>
                                    <div style={{ fontWeight: 500, color: '#4e0c1e' }}>{item.nome}</div>
                                    <div style={{ color: '#888' }}>{item.telefone} | {item.email}</div>
                                </div>
                            
                            ))}
                            
                            {aniversariantesHoje.length > 3 && (
                                
                                <div style={{ fontSize: 12, color: '#8b1a4a', marginTop: 4 }}>
                                    +{aniversariantesHoje.length - 3} outros
                                </div>

                            )}
                        
                        </div>

                    )}
                </Card>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
                
                <Card size="small">
                    <Statistic title="Aniversariantes do mês" value={data.length} prefix={<CalendarOutlined style={{ color: '#8b1a4a' }} />} styles={{ content: { color: '#4e0c1e', fontSize: isMobile ? 20 : 24 } }} />
                </Card>

            </Col>
            
            <Col xs={24} sm={12} md={8}>
                
                <Card size="small">
                    <Statistic title="Total de clientes" value={[...data, ...aniversariantesHoje].length} prefix={<UserOutlined style={{ color: '#c42560' }} />} styles={{ content: { color: '#4e0c1e', fontSize: isMobile ? 20 : 24 } }} />
                </Card>

            </Col>

        </Row>

        <Card size="small">
            
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
                
                <div style={{ width: isMobile ? '100%' : 'auto' }}>
                    <span style={{ marginRight: 8, fontWeight: 500 }}>Selecione o mês:</span>
                    <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: isMobile ? '100%' : 150 }} size="small" options={meses} />
                </div>
                
                {selectedMonth === new Date().getMonth() + 1 && ( <Tag color="#4e0c1e" style={{ borderRadius: 16 }}> Mês atual </Tag> )}

            </div>

            {!isMobile && (
                <Table columns={columns} dataSource={data} rowKey="id" loading={loading} size="small" pagination={{ pageSize: 10, showTotal: (total) => `Total de ${total} aniversariantes` }} />
            )}
            
            {isMobile && (
            
                <div>
                    
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>Carregando...</div>
                    ) : data.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                            Nenhum aniversariante neste mês
                        </div>
                    ) : (
                    
                        <>
                        
                            {data.map((item) => (
                            
                                <Card key={item.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <Typography.Text strong style={{ color: '#4e0c1e', fontSize: 13 }}> {item.nome} </Typography.Text>
                                        <Typography.Text style={{ fontSize: 11, color: '#666' }}> {item.idade} anos </Typography.Text>
                                    </div>
                                    
                                    <Row gutter={[6, 4]}>
                                        
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Data Nasc.</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{item.dataNascimento ? new Date(item.dataNascimento).toLocaleDateString('pt-BR') : '-'}</div>
                                        </Col>
                                        
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>ID</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{item.id}</div>
                                        </Col>
                                    
                                    </Row>
                                    
                                    <Row gutter={[6, 4]}>
                                    
                                        <Col span={24}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Telefone</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{item.telefone || '-'}</div>
                                        </Col>
                                    
                                    </Row>
                                    
                                    <Row gutter={[6, 4]}>
                                        
                                        <Col span={24}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Email</Typography.Text>
                                            <div style={{ fontSize: 11, wordBreak: 'break-all' }}>{item.email || '-'}</div>
                                        </Col>
                                    
                                    </Row>
                                
                                </Card>
                            ))}
                        </>
                    )}
                </div>
            )}
        </Card>

    </div>
    );
}

export default ClientesAniversariantes;
import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Table, Tabs, Badge, Button, Space, DatePicker, notification, Typography, Tag } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { getPrazosHoje, getPrazosProximos, getCalendarioPrazos } from '../../services/processoService';

import dayjs from 'dayjs';
import '../../components/Layout/AppLayout';

dayjs.locale('pt-br');

function ProcessosPrazos() {

  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prazosHoje, setPrazosHoje] = useState([]);
  const [prazosProximos, setPrazosProximos] = useState([]);
  const [prazosFiltrados, setPrazosFiltrados] = useState([]);
  const [calendario, setCalendario] = useState({});
  const [activeTab, setActiveTab] = useState('lista');

  const showNotification = (type, message) => {
        
    notification[type]({
      title: null,
      description: message,
      placement: 'bottomRight',
      duration: 10,
      showProgress: true,
      pauseOnHover: false,
      closable: true,
    });

  };

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

      const [hoje, proximos, calendarioData] = await Promise.all([
        getPrazosHoje(),
        getPrazosProximos(),
        getCalendarioPrazos(),
      ]);

      setPrazosHoje(hoje);
      setPrazosProximos(proximos);
      setPrazosFiltrados(proximos);
      setCalendario(calendarioData);

    } catch (error) {
      console.error('Erro ao carregar prazos:', error);
      showNotification('error', 'Erro ao carregar prazos');
    } finally {
      setLoading(false);
    }

  };

  const colunasLista = [
        
    { title: 'ID', dataIndex: 'id', width: isMobile ? 60 : 70 },
    { title: 'Nº Processo', dataIndex: 'numeroProcesso', width: isMobile ? 150 : 200 },
    { title: 'Cliente', dataIndex: 'clienteNome', width: isMobile ? 120 : 200 },
    { title: 'Data do Prazo', dataIndex: 'dataPrazo', width: isMobile ? 100 : 120, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        
    { title: 'Status', key: 'status', width: isMobile ? 110 : 120, render: (_, record) => {
            
      const diasRestantes = record.diasRestantes;
            
      if (diasRestantes < 0) {
        return <Badge status="error" text="Atrasado" />;
      } else if (diasRestantes === 0) {
        return <Badge status="warning" text="Vence hoje" />;
      } else if (diasRestantes <= 3) {
        return <Badge status="processing" text={`Vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`} />;
      }
            
      return <Badge status="default" text={`Vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`} />;

    }, },

  ];

  const calendarioData = Object.entries(calendario).map(([data, processos]) => ({
    data: dayjs(data).format('DD/MM/YYYY'),
    dataOriginal: data,
    processos,
    quantidade: processos.length,
  }));

  const colunasCalendario = [
        
    { title: 'Data', dataIndex: 'data', width: isMobile ? 90 : 120, sorter: (a, b) => dayjs(a.dataOriginal).unix() - dayjs(b.dataOriginal).unix() },
    { title: 'Quantidade', dataIndex: 'quantidade', width: isMobile ? 80 : 100, render: (text) => <Badge count={text} style={{ backgroundColor: '#4e0c1e' }} /> },
        
    { title: 'Processos', dataIndex: 'processos', render: (processos) => (
        
      <Space wrap size={isMobile ? 'small' : 'middle'}>
      
        {processos.map((p, idx) => (
          <Button key={idx} type="link" size="small" style={{ color: '#4e0c1e', padding: 0, fontSize: isMobile ? 11 : 12 }}> {p.numeroProcesso} </Button>
        ))}
      
      </Space>

    ), },

  ];

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
  }
    
  return (
  
  <div style={{ padding: isMobile ? 8 : 16 }}>
    
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      
      <Col xs={24} sm={12} md={8}>
        
        <Card size="small">
          
          <Statistic title="Prazos para hoje" value={prazosHoje.length} prefix={<WarningOutlined style={{ color: '#faad14' }} />} styles={{ content: { color: '#4e0c1e', fontSize: isMobile ? 20 : 24 } }} />
          
          {prazosHoje.length > 0 && (
            
            <div style={{ marginTop: 12 }}>
              
              {prazosHoje.map((item) => (
                
                <div key={item.id} style={{ marginBottom: 8, fontSize: isMobile ? 10 : 12 }}>
                  <div style={{ fontWeight: 500, color: '#4e0c1e' }}>{item.numeroProcesso}</div>
                  <div style={{ color: '#888', fontSize: isMobile ? 10 : 12 }}>{item.clienteNome}</div>
                </div>
              
              ))}
            
            </div>
          
          )}
        
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8}>
        
        <Card size="small">
          <Statistic title="Prazos próximos 7 dias" value={prazosProximos.length} prefix={<ClockCircleOutlined style={{ color: '#8b1a4a' }} />} styles={{ content: { color: '#4e0c1e', fontSize: 24 } }} />
        </Card>
      
      </Col>

      <Col xs={24} sm={12} md={8}>
        
        <Card size="small">
          <Statistic title="Processos com prazo aberto" value={prazosProximos.length} prefix={<CalendarOutlined style={{ color: '#c42560' }} />} styles={{ content: { color: '#4e0c1e', fontSize: 24 } }} />
        </Card>

      </Col>
    
    </Row>
    
    <Card size="small">
      
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" size="small" className="custom-tabs" items={[
        
        { key: 'lista', label: 'Lista de Prazos', children: (
          
          <div>

            {!isMobile && (
              
              <div>
                
                {prazosProximos.length === 0 ? (
                
                <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 14 }}>
                  Nenhum prazo nos próximos 7 dias
                </div>
            
                ) : (
              
                  <>
                
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  
                      <DatePicker.RangePicker placeholder={['Data inicial', 'Data final']} format="DD/MM/YYYY"
                  
                      onChange={(dates) => {
                    
                        if (dates && dates[0] && dates[1]) {  
                          const filtered = prazosProximos.filter(p => dayjs(p.dataPrazo).isAfter(dates[0].subtract(1, 'day')) && dayjs(p.dataPrazo).isBefore(dates[1].add(1, 'day')) );
                          setPrazosFiltrados(filtered);
                        } else {
                          setPrazosFiltrados(prazosProximos);
                        }
                  
                      }} allowClear size="small" />

                    </div>
                
                    <Table dataSource={prazosFiltrados} columns={colunasLista} rowKey="id" size="small" pagination={{ pageSize: 10 }} />
              
                  </>
            
                )}

              </div>  
            
            )}
            
            {isMobile && (
            
              <div>
                
                <div style={{ marginBottom: 16 }}>
              
                  <DatePicker.RangePicker placeholder={['Início', 'Fim']} format="DD/MM/YYYY"
                  
                  onChange={(dates) => {
                    
                    if (dates && dates[0] && dates[1]) {    
                      const filtered = prazosProximos.filter(p => dayjs(p.dataPrazo).isAfter(dates[0].subtract(1, 'day')) && dayjs(p.dataPrazo).isBefore(dates[1].add(1, 'day')));
                      setPrazosFiltrados(filtered);
                    } else {
                      setPrazosFiltrados(prazosProximos);
                    }
                  
                  }} allowClear size="small" style={{ width: '100%' }} />
                
                </div>

                {prazosFiltrados.length === 0 ? (
                  
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    Nenhum prazo nos próximos 7 dias
                  </div>
            
                ) : (
                  
                  <>
                    
                    {prazosFiltrados.map((item) => {
                      
                      const diasRestantes = item.diasRestantes;
                      let statusColor = '';
                      let statusText = '';
                            
                      if (diasRestantes < 0) {
                        statusColor = '#ff4d4f';
                        statusText = 'Atrasado';
                      } else if (diasRestantes === 0) {
                        statusColor = '#faad14';
                        statusText = 'Vence hoje';
                      } else if (diasRestantes <= 3) {
                        statusColor = '#1890ff';
                        statusText = `Vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`;
                      } else {
                        statusColor = '#52c41a';
                        statusText = `Vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`;
                      }

                      return (
                        
                        <Card key={item.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>      
                            <Typography.Text strong style={{ color: '#4e0c1e', fontSize: 13 }}> {item.numeroProcesso} </Typography.Text>
                            <Tag color={statusColor} style={{ fontSize: 10, margin: 0, padding: '0px 6px', lineHeight: '18px' }}> {statusText} </Tag>
                          </div>

                          <Row gutter={[6, 4]}>
              
                            <Col span={24}>
                              <Typography.Text type="secondary" style={{ fontSize: 10 }}>Cliente</Typography.Text>
                              <div style={{ fontSize: 11 }}>{item.clienteNome || '-'}</div>
                            </Col>
                          
                          </Row>

                          <Row gutter={[6, 4]}>
                            
                            <Col span={12}>
                              
                              <Typography.Text type="secondary" style={{ fontSize: 10 }}>Data do Prazo</Typography.Text>
                              
                              <div style={{ fontSize: 11, fontWeight: 500 }}>
                                {item.dataPrazo ? dayjs(item.dataPrazo).format('DD/MM/YYYY') : '-'}
                              </div>
                            
                            </Col>
                          
                          </Row>
                        
                        </Card>
                      );
                    })}
                    
                    {prazosFiltrados.length > 0 && (
                    
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '12px', padding: '4px' }}>
                        <Button size="small" onClick={() => {}} disabled={true} style={{ height: '28px', fontSize: '12px' }}> Anterior </Button>
                        <span style={{ fontSize: 12 }}>1 / 1</span>
                        <Button size="small" onClick={() => {}} disabled={true} style={{ height: '28px', fontSize: '12px' }}> Próxima </Button>
                      </div>
                    
                    )}
                    
                  </>
                )}
              </div>
            )}
          
          </div>
        
        ), },
        
        { key: 'calendario', label: 'Calendário', children: (

          <div>
            
            {!isMobile && (
              <Table dataSource={calendarioData} columns={colunasCalendario} rowKey="dataOriginal" size={isMobile ? 'middle' : 'small'} pagination={{ pageSize: isMobile ? 5 : 10 }} scroll={{ x: isMobile ? 500 : undefined }} />
            )}
            
            {isMobile && (
            
              <div>
                
                {calendarioData.length === 0 ? (
                
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    Nenhum prazo no calendário
                  </div>
                  
                ) : (
                  
                  calendarioData.map((item) => (
                  
                    <Card key={item.dataOriginal} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Typography.Text strong style={{ color: '#4e0c1e', fontSize: 13 }}> {item.data} </Typography.Text>
                        <Badge count={item.quantidade} style={{ backgroundColor: '#4e0c1e' }} />
                      </div>
                      
                      <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 10 }}>Processos</Typography.Text>
                      
                      <Space wrap size="small" style={{ marginTop: 4 }}>
                        
                        {item.processos.map((p, idx) => (
                          <Button key={idx} type="link" size="small" style={{ color: '#4e0c1e', padding: 0, fontSize: 11 }}> {p.numeroProcesso} </Button>
                        ))}

                      </Space>
                      
                    </Card>
                  
                  ))
                
                )}
              
              </div>
            )}

          </div>  
        ), },
      ]} />
    </Card>

  </div>
  );
}

export default ProcessosPrazos;
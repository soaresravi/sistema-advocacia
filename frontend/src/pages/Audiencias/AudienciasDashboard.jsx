import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Table, Select, message, Badge, Space } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { getAudienciasDashboard, getAudienciasHoje, getAudienciasProximos } from '../../services/audienciaService';
import GraficoLinha from '../../components/Graficos/GraficoLinha';

function AudienciasDashboard() {

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [audienciasHoje, setAudienciasHoje] = useState([]);
  const [audienciasProximos, setAudienciasProximos] = useState([]);
  const [ano, setAno] = useState(new Date().getFullYear());

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {

    setLoading(true);

    try {

      const [dashboard, hoje, proximos] = await Promise.all([
        getAudienciasDashboard(),
        getAudienciasHoje(),
        getAudienciasProximos(),
      ]);

      setData(dashboard);
      setAudienciasHoje(hoje);
      setAudienciasProximos(proximos);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      message.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }

  };

  const horariosColumns = [
    { title: 'Horário', dataIndex: 'horario', key: 'horario' },
    { title: 'Quantidade', dataIndex: 'quantidade', key: 'quantidade', render: (text) => <strong>{text}</strong> },
  ];

  const horariosData = data?.horarios ? Object.entries(data.horarios).map(([horario, quantidade]) => ({ horario, quantidade, })) : [];

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
  }

  return (
  
  <div style={{ padding: 16 }}>
    
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      
      <Col xs={12} sm={12} md={6}>
        
        <Card size="small">
          <Statistic title="Total de audiências" value={data?.total || 0} prefix={<CalendarOutlined />} styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
        </Card>
      
      </Col>
      
      <Col xs={12} sm={12} md={6}>
        
        <Card size="small">
          <Statistic title="Agendadas" value={data?.agendadas || 0} prefix={<ClockCircleOutlined />} styles={{ content: { color: '#1890ff', fontSize: 20 } }} />
        </Card>
      
      </Col>
      
      <Col xs={12} sm={12} md={6}>
        
        <Card size="small">
          <Statistic title="Concluídas" value={data?.concluidas || 0} prefix={<CheckCircleOutlined />} styles={{ content: { color: '#52c41a', fontSize: 20 } }} />
        </Card>
      
      </Col>
      
      <Col xs={12} sm={12} md={6}>
        
        <Card size="small">
          <Statistic title="Canceladas" value={data?.canceladas || 0} prefix={<CloseCircleOutlined />} styles={{ content: { color: '#ff4d4f', fontSize: 20 } }} />
        </Card>
      
      </Col>
    
    </Row>
  
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      
      <Col xs={24} md={12}>
        
        <Card size="small" title={
          
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            <span>Audiências para hoje</span>
          </Space>
        
        }>
          
          {audienciasHoje.length === 0 ? (
            
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              Nenhuma audiência agendada para hoje
            </div>
          
          ) : (
            
            audienciasHoje.map((item) => (
              
              <div key={item.id} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                
                <div style={{ fontWeight: 500, color: '#4e0c1e' }}>{item.processoNumero}</div>
              
                <div style={{ fontSize: 12, color: '#666' }}>
                  {item.hora} - {item.detalhes} {item.local && `- ${item.local}`}
                </div>
              
              </div>

            ))

          )}
        
        </Card>
      </Col>
      
      <Col xs={24} md={12}>
        
        <Card size="small" title={
        
          <Space>
            <ClockCircleOutlined style={{ color: '#8b1a4a' }} />
            <span>Próximos 7 dias</span>
          </Space>
        
        }>
          
          {audienciasProximos.length === 0 ? (
            
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              Nenhuma audiência nos próximos 7 dias
            </div>
          
          ) : (
            
            audienciasProximos.map((item) => (
              
              <div key={item.id} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                
                <div style={{ fontWeight: 500, color: '#4e0c1e' }}>{item.processoNumero}</div>
                
                <div style={{ fontSize: 12, color: '#666' }}>
                  {item.data} - {item.hora} - {item.detalhes}
                  {item.diasRestantes === 0 && <Badge status="warning" text="Hoje" style={{ marginLeft: 8 }} />}
                  {item.diasRestantes === 1 && <Badge status="processing" text="Amanhã" style={{ marginLeft: 8 }} />}
                </div>
              
              </div>
            
            ))
          
          )}
        
        </Card>
      </Col>
    </Row>

    <Row gutter={[12, 12]}>
      
      <Col xs={24} md={14}>
        
        <Card size="small">
          
          <GraficoLinha data={data?.porMes} title="Audiências por mês" ano={ano} />
          
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Select value={ano} onChange={setAno} size="small" style={{ width: 100 }} options={[2023, 2024, 2025, 2026].map(y => ({ value: y, label: y }))} />
          </div>
        
        </Card>
      
      </Col>
      
      <Col xs={24} md={10}>
        
        <Card size="small" title="Distribuição por horário">
          <Table dataSource={horariosData} columns={horariosColumns} rowKey="horario" size="small" pagination={false} locale={{ emptyText: 'Nenhum dado' }} />
        </Card>
      
      </Col>
    
    </Row>
    
  </div>
  );
}

export default AudienciasDashboard;
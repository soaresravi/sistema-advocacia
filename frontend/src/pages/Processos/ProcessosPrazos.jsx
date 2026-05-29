import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Table, Tabs, Badge, Button, Space, DatePicker, notification } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, WarningOutlined, FileTextOutlined } from '@ant-design/icons';
import { getPrazosHoje, getPrazosProximos, getCalendarioPrazos } from '../../services/processoService';

import dayjs from 'dayjs';
import '../../components/Layout/AppLayout';

dayjs.locale('pt-br');

function ProcessosPrazos() {

  const [loading, setLoading] = useState(false);
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
        
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Nº Processo', dataIndex: 'numeroProcesso', width: 200 },
    { title: 'Cliente', dataIndex: 'clienteNome', width: 200 },
    { title: 'Data do Prazo', dataIndex: 'dataPrazo', width: 120, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        
    { title: 'Status', key: 'status', width: 120, render: (_, record) => {
            
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
        
    { title: 'Data', dataIndex: 'data', width: 120, sorter: (a, b) => dayjs(a.dataOriginal).unix() - dayjs(b.dataOriginal).unix() },
    { title: 'Quantidade', dataIndex: 'quantidade', width: 100, render: (text) => <Badge count={text} style={{ backgroundColor: '#4e0c1e' }} /> },
        
    { title: 'Processos', dataIndex: 'processos', render: (processos) => (
        
      <Space wrap> {processos.map((p, idx) => (  
        <Button key={idx} type="link" size="small" style={{ color: '#4e0c1e', padding: 0 }}> {p.numeroProcesso} </Button>
      ))} </Space>

    ), },

  ];

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
  }
    
  return (
  
  <div style={{ padding: 16 }}>
    
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      
      <Col xs={24} sm={12} md={8}>
        
        <Card size="small">
          
          <Statistic title="Prazos para hoje" value={prazosHoje.length} prefix={<WarningOutlined style={{ color: '#faad14' }} />} styles={{ content: { color: '#4e0c1e', fontSize: 24 } }} />
          
          {prazosHoje.length > 0 && (
            
            <div style={{ marginTop: 12 }}>
              
              {prazosHoje.map((item) => (
                
                <div key={item.id} style={{ marginBottom: 8, fontSize: 12 }}>
                  <div style={{ fontWeight: 500, color: '#4e0c1e' }}>{item.numeroProcesso}</div>
                  <div style={{ color: '#888' }}>{item.clienteNome}</div>
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
            
            {prazosProximos.length === 0 ? (
              
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
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
        
        ), },
        
        { key: 'calendario', label: 'Calendário', children: (
          <Table dataSource={calendarioData} columns={colunasCalendario} rowKey="dataOriginal" size="small" pagination={{ pageSize: 10 }} />
        ), },

      ]} />
      
    </Card>

  </div>
  );
}

export default ProcessosPrazos;
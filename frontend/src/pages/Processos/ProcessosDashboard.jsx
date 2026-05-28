import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Tabs } from 'antd';
import { FolderOutlined, CheckCircleOutlined, CloseCircleOutlined, DollarOutlined, WalletOutlined, TrophyOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons';
import { getProcessosDashboard } from '../../services/processoService';
import GraficoBarraVertical from '../../components/Graficos/GraficoBarraVertical';
import GraficoRosca from '../../components/Graficos/GraficoRosca';

function ProcessosDashboard() {

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('geral');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {

    setLoading(true);

    try {
      const response = await getProcessosDashboard();
      setData(response);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }

  };

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
  }

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const tabItems = [
        
    { key: 'geral', label: 'PF x PJ', children: (
            
      <Row gutter={[12, 12]}>
                
        <Col xs={24} md={12}>

          <Card size="small">
            <GraficoRosca data={data?.tipoCliente} title="Processos por tipo de cliente" />
          </Card>

        </Col>
                
        <Col xs={24} md={12}>
                    
          <Card size="small">
            <GraficoBarraVertical data={data?.resultados} title="Processos por resultado" />
          </Card>

        </Col>

      </Row>

    )}

  ];

  return (
    
  <div style={{ padding: 16 }}>
    
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      
      <Col xs={12} sm={12} md={6} lg={4}>
        
        <Card size="small">
          <Statistic title="Total de processos" value={data?.totalProcessos || 0} prefix={<FolderOutlined />} styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
        </Card>
    
      </Col>
      
      <Col xs={12} sm={12} md={6} lg={4}>
        
        <Card size="small">
          <Statistic title="Processos ativos" value={data?.processosAtivos || 0} prefix={<CheckCircleOutlined />} styles={{ content: { color: '#52c41a', fontSize: 20 } }} />
        </Card>
    
      </Col>
        
      <Col xs={12} sm={12} md={6} lg={4}>
        
        <Card size="small">
          <Statistic title="Processos encerrados" value={data?.processosEncerrados || 0} prefix={<CloseCircleOutlined />} styles={{ content: { color: '#ff4d4f', fontSize: 20 } }} />
        </Card>
      
      </Col>
      
      <Col xs={12} sm={12} md={6} lg={4}>
        
        <Card size="small">
          <Statistic title="Duração média" value={data?.duracaoMediaDias || 0} suffix="dias" styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
        </Card>
      
      </Col>
      
      <Col xs={12} sm={12} md={6} lg={4}>
        
        <Card size="small">
          <Statistic title="Causas em aberto" value={formatCurrency(data?.valorCausasEmAberto)} styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
        </Card>
    
      </Col>
      
      <Col xs={12} sm={12} md={6} lg={4}>
        
        <Card size="small">
          <Statistic title="Total de honorários" value={formatCurrency(data?.totalHonorarios)} styles={{ content: { color: '#8b1a4a', fontSize: 20 } }} />
        </Card>
    
      </Col>

    </Row>

    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      
      <Col xs={12} sm={12} md={6} lg={6}>
          
        <Card size="small">
          <Statistic title="Maior valor de causa" value={formatCurrency(data?.maiorValorCausa)} prefix={<TrophyOutlined />} styles={{ content: { color: '#faad14', fontSize: 20 } }} />
        </Card>
    
      </Col>
      
      <Col xs={12} sm={12} md={6} lg={6}>
        
        <Card size="small">
          <Statistic title="Maior honorário" value={formatCurrency(data?.maiorHonorario)} prefix={<WalletOutlined />} styles={{ content: { color: '#c42560', fontSize: 20 } }} />
        </Card>
    
      </Col>

    </Row>

    <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" size="small" className="custom-tabs" items={tabItems} />
  
  </div>  
  );
}

export default ProcessosDashboard;
import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Spin, Select, Tabs } from 'antd';
import { DollarOutlined, WalletOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { getFinanceiroDashboard } from '../../services/financeiroService';
import GraficoLinha from '../../components/Graficos/GraficoLinha';

function FinanceiroDashboard() {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [ano, setAno] = useState(new Date().getFullYear());

    const [recebimentosTotal, setRecebimentosTotal] = useState({});
    const [recebidos, setRecebidos] = useState({});
    const [naoRecebidos, setNaoRecebidos] = useState({});
    const [despesasTotal, setDespesasTotal] = useState({});
    const [pagas, setPagas] = useState({});
    const [naoPagas, setNaoPagas] = useState({});
    const [resultadoPorMes, setResultadoPorMes] = useState({});

    useEffect(() => {
        carregarDados();
    }, [ano]);

    useEffect(() => {

        if (data) {
            
            const recebTotal = {};
            const receb = {};
            const naoReceb = {};
            const despTotal = {};
            const pag = {};
            const naoPag = {};
            const resultado = {};

            for (let mes = 1; mes <= 12; mes++) {
                
                const recebimentoItem = data?.recebimentosPorMes?.[mes];
                const despesaItem = data?.despesasPorMes?.[mes];
                
                if (recebimentoItem) {
                    recebTotal[mes] = recebimentoItem.total || 0;
                    receb[mes] = recebimentoItem.recebido || 0;
                    naoReceb[mes] = recebimentoItem.naoRecebido || 0;
                } else {
                    recebTotal[mes] = 0;
                    receb[mes] = 0;
                    naoReceb[mes] = 0;
                }
                
                if (despesaItem) {
                    despTotal[mes] = despesaItem.total || 0;
                    pag[mes] = despesaItem.pago || 0;
                    naoPag[mes] = despesaItem.naoPago || 0;
                } else {
                    despTotal[mes] = 0;
                    pag[mes] = 0;
                    naoPag[mes] = 0;
                }
                
                resultado[mes] = (recebTotal[mes] || 0) - (despTotal[mes] || 0);

            }
            
            setRecebimentosTotal(recebTotal);
            setRecebidos(receb);
            setNaoRecebidos(naoReceb);
            setDespesasTotal(despTotal);
            setPagas(pag);
            setNaoPagas(naoPag);
            setResultadoPorMes(resultado);

        }

    }, [data]);

    const carregarDados = async () => {

        setLoading(true);

        try {
            const response = await getFinanceiroDashboard(ano);
            setData(response);
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

    if (loading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }

    return (
    
    <div style={{ padding: 16 }}>
        
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            
            <Col xs={12} sm={12} md={6}>
            
                <Card size="small">
                    <Statistic title="Total de recebimentos" value={formatCurrency(data?.totalRecebimentos)} prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />} styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
                </Card>

            </Col>

            <Col xs={12} sm={12} md={6}>
                
                <Card size="small">
                    <Statistic title="Total de despesas" value={formatCurrency(data?.totalDespesas)} prefix={<ArrowDownOutlined style={{ color: '#ff4d4f' }} />} styles={{ content: { color: '#4e0c1e', fontSize: 20 } }} />
                </Card>

            </Col>

            <Col xs={12} sm={12} md={6}>
                
                <Card size="small">
                    <Statistic title="Resultado" value={formatCurrency(data?.resultado)} prefix={<DollarOutlined />} styles={{ content: { color: data?.resultado >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 20 } }} />
                </Card>

            </Col>

            <Col xs={12} sm={12} md={6}>
                
                <Card size="small">
                    <Statistic title="Recebimentos em atraso" value={formatCurrency(data?.totalRecebimentosAtraso)} prefix={<WalletOutlined />} styles={{ content: { color: '#faad14', fontSize: 20 } }} />
                </Card>

            </Col>

        </Row>

        <Card size="small">
            
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Select value={ano} onChange={setAno} size="small" style={{ width: 100 }} options={[2023, 2024, 2025, 2026].map(y => ({ value: y, label: y }))} />
            </div>

            <Tabs defaultActiveKey="resultado" type="card" size="small" className="custom-tabs" items={[
                
                { key: 'resultado', label: 'Resultado geral', children: (
                    <GraficoLinha data={resultadoPorMes} title="Resultado por mês (receitas - despesas)" ano={ano} cor="#4e0c1e" />
                ),},
                
                { key: 'recebimentos', label: 'Recebimentos', children: (
                
                    <>
                        <GraficoLinha data={recebimentosTotal} title="Recebimentos por mês" ano={ano} />
                        <GraficoLinha data={recebidos} title="Recebidos" ano={ano} cor="#52c41a" />
                        <GraficoLinha data={naoRecebidos} title="Não recebidos" ano={ano} cor="#ff4d4f" />
                    </>
                
                ),},
                
                { key: 'despesas', label: 'Despesas', children: (
                    
                    <>
                        <GraficoLinha data={despesasTotal} title="Despesas por mês" ano={ano} />
                        <GraficoLinha data={pagas} title="Pagas" ano={ano} cor="#52c41a" />
                        <GraficoLinha data={naoPagas} title="Não pagas" ano={ano} cor="#ff4d4f" />
                    </>
                
                ),},

            ]} />

        </Card>
    
    </div>
    );
}

export default FinanceiroDashboard;
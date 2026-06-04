import { useState, useEffect } from "react";
import { Table, Input, Button, Space, Modal, Form, Select, Row, Col, Card, DatePicker, notification } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';
import { getDespesas, createDespesa, updateDespesa, deleteDespesa, getDespesasAtrasados } from '../../services/financeiroService';
import { CATEGORIA_DESPESA_OPTIONS, SIM_NAO_OPTIONS } from '../../constants/enums';

import dayjs from 'dayjs';

const { TextArea } = Input;

function DespesaLista() {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState(null);
    const [filtroPago, setFiltroPago] = useState(null);
    const [filtroDataInicio, setFiltroDataInicio] = useState(null);
    const [filtroDataFim, setFiltroDataFim] = useState(null);
    const [atrasados, setAtrasados] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [form] = Form.useForm();

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
        carregarAtrasados();
    }, []);

    useEffect(() => {
        carregarDados();
    }, [pagination.current, pagination.pageSize, searchText, filtroCategoria, filtroPago, filtroDataInicio, filtroDataFim]);

    const carregarAtrasados = async () => {

        try {
            const response = await getDespesasAtrasados();
            setAtrasados(response);
        } catch (error) {
            console.error('Erro ao carregar atrasados:', error);
        }

    };

    const carregarDados = async () => {

        setLoading(true);

        try {

            const response = await getDespesas(pagination.current - 1, pagination.pageSize, {
                search: searchText || undefined,
                categoria: filtroCategoria,
                pago: filtroPago,
                dataInicio: filtroDataInicio ? filtroDataInicio.format('YYYY-MM-DD') : undefined,
                dataFim: filtroDataFim ? filtroDataFim.format('YYYY-MM-DD') : undefined,
            });

            setData(response.content || []);
            
            setPagination({
                ...pagination,
                total: response.total,
                current: response.page + 1,
            });

        } catch (error) {
            showNotification('error', 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }

    };

    const handleViewDetails = (record) => {

        setEditingItem(record);
        setIsEditMode(false);
        setModalVisible(true);

        setTimeout(() => {
            
            let pagoValue = record.pago === true ? 'SIM' : record.pago === false ? 'NAO' : record.pago;
            let categoriaValue = record.categoria?.descricao || record.categoria;

            const categoriaEncontrada = CATEGORIA_DESPESA_OPTIONS.find(c => c.label === categoriaValue);

            form.setFieldsValue({
                ...record,
                dataPrevistaPagamento: record.dataPrevistaPagamento ? dayjs(record.dataPrevistaPagamento) : null,
                dataEfetivaPagamento: record.dataEfetivaPagamento ? dayjs(record.dataEfetivaPagamento) : null,
                pago: pagoValue,
                categoria: categoriaEncontrada?.value || categoriaValue,
            });

        }, 10);

    };

    const handleEnableEdit = () => setIsEditMode(true);

    const handleAdd = () => {
        setEditingItem(null);
        setIsEditMode(true);
        form.resetFields();
        setModalVisible(true);
    };

    const handleDelete = async () => {

        if (!editingItem) return;
        
        try {
            await deleteDespesa(editingItem.id);
            showNotification('success', 'Despesa excluída com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
            carregarAtrasados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir despesa');
        }

    };

    const handleModalOk = async () => {

        try {

            const values = await form.validateFields();
            setModalLoading(true);

            const simNaoMap = { 'SIM': true, 'NAO': false };
            
            const categoriaMap = {
                'AGUA': 'Água',
                'ALIMENTACAO': 'Alimentação',
                'ALUGUEL': 'Aluguel',
                'CELULAR': 'Celular',
                'COMPRAS': 'Compras',
                'GAS': 'Gás',
                'INTERNET': 'Internet',
                'INVESTIMENTO': 'Investimento',
                'LIMPEZA': 'Limpeza',
                'LUZ': 'Luz',
                'MANUTENCAO': 'Manutenção',
                'MATERIAIS': 'Materiais',
                'MERCADO': 'Mercado',
                'OUTRAS': 'Outras',
                'OUTRAS_DESPESAS_FUNCIONARIO': 'Outras Despesas com Funcionário',
                'PUBLICIDADE': 'Publicidade',
                'SALARIO_FUNCIONARIO': 'Salário de Funcionário',
                'TRANSPORTE': 'Transporte'
            };

            const dataToSend = {
                ...values,
                pago: simNaoMap[values.pago] !== undefined ? simNaoMap[values.pago] : values.pago,
                categoria: categoriaMap[values.categoria] || values.categoria,
                dataPrevistaPagamento: values.dataPrevistaPagamento ? values.dataPrevistaPagamento.format('YYYY-MM-DD') : null,
                dataEfetivaPagamento: values.dataEfetivaPagamento ? values.dataEfetivaPagamento.format('YYYY-MM-DD') : null,
            };

            if (editingItem) {
                await updateDespesa(editingItem.id, dataToSend);
                showNotification('success', 'Despesa atualizada com sucesso!');
            } else {
                await createDespesa(dataToSend);
                showNotification('success', 'Despesa criada com sucesso!');
            }
            
            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();
            carregarAtrasados();

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar despesa');
        } finally {
            setModalLoading(false);
        }

    };

    const handleCancelModal = () => {

        if (isEditMode && editingItem) {
            
            Modal.confirm({ title: 'Tem certeza?', content: 'As informações não salvas serão perdidas.', okText: 'Sim, fechar', cancelText: 'Não, continuar editando', okButtonProps: { style: { background: '#4e0c1e' } }, centered: true,
            
            onOk: () => {
                setModalVisible(false);
                setIsEditMode(false);
                setEditingItem(null);
                form.resetFields();
            }, });

        } else {
            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            form.resetFields();
        }

    };

    const columns = [
        
        { title: 'ID', dataIndex: 'id', width: 70 },
        
        { title: 'Data prevista', dataIndex: 'dataPrevistaPagamento', width: 110, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-', sorter: (a, b) => {
            const dateA = a.dataPrevistaPagamento ? new Date(a.dataPrevistaPagamento) : new Date(0);
            const dateB = b.dataPrevistaPagamento ? new Date(b.dataPrevistaPagamento) : new Date(0);
            return dateB - dateA;
        }, defaultSortOrder: 'descend', },
        
        { title: 'Data do pagamento', dataIndex: 'dataEfetivaPagamento', width: 110, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Valor', dataIndex: 'valor', width: 100, render: (value) => value ? `R$ ${value.toLocaleString('pt-BR')}` : '-' },
        { title: 'Categoria', dataIndex: 'categoria', width: 120, render: (text) => text?.descricao || text },
        { title: 'Despesa', dataIndex: 'despesa', width: 150, ellipsis: true },
        { title: 'Pago?', dataIndex: 'pago', width: 90, render: (value) => value ? 'Sim' : 'Não' },
        
        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#8b1a4a' }} />
        ) },

    ];

    const totalDespesas = data.reduce((sum, item) => sum + (item.valor || 0), 0);

    return (
    
    <div style={{ padding: 16 }}>
        
        {atrasados.length > 0 && (
        
            <Card size="small" style={{ marginBottom: 16, borderColor: '#faad14' }}>
            
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ color: '#faad14' }}>Despesas atrasadas:</strong>
                    <span>{atrasados.length} pendente(s)</span>
                </div>
                
                {atrasados.slice(0, 3).map((item) => (
                
                    <div key={item.id} style={{ fontSize: 12, marginTop: 4 }}>
                        R$ {item.valor?.toLocaleString('pt-BR')} - {item.categoria} - {item.despesa} (Atraso: {item.diasAtraso} dias)
                    </div>

                ))}

                
                {atrasados.length > 3 && <div style={{ fontSize: 12, marginTop: 4 }}>+{atrasados.length - 3} outros</div>}
            
            </Card>
        
        )}

        <Card size="small">
            
            <Row gutter={[12, 12]} justify="space-between" align="middle">
            
                <Col xs={24} md={16}>
            
                    <Space wrap>
                        
                        <Input placeholder="Buscar por despesa ou detalhes" value={searchText} onChange={(e) => setSearchText(e.target.value)} onPressEnter={() => setPagination({ ...pagination, current: 1 })} style={{ width: 200 }} prefix={<SearchOutlined />} />
                        <Select placeholder="Categoria" allowClear style={{ width: 140 }} value={filtroCategoria} onChange={setFiltroCategoria} options={CATEGORIA_DESPESA_OPTIONS} />
                        <Select placeholder="Pago?" allowClear style={{ width: 100 }} value={filtroPago} onChange={setFiltroPago} options={SIM_NAO_OPTIONS} />
                        <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={setFiltroDataInicio} size="small" />
                        <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={setFiltroDataFim} size="small" />
                       
                        <Button onClick={() => {
                            setSearchText('');
                            setFiltroCategoria(null);
                            setFiltroPago(null);
                            setFiltroDataInicio(null);
                            setFiltroDataFim(null);
                            setPagination({ ...pagination, current: 1 });
                        }} icon={<ReloadOutlined />}>Limpar</Button>

                    </Space>

                </Col>

                <Col>
                    <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#4e0c1e' }}>Nova Despesa</Button>
                </Col>

            </Row>

            <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} onChange={(pagination) => setPagination({ ...pagination, current: pagination.current })} scroll={{ x: 900 }} size="small" style={{ marginTop: 16 }} />
            
            <div style={{ marginTop: 16, textAlign: 'right', fontWeight: 'bold' }}>
                Total: {pagination.total} despesa(s) | Valor total: R$ {totalDespesas.toLocaleString('pt-BR')}
            </div>

        </Card>

        <Modal title={!editingItem ? 'Nova despesa' : (isEditMode ? 'Editar despesa' : 'Visualizar despesa')} open={modalVisible} onCancel={handleCancelModal} footer={
            
            !editingItem ? [
                <Button key="cancel" onClick={handleCancelModal}>Cancelar</Button>,
                <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}>Salvar</Button>,
            ] : isEditMode ? [
                
                <Button key="cancel" onClick={() => {
            
                    setIsEditMode(false);
        
                    if (editingItem) {
    
                        form.setFieldsValue({
                            ...editingItem,
                            dataPrevistaPagamento: editingItem.dataPrevistaPagamento ? dayjs(editingItem.dataPrevistaPagamento) : null,
                            dataEfetivaPagamento: editingItem.dataEfetivaPagamento ? dayjs(editingItem.dataEfetivaPagamento) : null,
                        });
                    
                    }
                
                }}>Cancelar</Button>,
                
                <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}>Salvar</Button>,
            
            ] : [
                
                <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: '#4e0c1e' }}><EditOutlined /> Editar Informações</Button>,
                
                <Button key="delete" danger onClick={() => {
                    Modal.confirm({ title: 'Excluir despesa', content: 'Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: '#4e0c1e' }, danger: true }, centered: true, onOk: handleDelete, });
                }}><DeleteOutlined /> Excluir</Button>,
            
            ]

        } width={600} mask={{ closable: false }} style={{ top: 50 }}>
            
            <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
            
                <Row gutter={16}>
            
                    <Col span={12}>
            
                        <Form.Item name="dataPrevistaPagamento" label="Data prevista">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                        </Form.Item>
            
                    </Col>
                    
                    <Col span={12}>
                    
                        <Form.Item name="dataEfetivaPagamento" label="Data do pagamento">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                        </Form.Item>
                    
                    </Col>

                </Row>

                <Row gutter={16}>
                    
                    <Col span={12}>
                    
                        <Form.Item name="valor" label="Valor" rules={[{ required: true }]}>
                            <Input type="number" size="small" step="0.01" />
                        </Form.Item>
                    
                    </Col>
                    
                    <Col span={12}>
                    
                        <Form.Item name="categoria" label="Categoria" rules={[{ required: true }]}>
                            <Select placeholder="Selecione" allowClear showSearch={{ optionFilterProp: "label" }} size="small" options={CATEGORIA_DESPESA_OPTIONS} />
                        </Form.Item>
                    
                    </Col>

                </Row>

                <Row gutter={16}>
                    
                    <Col span={12}>
                    
                        <Form.Item name="pago" label="Pago?">
                            <Select size="small" options={SIM_NAO_OPTIONS} />
                        </Form.Item>
                    
                    </Col>
                    
                    <Col span={12}>
                    
                        <Form.Item name="despesa" label="Despesa">
                            <Input size="small" />
                        </Form.Item>
                    
                    </Col>

                </Row>

                <Form.Item name="detalhes" label="Detalhes">
                    <TextArea rows={3} size="small" />
                </Form.Item>
                
            </Form>
        </Modal>

    </div>
    );
}

export default DespesaLista;
import { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Modal, Form, Select, Row, Col, Card, DatePicker, notification } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';
import { getRecebimentos, createRecebimento, updateRecebimento, deleteRecebimento, getRecebimentosAtrasados } from '../../services/financeiroService';
import { getClientesOptions } from '../../services/processoService';
import { getProcessosOptions } from '../../services/audienciaService';
import { TIPO_RECEBIMENTO_OPTIONS, SIM_NAO_OPTIONS } from '../../constants/enums';

import dayjs from 'dayjs';

const { TextArea } = Input;

function RecebimentoLista() {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [filtroTipo, setFiltroTipo] = useState(null);
    const [filtroTipoCliente, setFiltroTipoCliente] = useState(null);
    const [filtroRecebido, setFiltroRecebido] = useState(null);
    const [filtroDataInicio, setFiltroDataInicio] = useState(null);
    const [filtroDataFim, setFiltroDataFim] = useState(null);
    const [atrasados, setAtrasados] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [clientesOptions, setClientesOptions] = useState({ pf: [], pj: [] });
    const [processosOptions, setProcessosOptions] = useState([]);

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
        carregarOpcoes();
        carregarAtrasados();
    }, []);

    useEffect(() => {
        carregarDados();
    }, [pagination.current, pagination.pageSize, searchText, filtroTipo, filtroTipoCliente, filtroRecebido, filtroDataInicio, filtroDataFim]);

    const carregarOpcoes = async () => {

        try {

            const [clientes, processos] = await Promise.all([
                getClientesOptions(),
                getProcessosOptions(),
            ]);

            setClientesOptions(clientes);
            setProcessosOptions(processos);

        } catch (error) {
            console.error('Erro ao carregar opções:', error);
        }

    };

    const carregarAtrasados = async () => {
        
        try {
            const response = await getRecebimentosAtrasados();
            setAtrasados(response);
        } catch (error) {
            console.error('Erro ao carregar atrasados:', error);
        }

    };

    const carregarDados = async () => {

        setLoading(true);

        try {

            const response = await getRecebimentos(pagination.current - 1, pagination.pageSize, {
                search: searchText || undefined,
                tipo: filtroTipo,
                tipoCliente: filtroTipoCliente,
                recebido: filtroRecebido,
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

            let recebidoValue = record.recebido === true ? 'SIM' : record.recebido === false ? 'NAO' : record.recebido;
            let tipoValue = record.tipo?.descricao || record.tipo;
            const tipoEncontrado = TIPO_RECEBIMENTO_OPTIONS.find(t => t.label === tipoValue);

            form.setFieldsValue({
                ...record,
                dataPrevistaRecebimento: record.dataPrevistaRecebimento ? dayjs(record.dataPrevistaRecebimento) : null,
                dataRecebimento: record.dataRecebimento ? dayjs(record.dataRecebimento) : null,
                recebido: recebidoValue,
                tipo: tipoEncontrado?.value || tipoValue,
                clienteNome: record.clienteNome,
                processoNumero: record.processoNumero,
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
            await deleteRecebimento(editingItem.id);
            showNotification('success', 'Recebimento excluído com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
            carregarAtrasados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir recebimento');
        }

    };

    const handleModalOk = async () => {

        try {

            const values = await form.validateFields();
            setModalLoading(true);

            const simNaoMap = { 'SIM': true, 'NAO': false };
            
            const tipoMap = {
                'COMISSAO': 'Comissão',
                'CONSULTA': 'Consulta',
                'ENTRADA': 'Entrada',
                'HONORARIOS': 'Honorários',
                'MENSALIDADE': 'Mensalidade',
                'MULTA': 'Multa',
                'OUTROS': 'Outros'
            };

            const dataToSend = {
                ...values,
                recebido: simNaoMap[values.recebido] !== undefined ? simNaoMap[values.recebido] : values.recebido,
                tipo: tipoMap[values.tipo] || values.tipo,
                dataPrevistaRecebimento: values.dataPrevistaRecebimento ? values.dataPrevistaRecebimento.format('YYYY-MM-DD') : null,
                dataRecebimento: values.dataRecebimento ? values.dataRecebimento.format('YYYY-MM-DD') : null,
            };

            if (editingItem) {
                await updateRecebimento(editingItem.id, dataToSend);
                showNotification('success', 'Recebimento atualizado com sucesso!');
            } else {
                await createRecebimento(dataToSend);
                showNotification('success', 'Recebimento criado com sucesso!');
            }
            
            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();
            carregarAtrasados();

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar recebimento');
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
        
        { title: 'Data prevista', dataIndex: 'dataPrevistaRecebimento', width: 110, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' , sorter: (a, b) => {
            const dateA = a.dataPrevistaRecebimento ? new Date(a.dataPrevistaRecebimento) : new Date(0);
            const dateB = b.dataPrevistaRecebimento ? new Date(b.dataPrevistaRecebimento) : new Date(0);
            return dateB - dateA;
        }, defaultSortOrder: 'descend', },

        { title: 'Data do recebimento', dataIndex: 'dataRecebimento', width: 110, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Valor', dataIndex: 'valor', width: 100, render: (value) => value ? `R$ ${value.toLocaleString('pt-BR')}` : '-' },
        { title: 'Tipo', dataIndex: 'tipo', width: 100, render: (text) => text?.descricao || text },
        { title: 'Cliente', dataIndex: 'clienteNome', width: 150, ellipsis: true },
        { title: 'Processo', dataIndex: 'processoNumero', width: 150, ellipsis: true },
        { title: 'Recebido?', dataIndex: 'recebido', width: 90, render: (value) => value ? 'Sim' : 'Não' },
        
        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#8b1a4a' }} />
        ) },

    ];

    const totalRecebimentos = data.reduce((sum, item) => sum + (item.valor || 0), 0);

    return (
    
    <div style={{ padding: 16 }}>
        
        {atrasados.length > 0 && (
            
            <Card size="small" style={{ marginBottom: 16, borderColor: '#faad14' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ color: '#faad14' }}>Recebimentos atrasados:</strong>
                    <span>{atrasados.length} pendente(s)</span>
                </div>
            
                {atrasados.slice(0, 3).map((item) => (
                    
                    <div key={item.id} style={{ fontSize: 12, marginTop: 4 }}>
                        R$ {item.valor?.toLocaleString('pt-BR')} - {item.clienteNome} - {item.tipo} (Atraso: {item.diasAtraso} dias)
                    </div>
                
                ))}
                
                {atrasados.length > 3 && <div style={{ fontSize: 12, marginTop: 4 }}>+{atrasados.length - 3} outros</div>}
            
            </Card>
        
        )}

        <Card size="small">
            
            <Row gutter={[12, 12]} justify="space-between" align="middle">
                
                <Col xs={24} md={16}>
                    
                    <Space wrap>
                        
                        <Input placeholder="Buscar por cliente ou processo" value={searchText} onChange={(e) => setSearchText(e.target.value)} onPressEnter={() => setPagination({ ...pagination, current: 1 })} style={{ width: 200 }} prefix={<SearchOutlined />} />
                        <Select placeholder="Tipo" allowClear style={{ width: 120 }} value={filtroTipo} onChange={setFiltroTipo} options={TIPO_RECEBIMENTO_OPTIONS} />
                        <Select placeholder="Tipo de cliente" allowClear style={{ width: 120 }} value={filtroTipoCliente} onChange={setFiltroTipoCliente} options={[{ value: 'PF', label: 'PF' }, { value: 'PJ', label: 'PJ' }]} />
                        <Select placeholder="Recebido?" allowClear style={{ width: 100 }} value={filtroRecebido} onChange={setFiltroRecebido} options={SIM_NAO_OPTIONS} />
                        <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={setFiltroDataInicio} size="small" />
                        <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={setFiltroDataFim} size="small" />
                        
                        <Button onClick={() => {
                            setSearchText('');
                            setFiltroTipo(null);
                            setFiltroTipoCliente(null);
                            setFiltroRecebido(null);
                            setFiltroDataInicio(null);
                            setFiltroDataFim(null);
                            setPagination({ ...pagination, current: 1 });
                        }} icon={<ReloadOutlined />}>Limpar</Button>
                    
                    </Space>
                
                </Col>
                
                <Col>
                    <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#4e0c1e' }}>Novo recebimento</Button>
                </Col>
            
            </Row>

            <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} onChange={(pagination) => setPagination({ ...pagination, current: pagination.current })} scroll={{ x: 900 }} size="small" style={{ marginTop: 16 }} />
                
                <div style={{ marginTop: 16, textAlign: 'right', fontWeight: 'bold' }}>
                    Total: {pagination.total} recebimento(s) | Valor total: R$ {totalRecebimentos.toLocaleString('pt-BR')}
                </div>

        </Card>

        <Modal title={!editingItem ? 'Novo recebimento' : (isEditMode ? 'Editar recebimento' : 'Visualizar recebimento')} open={modalVisible} onCancel={handleCancelModal} footer={
                
            !editingItem ? [
                <Button key="cancel" onClick={handleCancelModal}>Cancelar</Button>,
                <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}>Salvar</Button>,
            ] : isEditMode ? [
                    
                <Button key="cancel" onClick={() => {
                        
                    setIsEditMode(false);
                        
                    if (editingItem) {
                    
                        form.setFieldsValue({
                            ...editingItem,
                            dataPrevistaRecebimento: editingItem.dataPrevistaRecebimento ? dayjs(editingItem.dataPrevistaRecebimento) : null,
                            dataRecebimento: editingItem.dataRecebimento ? dayjs(editingItem.dataRecebimento) : null,
                        });

                    }
                    
                }}>Cancelar</Button>,
                    
                <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}>Salvar</Button>,
                
            ] : [
                    
                <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: '#4e0c1e' }}><EditOutlined /> Editar Informações</Button>,
                
                <Button key="delete" danger onClick={() => {
                    Modal.confirm({ title: 'Excluir recebimento', content: 'Tem certeza que deseja excluir este recebimento? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: '#4e0c1e' }, danger: true }, centered: true, onOk: handleDelete, });
                }}><DeleteOutlined /> Excluir</Button>,
            ]
           
        } width={600} mask={{ closable: false }} style={{ top: 50 }}>

            <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
                    
                <Row gutter={16}>
                        
                    <Col span={12}>
                        
                        <Form.Item name="dataPrevistaRecebimento" label="Data prevista">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                        </Form.Item>

                    </Col>

                    <Col span={12}>
                            
                        <Form.Item name="dataRecebimento" label="Data do recebimento">
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
                            
                        <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
                            <Select size="small" options={TIPO_RECEBIMENTO_OPTIONS} />
                        </Form.Item>

                    </Col>

                </Row>

                <Row gutter={16}>
                        
                    <Col span={12}>
                            
                        <Form.Item name="recebido" label="Recebido?">
                            <Select size="small" options={SIM_NAO_OPTIONS} />
                        </Form.Item>

                    </Col>

                    <Col span={12}>
                        
                        <Form.Item name="parcela" label="Parcela">
                            <Input size="small" />
                        </Form.Item>

                    </Col>

                </Row>

                <Row gutter={16}>
                        
                    <Col span={12}>
                            
                        <Form.Item name="clienteNome" label="Cliente">
                                
                            <Select size="small" showSearch={{ optionFilterProp: "label", filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}} placeholder="Selecione o cliente" options={[
                                ...clientesOptions.pf.map(c => ({ value: c.nome, label: c.nome })),
                                ...clientesOptions.pj.map(c => ({ value: c.nome, label: c.nome }))
                            ]} />
                            
                        </Form.Item>
                        
                    </Col>
                        
                    <Col span={12}>
                            
                        <Form.Item name="tipoCliente" label="Tipo de cliente">
                            <Select size="small" options={[{ value: 'PF', label: 'PF' }, { value: 'PJ', label: 'PJ' }]} />
                        </Form.Item>

                    </Col>

                </Row>

                <Form.Item name="processoNumero" label="Processo">
                    <Select size="small" showSearch={{ optionFilterProp: "label", filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }} placeholder="Selecione o processo" options={processosOptions.map(p => ({ value: p.numero, label: `${p.numero} - ${p.cliente}` }))} />
                </Form.Item>

                <Form.Item name="detalhes" label="Detalhes">
                    <TextArea rows={3} size="small" />
                </Form.Item>

            </Form>
        </Modal>

    </div>
    );
}

export default RecebimentoLista;
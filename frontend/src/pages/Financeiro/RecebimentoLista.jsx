import { useState, useEffect } from 'react';
import { Table, Drawer, Typography, Tag, Input, Button, Space, Modal, Form, Select, Row, Col, Card, DatePicker, notification } from 'antd';
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
    const [isMobile, setIsMobile] = useState(false);
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
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
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

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

    const handleSearch = (e) => {   
        
        const value = e.target.value;
        
        setSearchText(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    
    };

    const handleReset = () => {
        setSearchText('');
        setFiltroTipo(null);
        setFiltroTipoCliente(null);
        setFiltroRecebido(null);
        setFiltroDataInicio(null);
        setFiltroDataFim(null);
        setPagination({ current: 1, pageSize: 10, total: 0 });
    };

    const handleTipoChange = (value) => {
        setFiltroTipo(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };
    
    const handleTipoClienteChange = (value) => {
        setFiltroTipoCliente(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };
    
    const handleRecebidoChange = (value) => {
        setFiltroRecebido(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };
    
    const handleDataInicioChange = (value) => {
        setFiltroDataInicio(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };
    
    const handleDataFimChange = (value) => {
        setFiltroDataFim(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
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
    
    <div style={{ padding: isMobile ? 8 : 16 }}>
        
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

            {!isMobile && (
                
                <Row gutter={[12, 12]} justify="space-between" align="middle">
                
                    <Col xs={24} md={16}>
                                
                        <Space wrap>
                                    
                            <Input placeholder="Buscar por cliente ou processo" value={searchText} onChange={handleSearch} style={{ width: 200 }} prefix={<SearchOutlined />} />
                    
                            <Select placeholder="Tipo" allowClear style={{ width: 120 }} value={filtroTipo} onChange={handleTipoChange} options={TIPO_RECEBIMENTO_OPTIONS} />
                            <Select placeholder="Tipo de cliente" allowClear style={{ width: 120 }} value={filtroTipoCliente} onChange={handleTipoClienteChange} options={[{ value: 'PF', label: 'PF' }, { value: 'PJ', label: 'PJ' }]} />
                            <Select placeholder="Recebido?" allowClear style={{ width: 100 }} value={handleRecebidoChange} onChange={setFiltroRecebido} options={SIM_NAO_OPTIONS} />
                            
                            <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={handleDataInicioChange} size="small" />
                            <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={handleDataFimChange} size="small" />
                                    
                            <Button onClick={handleReset} icon={<ReloadOutlined />}>Limpar</Button>
                                
                        </Space>
                            
                    </Col>
                            
                    <Col>
                        <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#4e0c1e' }}>Novo recebimento</Button>
                    </Col>
                        
                </Row>
            )}

            {isMobile && (
                
                <>
                
                    <div style={{ marginBottom: 16 }}>
                        
                        <Space orientation="vertical" style={{ width: '100%' }} size="small">
                            <Input placeholder="Buscar por cliente ou processo" value={searchText} onChange={handleSearch} style={{ width: '100%' }} prefix={<SearchOutlined />} />
                            <Button icon={<SearchOutlined />} onClick={() => setFiltersDrawerOpen(true)} style={{ width: '100%', color: '#4e0c1e'}}> Filtros </Button>
                            <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#4e0c1e', width: '100%' }}> Novo recebimento </Button>
                        </Space>
                    
                    </div>
                    
                    <Drawer title={<span style={{ color: '#4e0c1e' }}>Filtros</span>} placement="bottom" onClose={() => setFiltersDrawerOpen(false)} open={filtersDrawerOpen} size="auto">
                        
                        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          
                            <Select placeholder="Tipo" allowClear style={{ width: '100%' }} value={filtroTipo} onChange={handleTipoChange} options={TIPO_RECEBIMENTO_OPTIONS} />
                            <Select placeholder="Tipo de cliente" allowClear style={{ width: '100%' }} value={filtroTipoCliente} onChange={handleTipoClienteChange} options={[{ value: 'PF', label: 'PF' }, { value: 'PJ', label: 'PJ' }]} />
                            <Select placeholder="Recebido?" allowClear style={{ width: '100%' }} value={filtroRecebido} onChange={handleRecebidoChange} options={SIM_NAO_OPTIONS} />
                            
                            <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={handleDataInicioChange} size="small" style={{ width: '100%' }} />
                            <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={handleDataFimChange} size="small" style={{ width: '100%' }} />
                            
                            <Button onClick={() => {
                                handleReset();
                                setFiltersDrawerOpen(false);
                            }} style={{ width: '100%' }}> Limpar filtros </Button>
                            
                            <Button type="primary" onClick={() => setFiltersDrawerOpen(false)} style={{ background: '#4e0c1e', width: '100%' }}> Aplicar filtros </Button>
                        
                        </Space>
                    
                    </Drawer>
                </>
            )}

            {!isMobile && (
            
                <>
                    <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} onChange={(pagination) => setPagination({ ...pagination, current: pagination.current })} scroll={{ x: 900 }} size="small" style={{ marginTop: 16 }} />
                </>

            )}

            {isMobile && (
                
                <div style={{ marginTop: 16 }}>
                    
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>Carregando...</div>
                    ) : data.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Nenhum recebimento encontrado</div>
                    ) : (
                    
                        <>
                        
                            {data.map((item) => (
                            
                                <Card key={item.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                            
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <Typography.Text strong style={{ color: '#4e0c1e', fontSize: 13 }}>R$ {item.valor?.toLocaleString('pt-BR')}</Typography.Text>
                                        <Tag color={item.recebido ? 'green' : 'red'} style={{ fontSize: 10, margin: 0 }}> {item.recebido ? 'Recebido' : 'Pendente'} </Tag>
                                    </div>
                                    
                                    <Row gutter={[6, 4]}>
                                        <Col span={12}><Typography.Text type="secondary" style={{ fontSize: 10 }}>Tipo</Typography.Text><div style={{ fontSize: 11 }}>{item.tipo?.descricao || item.tipo || '-'}</div></Col>
                                        <Col span={12}><Typography.Text type="secondary" style={{ fontSize: 10 }}>Data prevista</Typography.Text><div style={{ fontSize: 11 }}>{item.dataPrevistaRecebimento ? dayjs(item.dataPrevistaRecebimento).format('DD/MM/YYYY') : '-'}</div></Col>
                                    </Row>
                                    
                                    <Row gutter={[6, 4]}>
                                        <Col span={24}><Typography.Text type="secondary" style={{ fontSize: 10 }}>Cliente</Typography.Text><div style={{ fontSize: 11 }}>{item.clienteNome || '-'}</div></Col>
                                    </Row>
                                    
                                    <Row gutter={[6, 4]}>
                                        <Col span={24}><Typography.Text type="secondary" style={{ fontSize: 10 }}>Processo</Typography.Text><div style={{ fontSize: 11 }}>{item.processoNumero || '-'}</div></Col>
                                    </Row>
                                    
                                    <div style={{ marginTop: 8, textAlign: 'right' }}>
                                        <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(item)} style={{ color: '#8b1a4a', padding: 0 }} size="small">Ver detalhes</Button>
                                    </div>
                                
                                </Card>
                            
                            ))}
                            
                            {pagination.total > 0 && (
                            
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                                    <Button size="small" onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })} disabled={pagination.current === 1}> Anterior </Button>
                                    <span style={{ fontSize: 12 }}>{pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}</span>
                                    <Button size="small" onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })} disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}> Próxima </Button>
                                </div>
                                
                            )}
                            
                        </>
                    )}
                </div>
            )}
            
            <div style={{ marginTop: 16, textAlign: 'right', fontWeight: 'bold' }}>
                Total: {data.length} de {pagination.total} recebimento{pagination.total !== 1 ? 's' : ''} | Valor total: R$ {totalRecebimentos.toLocaleString('pt-BR')}
            </div>

        </Card>

        <Modal title={!editingItem ? 'Novo recebimento' : (isEditMode ? 'Editar recebimento' : 'Visualizar recebimento')} open={modalVisible} onCancel={handleCancelModal} width={isMobile ? '90%' : 600} footer={
                
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
           
        } mask={{ closable: false }} style={{ top: 50 }}>

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
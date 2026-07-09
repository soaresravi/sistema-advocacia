import { useState, useEffect } from "react";
import { Table, Drawer, Typography, Input, Button, Space, Modal, Form, Select, Row, Col, Card, DatePicker, notification, Tooltip, Tag  } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined, GoogleOutlined } from '@ant-design/icons';
import { getTarefas, createTarefa, updateTarefa, deleteTarefa, getGoogleStatus } from '../../services/tarefaService';
import { getClientesOptions } from '../../services/processoService';
import { getProcessosOptions } from '../../services/audienciaService';
import { STATUS_TAREFA_OPTIONS, URGENCIA_TAREFA_OPTIONS } from '../../constants/enums';

import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

function TarefaLista() {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

    const [searchText, setSearchText] = useState('');
    const [filtroStatus, setFiltroStatus] = useState(null);
    const [filtroUrgencia, setFiltroUrgencia] = useState(null);
    
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
    }, []);

    useEffect(() => {
        carregarDados();
    }, [pagination.current, pagination.pageSize, searchText, filtroStatus, filtroUrgencia]);

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

    const carregarDados = async () => {

        setLoading(true);

        try {

            const response = await getTarefas(pagination.current - 1, pagination.pageSize, {
                search: searchText || undefined,
                status: filtroStatus,
                urgencia: filtroUrgencia,
            });

            setData(response.content || []);

            setPagination({
                ...pagination,
                total: response.total,
                current: response.page + 1,
            });

        } catch (error) {
            showNotification('error', 'Erro ao carregar tarefas');
        } finally {
            setLoading(false);
        }

    };

    const getStatusTag = (status) => {

        const statusString = typeof status === 'object' ? status?.valor : status;
        const normalizedStatus = statusString ? String(statusString).toUpperCase().trim() : 'NAO_INICIADA';
        
        const configs = {
            'CONCLUIDA': { color: 'success', text: 'Concluída' },
            'CONCLUÍDA': { color: 'success', text: 'Concluída' },
            'EM_ANDAMENTO': { color: 'processing', text: 'Em andamento' },
            'EM ANDAMENTO': { color: 'processing', text: 'Em andamento' },
            'NAO_INICIADA': { color: 'default', text: 'Não iniciada' },
            'NÃO INICIADA': { color: 'default', text: 'Não iniciada' }
        };
        
        const config = configs[normalizedStatus] || configs['NAO_INICIADA'];
        return <Tag color={config.color}>{config.text}</Tag>;

    };

    const getUrgenciaTag = (urgencia) => {

        const urgenciaString = typeof urgencia === 'object' ? urgencia?.valor : urgencia;
        const normalizedUrgencia = urgenciaString ? String(urgenciaString).toUpperCase().trim() : '';
    
        const colors = {
            'EXIGE_ATENCAO_IMEDIATA': 'error',
            'EXIGE ATENÇÃO IMEDIATA': 'error',
            'MUITO_URGENTE': 'warning',
            'MUITO URGENTE': 'warning',
            'REQUER_ATENCAO': 'orange',
            'REQUER ATENÇÃO': 'orange',
            'POUCO_URGENTE': 'success',
            'POUCO URGENTE': 'success',
            'PODE_ESPERAR': 'default',
            'PODE ESPERAR': 'default'
        };
    
        const textos = {
            'EXIGE_ATENCAO_IMEDIATA': 'Exige atenção imediata',
            'EXIGE ATENÇÃO IMEDIATA': 'Exige atenção imediata',
            'MUITO_URGENTE': 'Muito urgente',
            'MUITO URGENTE': 'Muito urgente',
            'REQUER_ATENCAO': 'Requer atenção',
            'REQUER ATENÇÃO': 'Requer atenção',
            'POUCO_URGENTE': 'Pouco urgente',
            'POUCO URGENTE': 'Pouco urgente',
            'PODE_ESPERAR': 'Pode esperar',
            'PODE ESPERAR': 'Pode esperar'
        };
    
        const color = colors[normalizedUrgencia] || 'default';
        const texto = textos[normalizedUrgencia] || normalizedUrgencia || '-';
    
        return <Tag color={color}>{texto}</Tag>;

    };

    const handleViewDetails = (record) => {

        setEditingItem(record);
        setIsEditMode(false);
        setModalVisible(true);
        
        setTimeout(() => {

            const statusValue = typeof record.status === 'object' ? record.status?.valor : record.status;
            const statusEncontrado = STATUS_TAREFA_OPTIONS.find(s => s.value === statusValue || s.label === statusValue);
            const urgenciaValue = typeof record.urgencia === 'object' ? record.urgencia?.valor : record.urgencia;
            const urgenciaEncontrada = URGENCIA_TAREFA_OPTIONS.find(u => u.value === urgenciaValue || u.label === urgenciaValue);
    
            form.setFieldsValue({
                tarefa: record.tarefa || '',
                status: statusEncontrado?.value || statusValue || 'NAO_INICIADA',
                urgencia: urgenciaEncontrada?.value || urgenciaValue || null,
                prazoTarefa: record.prazoTarefa ? dayjs(record.prazoTarefa) : null,
                responsavel: (record.responsavel && record.responsavel !== 'string') ? record.responsavel : '',
                andamento: (record.andamento && record.andamento !== 'string') ? record.andamento : '',
                processoNumero: (record.processoNumero && record.processoNumero !== 'string') ? record.processoNumero : '',
                clienteNome: (record.clienteNome && record.clienteNome !== 'string') ? record.clienteNome : '',
            });

        }, 10);

    };

    const handleEnableEdit = () => {
        setIsEditMode(true);
    };

    const handleAdd = () => {
        
        setEditingItem(null);
        setIsEditMode(true);
        form.resetFields();

        form.setFieldsValue({
            status: 'NAO_INICIADA',
            responsavel: '',
            processoNumero: '',
            clienteNome: '',
            andamento: '',
        });

        setModalVisible(true);

    };

    const handleDelete = async () => {

        if (!editingItem) return;

        try {
            await deleteTarefa(editingItem.id);
            showNotification('success', 'Tarefa excluída com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir tarefa');
        }

    };

    const handleModalOk = async () => {
        
        try {
            
            const values = await form.validateFields();
            setModalLoading(true);
    
            let googleConnected = false;

            try {
                const googleStatus = await getGoogleStatus();
                googleConnected = googleStatus.connected;
            } catch (error) {
                console.error('Erro ao verificar Google:', error);
            }
    
            if (!googleConnected) {
                
                Modal.confirm({ title: 'Google Agenda não conectado', content: 'Para sincronizar as tarefas com sua agenda, você precisa conectar sua conta do Google. Deseja conectar agora?', okText: 'Sim, conectar', cancelText: 'Cancelar', centered: true, okButtonProps: { style: { background: '#4e0c1e' } },
                
                onOk: async () => {
                    const authUrlResponse = await api.get('/auth/google/auth-url');
                    window.open(authUrlResponse.data.url, '_blank');
                    showNotification('info', 'Após conectar, clique novamente em Salvar');
                }, });

                setModalLoading(false);
                return;

            }
    
            let tokenValido = true;

            try {

                const testResponse = await api.get('/auth/google/status');
                
                if (!testResponse.data || testResponse.data.connected === false || testResponse.data.expired === true) {
                    tokenValido = false;
                }

            } catch (error) {
                tokenValido = false;
            }
    
            if (!tokenValido) {
                
                Modal.confirm({ title: 'Conexão com Google Agenda expirou', content: 'Sua conexão expirou ou foi revogada. Deseja reconectar agora?', okText: 'Sim, reconectar', cancelText: 'Cancelar', centered: true, okButtonProps: { style: { background: '#4e0c1e' } },
                
                onOk: async () => {
                    
                    try {
                        await api.delete('/auth/google/disconnect');
                    } catch(e) {
                        console.error("Erro ao desconectar:", e);
                    }
        
                    const authUrlResponse = await api.get('/auth/google/auth-url');
                    window.open(authUrlResponse.data.url, '_blank');
                    showNotification('info', 'Após reconectar, clique novamente em Salvar');
                
                }, });

                setModalLoading(false);
                return;
            }
    
            const statusMap = {
                'NAO_INICIADA': 'Não iniciada',
                'EM_ANDAMENTO': 'Em andamento',
                'CONCLUIDA': 'Concluída'
            };
    
            const urgenciaMap = {
                'EXIGE_ATENCAO_IMEDIATA': 'Exige atenção imediata',
                'MUITO_URGENTE': 'Muito urgente',
                'REQUER_ATENCAO': 'Requer atenção',
                'POUCO_URGENTE': 'Pouco urgente',
                'PODE_ESPERAR': 'Pode esperar'
            };
    
            const dataToSend = {
                tarefa: values.tarefa,
                status: statusMap[values.status] || values.status,
                urgencia: urgenciaMap[values.urgencia] || values.urgencia,
                responsavel: values.responsavel || '',
                andamento: values.andamento || '',
                processoNumero: values.processoNumero || '',
                clienteNome: values.clienteNome || '',
                prazoTarefa: values.prazoTarefa ? values.prazoTarefa.format('YYYY-MM-DD') : null,
            };
    
            if (editingItem) {
                await updateTarefa(editingItem.id, dataToSend);
                showNotification('success', 'Tarefa atualizada e sincronizada com Google Agenda!');
            } else {
                await createTarefa(dataToSend);
                showNotification('success', 'Tarefa criada e sincronizada com Google Agenda!');
            }
    
            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();
    
        } catch (error) {
            showNotification('error', errorMessage || 'Erro ao salvar tarefa');
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
        setFiltroStatus(null);
        setFiltroUrgencia(null);
        setPagination({ current: 1, pageSize: 10, total: 0 });
    };
    
    const handleStatusChange = (value) => {
        setFiltroStatus(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };
    
    const handleUrgenciaChange = (value) => {
        setFiltroUrgencia(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const columns = [

        { title: 'Tarefa', dataIndex: 'tarefa', ellipsis: true, width: 200 },
        { title: 'Status', dataIndex: 'status', width: 110, render: (status) => getStatusTag(status) },
        { title: 'Urgência', dataIndex: 'urgencia', width: 140, render: (urgencia) => getUrgenciaTag(urgencia) },
        { title: 'Prazo', dataIndex: 'prazoTarefa', width: 100, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Responsável', dataIndex: 'responsavel', width: 120, render: (text) => !text || text === 'string' ? '-' : text },
        { title: 'Cliente', dataIndex: 'clienteNome', width: 120, render: (text) => !text || text === 'string' ? '-' : text },

        { title: 'Google', width: 70, render: (_, record) => (
            
            record.googleEventId ? (
                
                <Tooltip title="Sincronizado com Google Agenda">
                    <GoogleOutlined style={{ color: '#4285f4', fontSize: 16 }} />
                </Tooltip>

            ) : (

                <Tooltip title="Não sincronizado">
                    <GoogleOutlined style={{ color: '#ccc', fontSize: 16 }} />
                </Tooltip>

            )

        ) },

        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#8b1a4a' }} />
        ) },

    ];

    return (

    <div style={{ padding: isMobile ? 8 : 16 }}>
        
        <Card size="small">

            {!isMobile && (
                
                <Row gutter={[12, 12]} justify="space-between" align="middle">
            
                    <Col xs={24} md={16}>
                        
                        <Space wrap>
                                    
                            <Input placeholder="Buscar por tarefa, cliente ou processo" value={searchText} onChange={handleSearch} style={{ width: 220 }} prefix={<SearchOutlined />} />
                            
                            <Select placeholder="Status" allowClear style={{ width: 120 }} value={filtroStatus} onChange={handleStatusChange} options={STATUS_TAREFA_OPTIONS} />
                            <Select placeholder="Urgência" allowClear style={{ width: 140 }} value={filtroUrgencia} onChange={handleUrgenciaChange} options={URGENCIA_TAREFA_OPTIONS} />
                                    
                            <Button onClick={handleReset} icon={<ReloadOutlined />}>Limpar</Button>
            
                        </Space>
            
                    </Col>
            
                    <Col>
                        <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#4e0c1e' }}> Nova tarefa </Button>
                    </Col>
            
                </Row>
            )}

            {isMobile && (
                
                <>
                    
                    <div style={{ marginBottom: 16 }}>
                    
                        <Space orientation="vertical" style={{ width: '100%' }} size="small">
                            <Input placeholder="Buscar por tarefa, cliente ou processo" value={searchText} onChange={handleSearch} style={{ width: '100%' }} prefix={<SearchOutlined />} />
                            <Button icon={<SearchOutlined />} onClick={() => setFiltersDrawerOpen(true)} style={{ width: '100%', color: '#4e0c1e' }}> Filtros </Button>
                            <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#4e0c1e', width: '100%' }}> Nova tarefa </Button>
                        </Space>
                    
                    </div>
                    
                    <Drawer title={<span style={{ color: '#4e0c1e' }}>Filtros</span>} placement="bottom" onClose={() => setFiltersDrawerOpen(false)} open={filtersDrawerOpen} size="auto">
                        
                        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                            
                            <Select placeholder="Status" allowClear style={{ width: '100%' }} value={filtroStatus} onChange={handleStatusChange} options={STATUS_TAREFA_OPTIONS} />
                            <Select placeholder="Urgência" allowClear style={{ width: '100%' }} value={filtroUrgencia} onChange={handleUrgenciaChange} options={URGENCIA_TAREFA_OPTIONS} />
                            
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
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Nenhuma tarefa encontrada</div>
                    ) : (
                    
                        <>
                        
                            {data.map((item) => {
                                
                                let statusColor = 'default';
                                
                                if (item.status === 'CONCLUIDA') statusColor = 'success';
                                if (item.status === 'EM_ANDAMENTO') statusColor = 'processing';
                                
                                let urgenciaColor = '#d9d9d9';
                                
                                if (item.urgencia === 'EXIGE_ATENCAO_IMEDIATA') urgenciaColor = '#ff4d4f';
                                else if (item.urgencia === 'MUITO_URGENTE') urgenciaColor = '#ff7a45';
                                else if (item.urgencia === 'REQUER_ATENCAO') urgenciaColor = '#faad14';
                                else if (item.urgencia === 'POUCO_URGENTE') urgenciaColor = '#52c41a';
                                else if (item.urgencia === 'PODE_ESPERAR') urgenciaColor = '#1890ff';
                                
                                return (
                                
                                    <Card key={item.id} size="small" style={{ marginBottom: 8, borderRadius: 6, borderLeft: `4px solid ${urgenciaColor}` }} styles={{ body: { padding: '8px 10px' } }}>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <Typography.Text strong style={{ color: '#4e0c1e', fontSize: 13 }}>{item.tarefa}</Typography.Text>
                                            <Tag color={statusColor} style={{ fontSize: 10, margin: 0 }}>{STATUS_TAREFA_OPTIONS.find(o => o.value === item.status)?.label || '-'}</Tag>
                                        </div>
                                        
                                        <Row gutter={[6, 4]}>
                                            <Col span={12}><Typography.Text type="secondary" style={{ fontSize: 10 }}>Prazo</Typography.Text><div style={{ fontSize: 11 }}>{item.prazoTarefa ? dayjs(item.prazoTarefa).format('DD/MM/YYYY') : '-'}</div></Col>
                                            <Col span={12}><Typography.Text type="secondary" style={{ fontSize: 10 }}>Responsável</Typography.Text><div style={{ fontSize: 11 }}>{item.responsavel || '-'}</div></Col>
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
                                
                                );
                                
                            })}
                            
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
                Total: {data.length} de {pagination.total} tarefa{pagination.total !== 1 ? 's' : ''}
            </div>

        </Card>

        <Modal title={!editingItem ? 'Nova tarefa' : (isEditMode ? 'Editar tarefa' : 'Visualizar tarefa')} open={modalVisible} onCancel={handleCancelModal} width={isMobile ? '90%' : 700} footer={
            
        !editingItem ? [
            <Button key="cancel" onClick={handleCancelModal}>Cancelar</Button>,
            <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}>Salvar</Button>,
        ] : isEditMode ? [
                
            <Button key="cancel" onClick={() => {
                    
                setIsEditMode(false);
                    
                if (editingItem) {

                    form.setFieldsValue({
                        ...editingItem,
                        prazoTarefa: editingItem.prazoTarefa ? dayjs(editingItem.prazoTarefa) : null,
                    });

                }
                
            }}>Cancelar</Button>,
                
            <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}>Salvar</Button>,
            
        ] : [
            <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: '#4e0c1e' }}> <EditOutlined /> Editar informações </Button>,
            <Button key="delete" danger onClick={() => { Modal.confirm({ title: 'Excluir tarefa', content: 'Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: '#4e0c1e' }, danger: true }, centered: true, onOk: handleDelete, }); }}> <DeleteOutlined /> Excluir </Button>,
        ]} style={{ top: 50 }}>
                
            <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
                    
                <Form.Item name="tarefa" label="Tarefa" rules={[{ required: true }]}>
                    <Input size="small" />
                </Form.Item>
                    
                <Row gutter={16}>
                        
                    <Col span={12}>
                            
                        <Form.Item name="status" label="Status">
                            <Select size="small" options={STATUS_TAREFA_OPTIONS} />
                        </Form.Item>
                    
                    </Col>
                      
                    <Col span={12}>
                          
                        <Form.Item name="urgencia" label="Urgência">
                            <Select size="small" options={URGENCIA_TAREFA_OPTIONS} />
                        </Form.Item>
                        
                    </Col>
                    
                </Row>

                <Row gutter={16}>
                     
                    <Col span={12}>
                         
                        <Form.Item name="prazoTarefa" label="Prazo">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                        </Form.Item>
                       
                    </Col>
                    
                    <Col span={12}>
                            
                        <Form.Item name="responsavel" label="Responsável">
                            <Input size="small" />
                        </Form.Item>
                      
                    </Col>
                    
                </Row>

                <Row gutter={16}>
                        
                    <Col span={12}>
                            
                        <Form.Item name="processoNumero" label="Nº do Processo">
                            <Select size="small" showSearch={{ filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }} placeholder="Selecione o processo" options={processosOptions.map(p => ({ value: p.numero, label: `${p.numero} - ${p.cliente}` }))} allowClear />
                        </Form.Item>
                       
                    </Col>

                    <Col span={12}>
                            
                        <Form.Item name="clienteNome" label="Cliente">
                                
                            <Select size="small" showSearch={{ filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }} placeholder="Selecione o cliente" options={[
                                ...clientesOptions.pf?.map(c => ({ value: c.nome, label: c.nome })) || [],
                                ...clientesOptions.pj?.map(c => ({ value: c.nome, label: c.nome })) || []
                            ]} allowClear />

                        </Form.Item>
                       
                    </Col>
                   
                </Row>
                    
                <Form.Item name="andamento" label="Andamento">
                    <TextArea rows={4} size="small" placeholder="Digite aqui as observações ou andamento da tarefa..." />
                </Form.Item>
                
            </Form>
        </Modal>
        
    </div>
    );
}

export default TarefaLista;
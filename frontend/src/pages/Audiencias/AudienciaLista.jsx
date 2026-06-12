import { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Modal, Form, Select, Row, Col, Card, DatePicker, notification, Tooltip, TimePicker, Drawer, Typography, Tag } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined, GoogleOutlined } from '@ant-design/icons';
import { getAudiencias, createAudiencia, updateAudiencia, deleteAudiencia, getProcessosOptions, getGoogleStatus } from '../../services/audienciaService';
import { STATUS_EVENTO_OPTIONS } from '../../constants/enums';
import '../../components/Layout/AppLayout.css';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

function AudienciaLista() {

    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [filtroStatus, setFiltroStatus] = useState(null);
    const [filtroDataInicio, setFiltroDataInicio] = useState(null);
    const [filtroDataFim, setFiltroDataFim] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
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
        carregarProcessos();
    }, []);

    useEffect(() => {
        carregarDados();
    }, [pagination.current, pagination.pageSize, searchText, filtroStatus, filtroDataInicio, filtroDataFim]);

    const carregarProcessos = async () => {

        try {
            const processos = await getProcessosOptions();
            setProcessosOptions(processos);
        } catch (error) {
            console.error('Erro ao carregar processos:', error);
        }

    };

    const carregarDados = async () => {

        setLoading(true);

        try {

            const response = await getAudiencias(pagination.current - 1, pagination.pageSize, {
                search: searchText || undefined,
                status: filtroStatus,
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

            let statusValue = record.status;
            
            if (record.status) {
                const descricaoBusca = typeof record.status === 'object' ? record.status.descricao : record.status;
                const opcaoencontrada = STATUS_EVENTO_OPTIONS.find(o => o.label === descricaoBusca);
                if (opcaoencontrada) statusValue = opcaoencontrada.value;
            }
            
            form.setFieldsValue({
                ...record,
                status: statusValue,
                data: record.data ? dayjs(record.data) : null,
                hora: record.hora ? dayjs(record.hora, 'HH:mm') : null,
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
        setModalVisible(true);
    };

    const handleDelete = async () => {

        if (!editingItem) return;

        try {
            await deleteAudiencia(editingItem.id);
            showNotification('success', 'Audiência excluída com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir audiência');
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
                
                Modal.confirm({ title: 'Google Agenda não conectado', content: 'Para sincronizar os eventos com sua agenda, você precisa conectar sua conta do Google. Deseja conectar agora?', okText: 'Sim, conectar', cancelText: 'Cancelar', centered: true, okButtonProps: { style: { background: '#4e0c1e' } },

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

                if (!testResponse.data.connected) {
                    tokenValido = false;
                }

            } catch (error) {
                tokenValido = false;
            }

            if (!tokenValido) {
                
                Modal.confirm({ title: 'Conexão com Google Agenda expirou', content: 'Sua conexão expirou. Deseja reconectar agora?', okText: 'Sim, reconectar', cancelText: 'Cancelar', centered: true, okButtonProps: { style: { background: '#4e0c1e' } },

                onOk: async () => {
                    await api.delete('/auth/google/disconnect');
                    const authUrlResponse = await api.get('/auth/google/auth-url');
                    window.open(authUrlResponse.data.url, '_blank');
                    showNotification('info', 'Após reconectar, clique novamente em Salvar');
                }, });

                setModalLoading(false);
                return;
                
            }

            const statusMapForBackend = {
                'AGENDADO': 'Agendado',
                'CONCLUIDO': 'Concluído',
                'CANCELADO': 'Cancelado'
            };

            const dataToSend = {
                ...values,
                status: statusMapForBackend[values.status] || values.status,
                data: values.data ? values.data.format('YYYY-MM-DD') : null,
                hora: values.hora ? values.hora.format('HH:mm') : null,
            };

            let response;

            if (editingItem) {
                response = await updateAudiencia(editingItem.id, dataToSend);
                showNotification('success', 'Audiência atualizada e sincronizada com Google Agenda!');
            } else {
                response = await createAudiencia(dataToSend);
                showNotification('success', 'Audiência criada e sincronizada com Google Agenda!');
            }

            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar audiência');
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
        { title: 'Data', dataIndex: 'data', width: 110, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Hora', dataIndex: 'hora', width: 80 },
        
        { title: 'Status', dataIndex: 'status', width: 100, render: (text) => {
            
            if (!text) return '-';
            if (typeof text === 'object') return text.descricao;
            const encontrado = STATUS_EVENTO_OPTIONS.find(o => o.value === text);
            return encontrado ? encontrado.label : text;

        }},

        { title: 'Processo', dataIndex: 'processoNumero', width: 180 },
        { title: 'Detalhes', dataIndex: 'detalhes', ellipsis: true },
        { title: 'Local', dataIndex: 'local', width: 150 },

        { title: 'Google', width: 70, render: (_, record) => ( record.googleEventId ? (
            
            <Tooltip title="Sincronizado com Google Agenda">
                <GoogleOutlined style={{ color: '#4285f4', fontSize: 16 }} />
            </Tooltip>
        
        ) : (

            <Tooltip title="Não sincronizado">
                <GoogleOutlined style={{ color: '#ccc', fontSize: 16 }} />
            </Tooltip>

        )), },
        
        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#8b1a4a' }} />
        ),},

    ];

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>
        
        <Card size="small">

            {!isMobile && (
                
                <Row gutter={[12, 12]} justify="space-between" align="middle">
                
                    <Col xs={24} md={16}>
                                
                        <Space wrap>
                                
                            <Input placeholder="Buscar por processo ou detalhes" value={searchText} onChange={(e) => setSearchText(e.target.value)} onPressEnter={() => setPagination({ ...pagination, current: 1 })} style={{ width: 200 }} prefix={<SearchOutlined />} />
                            <Select placeholder="Status" allowClear style={{ width: 120 }} value={filtroStatus} onChange={setFiltroStatus} options={STATUS_EVENTO_OPTIONS} />
                            <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={setFiltroDataInicio} size="small" />
                            <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={setFiltroDataFim} size="small" />
                                    
                            <Button onClick={() => {
                                setSearchText('');
                                setFiltroStatus(null);
                                setFiltroDataInicio(null);
                                setFiltroDataFim(null);
                                setPagination({ ...pagination, current: 1 });
                            }} icon={<ReloadOutlined />}> Limpar </Button>
                                
                        </Space>
                    
                    </Col>
                            
                    <Col>
                        <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#4e0c1e' }}> Nova audiência </Button>
                    </Col>
            
                </Row>
            )}
            
            {isMobile && (
            
                <>
                
                    <div style={{ marginBottom: 16 }}>
        
                        <Space orientation="vertical" style={{ width: '100%' }} size="small">
                            <Input placeholder="Buscar por processo ou detalhes" value={searchText} onChange={(e) => setSearchText(e.target.value)} onPressEnter={() => setPagination({ ...pagination, current: 1 })} style={{ width: '100%' }} prefix={<SearchOutlined />} />
                            <Button icon={<SearchOutlined />} onClick={() => setFiltersDrawerOpen(true)} style={{ width: '100%' }}> Filtros </Button>
                            <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#4e0c1e', width: '100%' }}> Nova audiência </Button>
                        </Space>
                    
                    </div>
                    
                    <Drawer title={<span style={{ color: '#4e0c1e' }}>Filtros</span>} placement="bottom" onClose={() => setFiltersDrawerOpen(false)} open={filtersDrawerOpen} size="auto">
                        
                        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                        
                            <Select placeholder="Status" allowClear style={{ width: '100%' }} value={filtroStatus} onChange={setFiltroStatus} options={STATUS_EVENTO_OPTIONS} />
                            <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={setFiltroDataInicio} size="small" style={{ width: '100%' }} />
                            <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={setFiltroDataFim} size="small" style={{ width: '100%' }} />
                        
                            <Button onClick={() => {
                                setFiltroStatus(null);
                                setFiltroDataInicio(null);
                                setFiltroDataFim(null);
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
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Nenhuma audiência encontrada</div>
                    ) : (
                        
                        <>
                            
                            {data.map((item) => {
                            
                                const statusObj = STATUS_EVENTO_OPTIONS.find(o => o.value === item.status || o.label === item.status);
                                const statusLabel = statusObj?.label || item.status || '-';
                               
                                let statusColor = 'default';
                                
                                if (statusLabel === 'Agendado') statusColor = 'processing';
                                if (statusLabel === 'Concluído') statusColor = 'success';
                                if (statusLabel === 'Cancelado') statusColor = 'error';

                                return (
                                    
                                    <Card key={item.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                                    
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            
                                            <Typography.Text strong style={{ color: '#4e0c1e', fontSize: 13 }}> {item.processoNumero || 'Sem processo'} </Typography.Text>
                                            <Tag color={statusColor} style={{ fontSize: 10, margin: 0, padding: '0px 6px', lineHeight: '18px' }}> {statusLabel} </Tag>
                                            
                                            <Tag color={item.googleEventId ? 'success' : 'default'} style={{ fontSize: 10, margin: 0, padding: '0px 6px', lineHeight: '18px' }}>
                                                {item.googleEventId ? <GoogleOutlined style={{ marginRight: 4 }} /> : null}
                                                {item.googleEventId ? 'Sinc.' : 'Não sinc.'}
                                            </Tag>
                                        
                                        </div>

                                        <Row gutter={[6, 4]}>
                                            
                                            <Col span={12}>
                                                <Typography.Text type="secondary" style={{ fontSize: 10 }}>Data</Typography.Text>
                                                <div style={{ fontSize: 11 }}>{item.data ? dayjs(item.data).format('DD/MM/YYYY') : '-'}</div>
                                            </Col>
                                            
                                            <Col span={12}>
                                                <Typography.Text type="secondary" style={{ fontSize: 10 }}>Hora</Typography.Text>
                                                <div style={{ fontSize: 11 }}>{item.hora || '-'}</div>
                                            </Col>

                                        </Row>

                                        <Row gutter={[6, 4]}>
                                            
                                            <Col span={24}>
                                                <Typography.Text type="secondary" style={{ fontSize: 10 }}>Detalhes</Typography.Text>
                                                <div style={{ fontSize: 11 }}>{item.detalhes || '-'}</div>
                                            </Col>
                                        
                                        </Row>

                                        <Row gutter={[6, 4]}>
                                            
                                            <Col span={24}>
                                                <Typography.Text type="secondary" style={{ fontSize: 10 }}>Local</Typography.Text>
                                                <div style={{ fontSize: 11 }}>{item.local || '-'}</div>
                                            </Col>
                                        
                                        </Row>

                                        <div style={{ marginTop: 8, textAlign: 'right' }}>
                                            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(item)} style={{ color: '#8b1a4a', padding: 0 }} size="small"> Ver detalhes </Button>
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
                Total: {pagination.total} audiência{pagination.total !== 1 ? 's' : ''}
            </div>

        </Card>

        <Modal title={!editingItem ? 'Nova audiência' : (isEditMode ? 'Editar audiência' : 'Visualizar audiência')} open={modalVisible} onCancel={handleCancelModal} width={isMobile ? '90%' : 600} footer={
            
            !editingItem ? [
                <Button key="cancel" onClick={handleCancelModal}>Cancelar</Button>,
                <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}>Salvar</Button>,
            ] : isEditMode ? [
                
                <Button key="cancel" onClick={() => {
                    
                    setIsEditMode(false);
                    
                    if (editingItem) {

                        let statusValue = editingItem.status;
                        
                        if (editingItem.status) {
                            const descricaoBusca = typeof editingItem.status === 'object' ? editingItem.status.descricao : editingItem.status;
                            const opcaoencontrada = STATUS_EVENTO_OPTIONS.find(o => o.label === descricaoBusca);
                            if (opcaoencontrada) statusValue = opcaoencontrada.value;
                        }
                        
                        form.setFieldsValue({
                            data: editingItem.data ? dayjs(editingItem.data) : null,
                            hora: editingItem.hora ? dayjs(editingItem.hora, 'HH:mm') : null,
                            status: statusValue,
                            processoId: editingItem.processoId,
                            detalhes: editingItem.detalhes,
                            local: editingItem.local,
                            observacoes: editingItem.observacoes,
                        });

                    }

                }}>Cancelar</Button>,
                
                <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}>Salvar</Button>,
            
            ] : [
            
                <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: '#4e0c1e' }}> <EditOutlined /> Editar informações </Button>,
                
                <Button key="delete" danger onClick={() => {
                    Modal.confirm({ title: 'Excluir audiência', content: 'Tem certeza que deseja excluir esta audiência? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: '#4e0c1e' }, danger: true }, centered: true, onOk: handleDelete, });
                }}> <DeleteOutlined /> Excluir </Button>,

            ]

        } mask={{ closable: false }} style={{ top: 50 }}>
            
            <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
                
                <Row gutter={16}>
                    
                    <Col span={12}>
                        
                        <Form.Item name="data" label="Data" rules={[{ required: true }]}>
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                        </Form.Item>
                    
                    </Col>
                    
                    <Col span={12}>
                        
                        <Form.Item name="hora" label="Hora">
                            <TimePicker style={{ width: '100%' }} format="HH:mm" size="middle" placeholder="Selecione o horário" />
                        </Form.Item>
                    
                    </Col>
                
                </Row>
                
                <Form.Item name="status" label="Status">
                    <Select size="small" options={STATUS_EVENTO_OPTIONS} />
                </Form.Item>
                
                <Form.Item name="processoId" label="Processo" rules={[{ required: true }]}>
                    <Select size="small" showSearch={{ optionFilterProp: "label" }} placeholder="Selecione o processo" options={processosOptions.map(p => ({ value: p.id, label: `${p.numero} - ${p.cliente}` }))} />
                </Form.Item>
                
                <Form.Item name="detalhes" label="Detalhes">
                    <TextArea rows={3} size="small" />
                </Form.Item>
                
                <Form.Item name="local" label="Local">
                    <Input size="small" />
                </Form.Item>
                
                <Form.Item name="observacoes" label="Observações">
                    <TextArea rows={3} size="small" />
                </Form.Item>
            
            </Form>
        </Modal>
        
    </div>
    );
}

export default AudienciaLista;
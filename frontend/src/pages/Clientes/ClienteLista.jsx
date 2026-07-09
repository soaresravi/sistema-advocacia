import { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Modal, Form, Select, Tabs, notification, Row, Col, Card, DatePicker, Typography } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, UserOutlined, ShopOutlined, EnvironmentOutlined, MoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getClientesPF, getClientesPJ, createClientePF, updateClientePF, deleteClientePF, createClientePJ, updateClientePJ, deleteClientePJ, buscarCep, buscarCidades, buscarEstados } from '../../services/clienteService';

import '../../components/Layout/AppLayout.css';
const { TextArea } = Input;

const ESTADO_CIVIL_OPTIONS = [
    { value: 'SOLTEIRO', label: 'Solteiro(a)' },
    { value: 'CASADO', label: 'Casado(a)' },
    { value: 'SEPARADO', label: 'Separado(a)' },
    { value: 'DIVORCIADO', label: 'Divorciado(a)' },
    { value: 'VIUVO', label: 'Viúvo(a)' },
    { value: 'UNIAO_ESTAVEL', label: 'União Estável' },
];
  
const COMO_CONHECEU_OPTIONS = [
    { value: 'ANUNCIO', label: 'Anúncio' },
    { value: 'FAMILIA_AMIGO', label: 'É família/Amigo' },
    { value: 'GOOGLE', label: 'Google' },
    { value: 'INDICACAO', label: 'Indicação' },
    { value: 'OUTROS', label: 'Outros' },
    { value: 'PARCERIA', label: 'Parceria' },
    { value: 'REDES_SOCIAIS', label: 'Redes sociais' },
    { value: 'SITE', label: 'Site' },
];
  
const SEGMENTO_OPTIONS = [
    { value: 'AGRONEGOCIO', label: 'Agronegócio' },
    { value: 'ALIMENTOS_BEBIDAS', label: 'Alimentos e Bebidas' },
    { value: 'ARQUITETURA', label: 'Arquitetura' },
    { value: 'ATACADO_DISTRIBUICAO', label: 'Atacado e Distribuição' },
    { value: 'BEBIDAS', label: 'Bebidas' },
    { value: 'BELEZA', label: 'Beleza' },
    { value: 'CARTORIO', label: 'Cartório' },
    { value: 'COMERCIO_GERAL', label: 'Comércio em Geral' },
    { value: 'CONDOMINIO_ADMINISTRADORA', label: 'Condomínio e Administradora' },
    { value: 'CONSTRUCAO_CIVIL', label: 'Construção Civil' },
    { value: 'CONTABILIDADE', label: 'Contabilidade' },
    { value: 'CORRETORA_IMOVEIS', label: 'Corretora de Imóveis' },
    { value: 'CORRETORA_SEGUROS', label: 'Corretora de Seguros' },
    { value: 'EDUCACAO', label: 'Educação' },
    { value: 'INDUSTRIA', label: 'Indústria' },
    { value: 'MATERIAL_CONSTRUCAO', label: 'Material de Construção' },
    { value: 'MEDICINA_SAUDE', label: 'Medicina e Saúde' },
    { value: 'METALURGICA', label: 'Metalúrgica' },
    { value: 'MODA', label: 'Moda' },
    { value: 'OUTROS', label: 'Outros' },
    { value: 'TECNOLOGIA', label: 'Tecnologia' },
    { value: 'VEICULOS_PECAS', label: 'Veículos e Peças' },
];

function ClientesLista() {

    const [activeTab, setActiveTab] = useState('pf');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const [estados, setEstados] = useState([]);
    const [cidades, setCidades] = useState([]);
    const [loadingCep, setLoadingCep] = useState(false);
    const [cepInput, setCepInput] = useState('');

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        carregarEstados();
    }, []);

    useEffect(() => {
        carregarDados();
    }, [activeTab, pagination.current, pagination.pageSize]);

    const carregarEstados = async () => {

        try {
            const response = await buscarEstados();
            setEstados(response.estados || []);
        } catch (error) {
            console.error('Erro ao carregar estados:', error);
        }

    };

    const carregarCidades = async (uf) => {

        if (!uf) return;

        try {
            const response = await buscarCidades(uf);
            setCidades(response.cidades || []);
        } catch (error) {
            console.error('Erro ao carregar cidades:', error);
        }
    
    };

    const showNotification = (type, message) => {
        notification[type]({ title: null, description: message, placement: 'bottomRight', duration: 10, showProgress: true, pauseOnHover: false, closable: true, });
    };

    const buscarEnderecoPorCep = async () => {

        const cepLimpo = cepInput?.replace(/\D/g, '');

        if (!cepLimpo || cepLimpo.length < 8) {
            message.warning('Digite um CEP válido com 8 dígitos');
            return;
        }

        setLoadingCep(true);

        try {

            const response = await buscarCep(cepLimpo);

            if (!response.erro) {

                form.setFieldsValue({
                    cep: cepLimpo,
                    endereco: response.logradouro || response.endereco || '',
                    bairro: response.bairro || '',
                    cidade: response.localidade || response.cidade || '',
                    estado: response.uf || response.estado || '',
                });

                if (response.uf || response.estado) {
                    const uf = response.uf || response.estado;
                    carregarCidades(uf);
                }

                showNotification('success', 'Endereço encontrado!');

            } else {
                showNotification('warning', 'CEP não encontrado');
            }

        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            showNotification('error', 'Erro ao buscar CEP');
        } finally {
            setLoadingCep(false);
        }

    };

    const carregarDados = async () => {

        setLoading(true);

        try {

            const params = {
                page: pagination.current - 1,
                size: pagination.pageSize,
                search: searchText || undefined,
            };

            const response = activeTab === 'pf' ? await getClientesPF(params.page, params.size, params.search) : await getClientesPJ(params.page, params.size, params.search);
            setData(response.content || []);

            setPagination({
                ...pagination,
                total: response.total,
                current: response.page + 1,
            });

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showNotification('error', 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }

    };

    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, current: 1 }));
        setSearchText(searchText);
    };

    const handleReset = () => {
        setSearchText('');
        setPagination({ current: 1, pageSize: 10, total: 0 });
    };

    const handleViewDetails = (record) => {
        
        setEditingItem(record);
        setIsEditMode(false);
        setCepInput(record.cep || '');
        
        form.setFieldsValue({
          ...record,
          dataNascimento: record.dataNascimento ? dayjs(record.dataNascimento) : null,
        });

        if (record.estado) {
          carregarCidades(record.estado);
        }

        setModalVisible(true);

    };

    const handleEnableEdit = () => {
        setIsEditMode(true);
    };

    const handleAddPF = () => {
        setEditingItem(null);
        setIsEditMode(true);
        form.resetFields();
        setCepInput('');
        setActiveTab('pf');
        setModalVisible(true);
    };
    
    const handleAddPJ = () => {
        setEditingItem(null);
        setIsEditMode(true);
        form.resetFields();
        setCepInput('');
        setActiveTab('pj');
        setModalVisible(true);
    };
    
    const handleDelete = async () => {
        
        if (!editingItem) return;
        
        try {
          
            if (activeTab === 'pf') {
                await deleteClientePF(editingItem.id);
            } else {
                await deleteClientePJ(editingItem.id);
            }
            
            showNotification('success', 'Cliente excluído com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
        
        } catch (error) {
            showNotification('error', 'Erro ao excluir cliente');
        }

    };

    const handleModalOk = async () => {

        try {

            const values = await form.validateFields();
            setModalLoading(true);

            const dataToSend = {
                ...values,
                dataNascimento: values.dataNascimento ? values.dataNascimento.format('YYYY-MM-DD') : null,
            };

            if (editingItem) {

                if (activeTab === 'pf') {
                    await updateClientePF(editingItem.id, dataToSend);
                } else {
                    await updateClientePJ(editingItem.id, dataToSend);
                }

                showNotification('success', 'Cliente atualizado com sucesso!');

            } else {

                if (activeTab === 'pf') {
                    await createClientePF(dataToSend);
                } else {
                    await createClientePJ(dataToSend);
                }

                showNotification('success', 'Cliente criado com sucesso!');

            }

            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar cliente');
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

        } else if (!isEditMode && editingItem) {
          setModalVisible(false);
          setIsEditMode(false);
          setEditingItem(null);
          form.resetFields();
       
        } else {
            
            Modal.confirm({ title: 'Tem certeza?', content: 'As informações não salvas serão perdidas.', okText: 'Sim, fechar', cancelText: 'Não, continuar', okButtonProps: { style: { background: '#4e0c1e' } }, centered: true,
            
            onOk: () => {
                setModalVisible(false);
                setIsEditMode(false);
                setEditingItem(null);
                form.resetFields();
            }, });

        }
    
    };

    const pfColumns = [
        
        { title: 'ID', dataIndex: 'id', width: 70 },
        
        { title: 'Nome', dataIndex: 'nome', render: (text, record) => (
            <Button type="link" style={{ padding: 0, color: '#4e0c1e' }} onClick={() => handleViewDetails(record)}> {text} </Button>
        )},

        { title: 'CPF', dataIndex: 'cpf', width: 140 },
        { title: 'Telefone', dataIndex: 'telefone', width: 130 },
        { title: 'Email', dataIndex: 'email', ellipsis: true },
        { title: 'Cidade', dataIndex: 'cidade', width: 150 },
       
        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#8b1a4a' }} />
        ), },

    ];
    
    const pjColumns = [
        
        { title: 'ID', dataIndex: 'id', width: 70 },
        
        { title: 'Nome Fantasia', dataIndex: 'nomeFantasia', render: (text, record) => (
            <Button type="link" style={{ padding: 0, color: '#4e0c1e' }} onClick={() => handleViewDetails(record)}> {text} </Button>
        )},

        { title: 'CNPJ', dataIndex: 'cnpj', width: 160 },
        { title: 'Telefone', dataIndex: 'telefone', width: 130 },
        { title: 'Email', dataIndex: 'email', ellipsis: true },
        { title: 'Cidade', dataIndex: 'cidade', width: 150 },
        
        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#8b1a4a' }} />
        ), },

    ];
    
    const totalClientes = data.length;

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>
        
        <Card size="small">
            
            <Row gutter={[16, 16]} justify="space-between" align="middle">
                
                <Col xs={24} md={12}>
                
                <Space wrap orientation={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
                    <Input placeholder="Buscar por nome ou CPF/CNPJ" value={searchText} onChange={(e) => setSearchText(e.target.value)} onPressEnter={handleSearch} style={{ width: isMobile ? '100%' : 250 }} prefix={<SearchOutlined />} />
                    <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />} style={{ background: '#4e0c1e', width: isMobile ? '100%' : 'auto' }}> Buscar </Button>
                    <Button onClick={handleReset} icon={<ReloadOutlined />} style={{ width: isMobile ? '100%' : 'auto' }}> Limpar </Button>
                </Space>

                </Col>
                <Col xs={24} md={12} style={{ textAlign: isMobile ? 'center' : 'right', marginTop: isMobile ? 8 : 0 }}>
                
                <Space wrap orientation={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
                    <Button type="primary" onClick={handleAddPF} icon={<UserOutlined />} style={{ background: '#4e0c1e', color: '#fff', width: isMobile ? '100%' : 'auto'}}> Novo cliente PF </Button>
                    <Button type="primary" onClick={handleAddPJ} icon={<ShopOutlined />} style={{ background: '#8b1a4a', color: '#fff', width: isMobile ? '100%' : 'auto'}}> Novo cliente PJ </Button>
                </Space>

                </Col>

            </Row>
      
            <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 16 }} className="custom-tabs" items={[
                
                { key: 'pf', label: <span><UserOutlined /> Pessoa física</span>, children: (
                
                <>
                    
                    {!isMobile ? (
                        
                        <>
                            <Table columns={pfColumns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} onChange={(pagination) => {setPagination({ ...pagination, current: pagination.current }); }} scroll={{ x: 800 }} size="small" />
                        </>
                            
                    ) : (
                        
                        <div style={{ marginTop: 16 }}>
                                
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 20 }}>Carregando...</div>
                            ) : (
                                    
                                <>
                                        
                                    {data.map((record) => (
                                            
                                        <Card key={record.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                                                
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <Typography.Text strong style={{ color: '#4e0c1e', fontSize: 13 }}>{record.nome}</Typography.Text>
                                                <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#4e0c1e', padding: 0 }} size="small" />
                                            </div>
                        
                                            <Row gutter={[6, 4]}>
            
                                                <Col span={12}>
                                                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>CPF</Typography.Text>
                                                    <div style={{ fontSize: 11 }}>{record.cpf || '-'}</div>
                                                </Col>
                
                                                <Col span={12}>
                                                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>Telefone</Typography.Text>
                                                    <div style={{ fontSize: 11 }}>{record.telefone || '-'}</div>
                                                </Col>
                            
                                            </Row>
                
                                            <Row gutter={[6, 4]}>
    
                                                <Col span={24}>
                                                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>Email</Typography.Text>
                                                    <div style={{ fontSize: 11 }}>{record.email || '-'}</div>
                                                </Col>
                
                                            </Row>
                                            
                                            <Row gutter={[6, 4]}>
                                
                                                <Col span={24}>
                                                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>Cidade</Typography.Text>
                                                    <div style={{ fontSize: 11 }}>{record.cidade || '-'}</div>
                                                </Col>
                                    
                                            </Row>
                        
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
                        Total: {totalClientes} cliente{totalClientes !== 1 ? 's' : ''}
                    </div>
                    
                </> )},

                { key: 'pj', label: <span><ShopOutlined /> Pessoa jurídica</span>, children: (
                
                <>
                
                    {!isMobile ? (
                        
                        <>
                            <Table columns={pjColumns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} onChange={(pagination) => { setPagination({ ...pagination, current: pagination.current }); }} scroll={{ x: 800 }} size="small" />
                        </>
                        
                    ) : (
                    
                        <div style={{ marginTop: 16 }}>
                            
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 20 }}>Carregando...</div>
                            ) : (
                                
                                <>
                                    
                                    {data.map((record) => (

                                        <Card key={record.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <Typography.Text strong style={{ color: '#4e0c1e', fontSize: 13 }}>{record.nomeFantasia}</Typography.Text>
                                                <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#4e0c1e', padding: 0 }} size="small" />
                                            </div>
                                            
                                            <Row gutter={[6, 4]}>
                                                
                                                <Col span={12}>
                                                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>CNPJ</Typography.Text>
                                                    <div style={{ fontSize: 11 }}>{record.cnpj || '-'}</div>
                                                </Col>

                                                <Col span={12}>
                                                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>Telefone</Typography.Text>
                                                    <div style={{ fontSize: 11 }}>{record.telefone || '-'}</div>
                                                </Col>
                
                                            </Row>
                                            
                                            <Row gutter={[6, 4]}>
                                
                                                <Col span={24}>
                                                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>Email</Typography.Text>
                                                    <div style={{ fontSize: 11 }}>{record.email || '-'}</div>
                                                </Col>
                                    
                                            </Row>
                        
                                            <Row gutter={[6, 4]}>
            
                                                <Col span={24}>
                                                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>Cidade</Typography.Text>
                                                    <div style={{ fontSize: 11 }}>{record.cidade || '-'}</div>
                                                </Col>
                            
                                            </Row>
                
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
                        Total: {totalClientes} cliente{totalClientes !== 1 ? 's' : ''}
                    </div>

                </> )},
              
            ]} />

        </Card>

        <Modal title={!editingItem ? `Novo cliente ${activeTab === 'pf' ? 'pessoa física' : 'pessoa jurídica'}` : (isEditMode ? `Editar ${activeTab === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}` : 'Visualizar cliente')} open={modalVisible} onCancel={handleCancelModal} width={isMobile ? '90%' : 650}
        
        footer={!editingItem ? [
            
            <Button key="cancel" onClick={handleCancelModal}> Cancelar </Button>,
            <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}> Salvar </Button>,
        
        ] : isEditMode ? [
            
            <Button key="cancel" onClick={() => {
                
                setIsEditMode(false);
                
                if (editingItem) {
                    
                    form.setFieldsValue({
                        ...editingItem,
                        dataNascimento: editingItem.dataNascimento ? dayjs(editingItem.dataNascimento) : null,
                    });

                }
            }}> Cancelar </Button>,
            
            <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}> Salvar </Button>,
        
        ] : [
            
            <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: '#4e0c1e' }}> <EditOutlined /> Editar Informações </Button>,
            <Button key="delete" danger onClick={() => {  Modal.confirm({ title: 'Excluir cliente', content: 'Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: '#4e0c1e' }, danger: true }, centered: true, onOk: handleDelete, });}}> <DeleteOutlined /> Excluir </Button>
        
        ]} destroyOnHidden forceRender style={{ top: 50 }} mask={{ closable: false }}>
            
            <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
                
                {activeTab === 'pf' ? (
                
                <>
                    <Row gutter={16}>
                        
                        <Col span={14}>

                            <Form.Item name="nome" label="Nome" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>

                        </Col>
                        
                        <Col span={10}>
                            
                            <Form.Item name="cpf" label="CPF" style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>

                        </Col>

                    </Row>
                    
                    <Row gutter={16}>
                        
                        <Col span={6}>
                            
                            <Form.Item name="sexo" label="Sexo" style={{ marginBottom: 8 }}>
                                <Select placeholder="Selecione" size="small" allowClear options={[ { value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' }, ]} />
                            </Form.Item>

                        </Col>
                        
                        <Col span={9}>
                            
                            <Form.Item name="dataNascimento" label="Data nascimento" style={{ marginBottom: 8 }}>
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                            </Form.Item>

                        </Col>
                        
                        <Col span={9}>
                            
                            <Form.Item name="profissao" label="Profissão" style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>

                        </Col>

                    </Row>
                    
                    <Row gutter={16}>
                        
                        <Col span={10}>
                            
                            <Form.Item name="telefone" label="Telefone" style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>

                        </Col>
                        
                        <Col span={14}>
                            
                            <Form.Item name="email" label="E-mail" style={{ marginBottom: 8 }}>
                                <Input type="email" size="small" />
                            </Form.Item>

                        </Col>

                    </Row>
                    
                    <Row gutter={16}>
                        
                        <Col span={10}>
                            
                            <Form.Item label="CEP" style={{ marginBottom: 8 }}>
                                
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    
                                    <Form.Item name="cep" noStyle>
                                        
                                        <Input value={cepInput}
                                        
                                        onChange={(e) => {
                                            setCepInput(e.target.value);
                                            form.setFieldValue('cep', e.target.value);
                                        }} placeholder="Digite o CEP" size="small" style={{ flex: 1 }} disabled={editingItem && !isEditMode} />
                                    
                                    </Form.Item>
                                    
                                    <Button size="small" type="primary" onClick={buscarEnderecoPorCep} loading={loadingCep} icon={<EnvironmentOutlined />} style={{ background: '#4e0c1e', color: '#fff', whiteSpace: 'nowrap' }} disabled={editingItem && !isEditMode}> Buscar </Button>
                                
                                </div>
                            
                            </Form.Item>

                        </Col>
                        
                        <Col span={14}>
                            
                            <Form.Item name="endereco" label="Endereço" style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>
                        
                        </Col>

                    </Row>
                    
                    <Row gutter={16}>
                        
                        <Col span={8}>
                            
                            <Form.Item name="bairro" label="Bairro" style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>

                        </Col>
                        
                        <Col span={8}>
                            
                            <Form.Item name="cidade" label="Cidade" style={{ marginBottom: 8 }}>
                                <Select placeholder="Selecione" allowClear size="small" options={cidades.map(c => ({ label: c, value: c }))} showSearch={{ filterOption: (input, option) => option.label.toLowerCase().includes(input.toLowerCase())}} disabled={editingItem && !isEditMode} />
                            </Form.Item>

                        </Col>
                        
                        <Col span={8}>
                            
                            <Form.Item name="estado" label="Estado" style={{ marginBottom: 8 }}>
                                
                                <Select placeholder="Selecione" showSearch allowClear size="small"
                                
                                onChange={(value) => {
                                    form.setFieldValue('cidade', null);
                                    carregarCidades(value);
                                }} options={estados.map(e => ({ label: `${e.sigla} - ${e.nome}`, value: e.sigla }))} disabled={editingItem && !isEditMode} />
                           
                            </Form.Item>

                        </Col>

                    </Row>
                    
                    <Row gutter={16}>
                        
                        <Col span={12}>
                            
                            <Form.Item name="estadoCivil" label="Estado civil" style={{ marginBottom: 8 }}>
                                <Select placeholder="Selecione" size="small" allowClear disabled={editingItem && !isEditMode} options={ESTADO_CIVIL_OPTIONS} />
                            </Form.Item>

                        </Col>
                        
                        <Col span={12}>
                            
                            <Form.Item name="comoConheceu" label="Como conheceu" style={{ marginBottom: 8 }}>
                                <Select placeholder="Selecione" size="small" allowClear disabled={editingItem && !isEditMode} options={COMO_CONHECEU_OPTIONS} />
                            </Form.Item>

                        </Col>

                    </Row>
                    
                    <Form.Item name="observacoes" label="Observações" style={{ marginBottom: 8 }}>                        
                        <TextArea rows={3} size="small" disabled={editingItem && !isEditMode} style={{ minHeight: '60px' }} />
                    </Form.Item>

                </>
            
                ) : (
                
                <>
                
                    <Row gutter={16}>
                        
                        <Col span={14}>
                            
                            <Form.Item name="nomeFantasia" label="Nome Fantasia" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>

                        </Col>
                        
                        <Col span={10}>
                            
                            <Form.Item name="cnpj" label="CNPJ" style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>

                        </Col>

                    </Row>
                    
                    <Row gutter={16}>
                        
                        <Col span={12}>
                            
                            <Form.Item name="razaoSocial" label="Razão Social" style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>

                        </Col>
                        
                        <Col span={12}>
                            
                            <Form.Item name="responsavelLegal" label="Responsável Legal" style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>

                        </Col>

                    </Row>
                    
                    <Row gutter={16}>
                        
                        <Col span={10}>
                            
                            <Form.Item name="telefone" label="Telefone" style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>

                        </Col>
                        
                        <Col span={14}>
                            
                            <Form.Item name="email" label="E-mail" style={{ marginBottom: 8 }}>
                                <Input type="email" size="small" />
                            </Form.Item>

                        </Col>

                    </Row>
                    
                    <Row gutter={16}>
                        
                        <Col span={10}>
                            
                            <Form.Item label="CEP" style={{ marginBottom: 8 }}>
                                
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    
                                    <Form.Item name="cep" noStyle>
                                        
                                        <Input value={cepInput}
                                        
                                        onChange={(e) => {
                                            setCepInput(e.target.value);
                                            form.setFieldValue('cep', e.target.value);
                                        }} placeholder="Digite o CEP" size="small" style={{ flex: 1 }} disabled={editingItem && !isEditMode} />
                                
                                    </Form.Item>
                                    
                                    <Button size="small" onClick={buscarEnderecoPorCep} loading={loadingCep} icon={<EnvironmentOutlined />} style={{ background: '#4e0c1e', color: '#fff', whiteSpace: 'nowrap' }} disabled={editingItem && !isEditMode}> Buscar </Button>
                                
                                </div>

                            </Form.Item>
                        
                        </Col>
                        
                        <Col span={14}>
                            
                            <Form.Item name="endereco" label="Endereço" style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>
                        
                        </Col>
                    
                    </Row>
                    
                    <Row gutter={16}>
                        
                        <Col span={8}>
                            
                            <Form.Item name="bairro" label="Bairro" style={{ marginBottom: 8 }}>
                                <Input size="small" />
                            </Form.Item>

                        </Col>
                        
                        <Col span={8}>
                            
                            <Form.Item name="cidade" label="Cidade" style={{ marginBottom: 8 }}>
                                <Select placeholder="Selecione" showSearch allowClear size="small" options={cidades.map(c => ({ label: c, value: c }))} disabled={editingItem && !isEditMode} />
                            </Form.Item>

                        </Col>
                        
                        <Col span={8}>
                            
                            <Form.Item name="estado" label="Estado" style={{ marginBottom: 8 }}>
                                
                                <Select placeholder="Selecione" showSearch allowClear size="small"
                                
                                onChange={(value) => {
                                    form.setFieldValue('cidade', null);
                                    carregarCidades(value);
                                }} options={estados.map(e => ({ label: `${e.sigla} - ${e.nome}`, value: e.sigla }))} disabled={editingItem && !isEditMode} />
                     
                            </Form.Item>

                        </Col>

                    </Row>
                    
                    <Row gutter={16}>
                        
                        <Col span={12}>
                            
                            <Form.Item name="segmento" label="Segmento" style={{ marginBottom: 8 }}>
                                <Select placeholder="Selecione" showSearch size="small" allowClear disabled={editingItem && !isEditMode} options={SEGMENTO_OPTIONS} />
                            </Form.Item>

                        </Col>
                        
                        <Col span={12}>
                            
                            <Form.Item name="comoConheceu" label="Como conheceu" style={{ marginBottom: 8 }}>
                                <Select placeholder="Selecione" size="small" allowClear disabled={editingItem && !isEditMode} options={COMO_CONHECEU_OPTIONS} />
                            </Form.Item>

                        </Col>

                    </Row>
                    
                    <Form.Item name="observacoes" label="Observações" style={{ marginBottom: 8 }}>
                        <TextArea rows={3} size="small" disabled={editingItem && !isEditMode} style={{ minHeight: '60px' }} />
                    </Form.Item>

                </>
                )}
            </Form>
        </Modal>
        
    </div>
    );
}

export default ClientesLista;
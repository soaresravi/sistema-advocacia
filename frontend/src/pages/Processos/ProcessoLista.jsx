import { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Modal, Form, Select, Tabs, notification, Row, Col, Card, DatePicker, Upload } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, UploadOutlined, DownloadOutlined, FileOutlined, MoreOutlined } from '@ant-design/icons';
import { getProcessos, createProcesso, updateProcesso, deleteProcesso, getMovimentacoes, createMovimentacao, updateMovimentacao, deleteMovimentacao, getDocumentos, uploadDocumento, deleteDocumento, downloadDocumento, downloadAllDocumentos, getTiposAcao, createTipoAcao } from '../../services/processoService';
import { getClientesOptions } from '../../services/processoService';
import { STATUS_PROCESSO_OPTIONS, FASE_PROCESSO_OPTIONS, RESULTADO_PROCESSO_OPTIONS, QUALIFICACAO_OPTIONS, INSTANCIA_OPTIONS } from '../../constants/enums';

import dayjs from 'dayjs';

const { TextArea } = Input;

function ProcessosLista() {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const [searchText, setSearchText] = useState('');
    const [filtroStatus, setFiltroStatus] = useState(null);
    const [filtroTipoCliente, setFiltroTipoCliente] = useState(null);
    const [filtroPrazoAberto, setFiltroPrazoAberto] = useState(null);
    const [filtroFase, setFiltroFase] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeTab, setActiveTab] = useState('dados');
    const [form] = Form.useForm();

    const [movimentacoes, setMovimentacoes] = useState([]);
    const [movLoading, setMovLoading] = useState(false);
    const [movModalVisible, setMovModalVisible] = useState(false);
    const [editingMov, setEditingMov] = useState(null);
    const [movForm] = Form.useForm();

    const [documentos, setDocumentos] = useState([]);
    const [docLoading, setDocLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);

    const [tiposAcao, setTiposAcao] = useState([]);
    const [clientesOptions, setClientesOptions] = useState({ pf: [], pj: [] });
    const [novoTipoAcao, setNovoTipoAcao] = useState('');
    const [tipoAcaoModalVisible, setTipoAcaoModalVisible] = useState(false);

    const BACKEND_CONVERT = {
        
        'ATIVO': 'Ativo',
        'ENCERRADO': 'Encerrado',
        
        'INICIAL': 'Fase Inicial',
        'AUDIENCIA': 'Fase de Audiência',
        'CITACAO': 'Fase de Citação',
        'CONCILIACAO': 'Fase de Conciliação',
        'CONTESTACAO': 'Fase de Contestação',
        'SENTENCA': 'Fase de Sentença'
    };
    
    const FRONTEND_CONVERT = {
        
        'Ativo': 'ATIVO',
        'Encerrado': 'ENCERRADO',
        
        'Fase Inicial': 'INICIAL',
        'Fase de Audiência': 'AUDIENCIA',
        'Fase de Citação': 'CITACAO',
        'Fase de Conciliação': 'CONCILIACAO',
        'Fase de Contestação': 'CONTESTACAO',
        'Fase de Sentença': 'SENTENCA'
    };

    useEffect(() => {
        carregarOpcoes();
    }, []);

    useEffect(() => {
        carregarDados();
    }, [pagination.current, pagination.pageSize, searchText, filtroStatus, filtroTipoCliente, filtroPrazoAberto, filtroFase]);

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

    const carregarOpcoes = async () => {

        try {

            const [tipos, clientes] = await Promise.all([
                getTiposAcao(),
                getClientesOptions()
            ]);

            setTiposAcao(tipos);
            setClientesOptions(clientes);

        } catch (error) {
            console.error('Erro ao carregar opções:', error);
        }

    };

    const carregarDados = async () => {

        setLoading(true);

        try {

            const params = {
                page: pagination.current - 1,
                size: pagination.pageSize,
                search: searchText || undefined,
                status: filtroStatus,
                tipoCliente: filtroTipoCliente,
                prazoAberto: filtroPrazoAberto,
                fase: filtroFase,
            };

            const response = await getProcessos(params.page, params.size, {
                search: params.search,
                status: params.status,
                tipoCliente: params.tipoCliente,
                prazoAberto: params.prazoAberto,
                fase: params.fase,
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

    const formatarTipoAcao = (valor) => {

        if (!valor || valor.includes(' ') || /[a-z]/.test(valor)) {
            return valor;
        }
    
        const encontrado = tiposAcao.find(t => t.nome === valor);
        if (encontrado) return encontrado.nome;
        
        return valor;

    };

    const carregarMovimentacoes = async (processoId) => {

        setMovLoading(true);

        try {
            const response = await getMovimentacoes(processoId);
            setMovimentacoes(response);
        } catch (error) {
            console.error('Erro ao carregar movimentações:', error);
        } finally {
            setMovLoading(false);
        }

    };

    const carregarDocumentos = async (processoId) => {

        setDocLoading(true);

        try {
            const response = await getDocumentos(processoId);
            setDocumentos(response);
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
        } finally {
            setDocLoading(false);
        }

    };

    const handleViewDetails = async (record) => {

        setEditingItem(record);
        setIsEditMode(false);
        setActiveTab('dados');
        setModalVisible(true);

        requestAnimationFrame(() => {

            const statusBackend = record.status?.descricao || record.status;
            const faseBackend = record.fase?.descricao || record.fase;
            
            form.setFieldsValue({
                ...record,
                status: FRONTEND_CONVERT[statusBackend] || statusBackend,
                fase: FRONTEND_CONVERT[faseBackend] || faseBackend,
                tipoAcao: formatarTipoAcao(record.tipoAcao),
                dataInicio: record.dataInicio ? dayjs(record.dataInicio) : null,
                dataFim: record.dataFim ? dayjs(record.dataFim) : null,
                dataPrazo: record.dataPrazo ? dayjs(record.dataPrazo) : null,
            });

        });

        await Promise.all([
            carregarMovimentacoes(record.id),
            carregarDocumentos(record.id)
        ]);

    };

    const handleEnableEdit = () => {
        setIsEditMode(true);
    };

    const handleAdd = () => {
        setEditingItem(null);
        setIsEditMode(true);
        form.resetFields();
        setMovimentacoes([]);
        setDocumentos([]);
        setModalVisible(true);
    };

    const handleDelete = async () => {

        if (!editingItem) return;

        try {
            await deleteProcesso(editingItem.id);
            showNotification('success', 'Processo excluído com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir processo');
        }

    };

    const handleModalOk = async () => {

        try {

            const values = await form.validateFields();
            setModalLoading(true);

            const dataToSend = {
                ...values,
                status: BACKEND_CONVERT[values.status] || values.status,
                fase: BACKEND_CONVERT[values.fase] || values.fase,
                dataInicio: values.dataInicio ? values.dataInicio.format('YYYY-MM-DD') : null,
                dataFim: values.dataFim ? values.dataFim.format('YYYY-MM-DD') : null,
                dataPrazo: values.dataPrazo ? values.dataPrazo.format('YYYY-MM-DD') : null,
            };

            if (editingItem) {
                await updateProcesso(editingItem.id, dataToSend);
                showNotification('success', 'Processo atualizado com sucesso!');
            } else {
                await createProcesso(dataToSend);
                showNotification('success', 'Processo criado com sucesso!');
            }

            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar processo');
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
            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            form.resetFields();
        }

    };

    const handleAddMov = () => {
        setEditingMov(null);
        movForm.resetFields();
        setMovModalVisible(true);
    };

    const handleEditMov = (record) => {

        setEditingMov(record);

        movForm.setFieldsValue({
            descricao: record.descricao,
            data: record.data ? dayjs(record.data) : null,
        });

        setMovModalVisible(true);

    };

    const handleDeleteMov = async (movId) => {

        try {
            await deleteMovimentacao(editingItem.id, movId);
            showNotification('success', 'Movimentação excluída com sucesso!');
            carregarMovimentacoes(editingItem.id);
        } catch (error) {
            showNotification('error', 'Erro ao excluir movimentação');
        }

    };

    const handleMovModalOk = async () => {
        
        try {

            const values = await movForm.validateFields();

            const dataToSend = {
                descricao: values.descricao,
                data: values.data ? values.data.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
            };

            if (editingMov) {
                await updateMovimentacao(editingItem.id, editingMov.id, dataToSend);
                showNotification('success', 'Movimentação atualizada com sucesso!');
            } else {
                await createMovimentacao(editingItem.id, dataToSend);
                showNotification('success', 'Movimentação criada com sucesso!');
            }

            setMovModalVisible(false);
            carregarMovimentacoes(editingItem.id);

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar movimentação');
        }

    };

    const handleUpload = async (file) => {

        setUploadLoading(true);

        try {
            await uploadDocumento(editingItem.id, file);
            showNotification('success', 'Documento enviado com sucesso!');
            carregarDocumentos(editingItem.id);
        } catch (error) {
            showNotification('error', 'Erro ao enviar documento');
        } finally {
            setUploadLoading(false);
        }

        return false;

    };

    const handleDownload = async (uuid, nome) => {

        try {

            const response = await downloadDocumento(editingItem.id, uuid);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');

            link.href = url;
            link.setAttribute('download', nome);
            
            document.body.appendChild(link);
            
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (error) {
            showNotification('error', 'Erro ao baixar documento');
        }

    };

    const handleDeleteDoc = async (uuid) => {

        try {
            await deleteDocumento(editingItem.id, uuid);
            showNotification('success', 'Documento excluído com sucesso!');
            carregarDocumentos(editingItem.id);
        } catch (error) {
            showNotification('error', 'Erro ao excluir documento');
        }

    };

    const handleDownloadAll = async () => {

        try {

            const response = await downloadAllDocumentos(editingItem.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');

            link.href = url;
            link.setAttribute('download', `documentos_processo_${editingItem.id}.zip`);
            
            document.body.appendChild(link);

            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (error) {
            showNotification('error', 'Erro ao baixar documentos');
        }

    };

    const handleAddTipoAcao = async () => {

        if (!novoTipoAcao.trim()) {
            showNotification('warning', 'Digite um nome para o tipo de ação');
            return;
        }

        try {
            const novo = await createTipoAcao(novoTipoAcao);
            setTiposAcao([...tiposAcao, { nome: novo.nome, isPadrao: false, id: novo.id }]);
            setTipoAcaoModalVisible(false);
            setNovoTipoAcao('');
            showNotification('success', 'Tipo de ação adicionado com sucesso!');
        } catch (error) {
            showNotification('error', error.response?.data?.error || 'Erro ao adicionar tipo de ação');
        }

    };

    const tabItems = [
        
        { key: 'dados', label: 'Dados do processo', children: (
            
            <div style={{ marginTop: 8 }}>
                
                <Row gutter={16}>
            
                    <Col span={8}>
                        
                        <Form.Item name="numeroProcesso" label="Nº do processo" rules={[{ required: true }]}>
                            <Input size="small" />
                        </Form.Item>
                    
                    </Col>
                    
                    <Col span={8}>
                        
                        <Form.Item name="status" label="Status">
                            <Select size="small" options={STATUS_PROCESSO_OPTIONS} />
                        </Form.Item>
                    
                    </Col>
                    
                    <Col span={8}>
                        
                        <Form.Item name="tipoCliente" label="Tipo de cliente">
                            
                            <Select size="small" options={[ { value: 'PF', label: 'PF' }, { value: 'PJ', label: 'PJ' }, ]}
                            
                            onChange={(value) => {
                                form.setFieldValue('clienteId', null);
                                form.setFieldValue('clienteNome', null);
                            }} />
                        
                        </Form.Item>

                    </Col>
                
                </Row>

                <Row gutter={16}>
                    
                    <Col span={16}>
                        
                        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.tipoCliente !== currentValues.tipoCliente}>
                            
                            {({ getFieldValue, setFieldValue }) => {
                                
                                const tipoCliente = getFieldValue('tipoCliente');
                                let currentOptions = [];
                                
                                if (tipoCliente === 'PF') {
                                    currentOptions = clientesOptions.pf.map(c => ({ value: c.id, label: c.nome }));
                                } else if (tipoCliente === 'PJ') {
                                    currentOptions = clientesOptions.pj.map(c => ({ value: c.id, label: c.nome }));
                                } else {
                                
                                    currentOptions = [
                                        ...clientesOptions.pf.map(c => ({ value: c.id, label: c.nome, type: 'PF' })), 
                                        ...clientesOptions.pj.map(c => ({ value: c.id, label: c.nome, type: 'PJ' }))
                                    ];
                                
                                }
    
                                return (
                                    
                                    <Form.Item name="clienteId" label="Cliente">
                                        
                                        <Select size="small" showSearch={{ filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }} placeholder="Selecione o cliente" loading={clientesOptions.pf.length === 0 && clientesOptions.pj.length === 0} options={currentOptions}
                                        
                                        onChange={(value, option) => {
                                            
                                            setFieldValue('clienteNome', option.label);
                                            
                                            if (!getFieldValue('tipoCliente') && option.type) {
                                                setFieldValue('tipoCliente', option.type);
                                            }
                                        
                                        }} />
                                    
                                    </Form.Item>

                                );

                            }}
                        
                        </Form.Item>
                        
                        <Form.Item name="clienteNome" hidden>
                            <Input size="small" />
                        </Form.Item>
                    
                    </Col>
                    
                    <Col span={8}>
                        
                        <Form.Item name="qualificacao" label="Qualificação">
                            <Select size="small" showSearch={{ optionFilterProp: "label", filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }} placeholder="Selecione ou pesquise a qualificação" options={QUALIFICACAO_OPTIONS} />
                        </Form.Item>
                    
                    </Col>

                </Row>

                <Row gutter={16}>
                    
                    <Col span={10}>
                        
                        <Form.Item name="tipoAcao" label="Tipo de ação">
                            
                            <Select size="small" showSearch placeholder="Selecione" options={tiposAcao.map(t => ({ value: t.nome, label: t.nome }))}
                            
                            popupRender={(menu) => (
                                
                                <>
                                    
                                    {menu}
                                    
                                    <div style={{ padding: 8, borderTop: '1px solid #f0f0f0' }}>
                                        <Button type="link" icon={<PlusOutlined />} onClick={() => setTipoAcaoModalVisible(true)} style={{ padding: 0 }}> Adicionar </Button>
                                    </div>
                            
                                </>
                            
                            )} />

                        </Form.Item>

                    </Col>
                    
                    <Col span={6}>
                        
                        <Form.Item name="prazoAberto" label="Prazo aberto?">
                            <Select size="small" options={[{ value: true, label: 'Sim' }, { value: false, label: 'Não' }]} />
                        </Form.Item>
                        
                    </Col>
                    
                    <Col span={8}>
                        
                        <Form.Item name="dataPrazo" label="Data do prazo">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                        </Form.Item>
                    
                    </Col>
                
                </Row>

                <Row gutter={16}>
                    
                    <Col span={12}>
                        
                        <Form.Item name="outroEnvolvido" label="Outro envolvido">
                            <Input size="small" />
                        </Form.Item>
                    
                    </Col>
                
                    <Col span={12}>
                        
                        <Form.Item name="qualificacaoOutro" label="Qualificação do outro">
                            <Select size="small" showSearch={{ optionFilterProp: "label", filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }} placeholder="Selecione ou pesquise a qualificação" options={QUALIFICACAO_OPTIONS} />
                        </Form.Item>
                    
                    </Col>
                
                </Row>
    
                <Row gutter={16}>
                    
                    <Col span={8}>
                        
                        <Form.Item name="valorCausa" label="Valor da causa">
                            <Input type="number" size="small" />
                        </Form.Item>
                    
                    </Col>
                
                    <Col span={8}>
                        
                        <Form.Item name="valorAcordoSentenca" label="Valor do acordo">
                            <Input type="number" size="small" />
                        </Form.Item>
                    
                    </Col>
                
                    <Col span={8}>
                        
                        <Form.Item name="honorariosPercentual" label="Honorários (%)">
                            <Input type="number" size="small" />
                        </Form.Item>
            
                    </Col>

                </Row>

                <Row gutter={16}>
                    
                    <Col span={8}>
                        
                        <Form.Item name="honorariosReais" label="Honorários (R$)">
                            <Input type="number" size="small" />
                        </Form.Item>
            
                    </Col>
        
                    <Col span={8}>
                        
                        <Form.Item name="sucumbencias" label="Sucumbências">
                            <Input size="small" />
                        </Form.Item>
            
                    </Col>
        
                    <Col span={8}>
    
                        <Form.Item name="fase" label="Fase">
                            <Select size="small" options={FASE_PROCESSO_OPTIONS} />
                        </Form.Item>
                    
                    </Col>
                
                </Row>
                
                <Row gutter={16}>
                    
                    <Col span={12}>
                
                        <Form.Item name="instancia" label="Instância">
                            <Select size="small" options={INSTANCIA_OPTIONS} />
                        </Form.Item>
    
                    </Col>

                    <Col span={12}>
                        
                        <Form.Item name="resultado" label="Resultado do processo">
                            <Select size="small" options={RESULTADO_PROCESSO_OPTIONS} />
                        </Form.Item>
            
                    </Col>
        
                </Row>

                <Row gutter={16}>
                    
                    <Col span={8}>
                        
                        <Form.Item name="comarca" label="Comarca">
                            <Input size="small" />
                        </Form.Item>
                
                    </Col>
        
                    <Col span={8}>
                        
                        <Form.Item name="vara" label="Vara">
                            <Input size="small" />
                        </Form.Item>
                    
                    </Col>
                
                    <Col span={8}>
            
                        <Form.Item name="dataInicio" label="Data do início">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                        </Form.Item>

                    </Col>
                
                </Row>
    
                <Row gutter={16}>
                    
                    <Col span={12}>
                
                        <Form.Item name="dataFim" label="Data do fim">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                        </Form.Item>
                    
                    </Col>
                
                    <Col span={12}>
            
                        <Form.Item name="linkProcesso" label="Link do processo">
                            <Input size="small" />
                        </Form.Item>
                
                    </Col>
                
                </Row>

                <Form.Item name="observacoes" label="Observações">
                    <TextArea rows={3} size="small" />
                </Form.Item>
            </div>
        )},

        { key: 'movimentacoes', label: 'Movimentações', children: (
            
            <div>
                
                {isEditMode && (
                    
                    <div style={{ marginBottom: 16, textAlign: 'right' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMov} size="small" style={{ background: '#4e0c1e' }}> Nova Movimentação </Button>
                    </div>
                
                )}
                    
                <Table loading={movLoading} dataSource={movimentacoes} rowKey="id" size="small" pagination={false} columns={[
                
                { title: 'Data', dataIndex: 'data', width: 120, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-', },
                { title: 'Movimentação', dataIndex: 'descricao', },
                
                { title: 'Ações', width: 100, render: (_, record) => (
                
                    <Space>
                        <Button type="link" icon={<EditOutlined />} onClick={() => handleEditMov(record)} style={{ color: '#8b1a4a' }} />
                        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => { Modal.confirm({ title: 'Excluir movimentação', content: 'Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: '#4e0c1e' }, danger: true }, centered: true, onOk: () => handleDeleteMov(record.id), }); }} />
                    </Space>

                ), }, ]} locale={{ emptyText: 'Nenhuma movimentação cadastrada' }} />
            
            </div>

        )},
        
        { key: 'documentos', label: 'Documentos', children: (
            
            <div>
                
                {isEditMode && (
                    
                    <div style={{ marginBottom: 16, textAlign: 'right' }}>
                        
                        <Space>
                            
                            {documentos.length > 0 && (
                                <Button icon={<DownloadOutlined />} onClick={handleDownloadAll} size="small"> Baixar todos </Button>
                            )}
                            
                            <Upload beforeUpload={handleUpload} showUploadList={false} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx">
                                <Button type="primary" icon={<UploadOutlined />} loading={uploadLoading} size="small" style={{ background: '#4e0c1e' }}> Enviar documento </Button>
                            </Upload>
                        
                        </Space>
                    
                    </div>

                )}
    
                <Table loading={docLoading} dataSource={documentos} rowKey="id" size="small" pagination={false} columns={[
                    
                    { title: 'Nome', dataIndex: 'nome', render: (text, record) => (
                        
                        <Space>
                            <FileOutlined style={{ color: '#4e0c1e' }} />
                            <span>{text}</span>
                        </Space>

                    ), },
                    
                    { title: 'Tamanho', dataIndex: 'tamanho', width: 100, render: (tamanho) => `${(tamanho / 1024).toFixed(2)} KB`, },
                    { title: 'Data do upload', dataIndex: 'uploadedAt', width: 150, render: (text) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '-', },
                    { title: 'Ações', width: 100, render: (_, record) => (
                        
                        <Space>
                            <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(record.id, record.nome)} style={{ color: '#8b1a4a' }} />
                            {isEditMode && ( <Button type="link" danger icon={<DeleteOutlined />} onClick={() => { Modal.confirm({ title: 'Excluir documento', content: 'Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: '#4e0c1e' }, danger: true }, centered: true, onOk: () => handleDeleteDoc(record.id), }); }} /> )}
                        </Space>
                        
                    ), },

                ]} locale={{ emptyText: 'Nenhum documento anexado' }} />
            
            </div>

        )}

    ];

    const columns = [
        
        { title: 'ID', dataIndex: 'id', width: 70 },
        
        { title: 'Nº do processo', dataIndex: 'numeroProcesso', render: (text, record) => ( 
            <Button type="link" style={{ padding: 0, color: '#4e0c1e' }} onClick={() => handleViewDetails(record)}> {text} </Button> 
        )},

        { title: 'Status', dataIndex: 'status', width: 100, render: (text) => {
            const valorReal = text?.descricao || text;
            const encontrado = STATUS_PROCESSO_OPTIONS.find(o => o.value === valorReal || o.label === valorReal);
            return encontrado ? encontrado.label : (valorReal || '-');
        }},

        { title: 'Cliente', dataIndex: 'clienteNome', width: 150 },
        { title: 'Tipo de cliente', dataIndex: 'tipoCliente', width: 100 },
        { title: 'Valor da causa', dataIndex: 'valorCausa', width: 120, render: (value) => value ? `R$ ${value.toLocaleString('pt-BR')}` : '-' },
        
        { title: 'Fase', dataIndex: 'fase', width: 120, render: (text) => {
            const valorReal = text?.descricao || text;
            const encontrado = FASE_PROCESSO_OPTIONS.find(o => o.value === valorReal || o.label === valorReal);
            return encontrado ? encontrado.label : (valorReal || '-');
        }},

        { title: 'Prazo', dataIndex: 'dataPrazo', width: 100, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        
        { title: '', width: 60, fixed: 'right', render: (_, record) => ( 
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#8b1a4a' }} /> 
        ),},
        
    ];
    
    return (
    
    <div style={{ padding: 16 }}>
        
        <Card size="small">
            
            <Row gutter={[12, 12]} justify="space-between" align="middle">
                
                <Col xs={24} md={16}>
                    
                    <Space wrap>
                        
                        <Input placeholder="Buscar por nº processo ou cliente" value={searchText} onChange={(e) => setSearchText(e.target.value)} onPressEnter={() => setPagination({ ...pagination, current: 1 })} style={{ width: 250 }} prefix={<SearchOutlined />} />
                        <Select placeholder="Status" allowClear style={{ width: 120 }} value={filtroStatus} onChange={setFiltroStatus} options={STATUS_PROCESSO_OPTIONS} />
                        
                        <Select placeholder="Tipo de cliente" allowClear style={{ width: 120 }} value={filtroTipoCliente} onChange={setFiltroTipoCliente}
                        
                        options={[
                            { value: 'PF', label: 'Pessoa Física' },
                            { value: 'PJ', label: 'Pessoa Jurídica' },
                        ]} />
                        
                        <Select placeholder="Prazo aberto?" allowClear style={{ width: 120 }} value={filtroPrazoAberto} onChange={setFiltroPrazoAberto}
                        
                        options={[
                            { value: 'SIM', label: 'Sim' },
                            { value: 'NAO', label: 'Não' },
                        ]} />
                        
                        <Select placeholder="Fase" allowClear style={{ width: 150 }} value={filtroFase} onChange={setFiltroFase} options={FASE_PROCESSO_OPTIONS} />
                        
                        <Button onClick={() => {
                            setSearchText('');
                            setFiltroStatus(null);
                            setFiltroTipoCliente(null);
                            setFiltroPrazoAberto(null);
                            setFiltroFase(null);
                            setPagination({ ...pagination, current: 1 });
                        }} icon={<ReloadOutlined />}> Limpar </Button>

                    </Space>
                
                </Col>
                
                <Col>
                    <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#4e0c1e' }}> Novo processo </Button>
                </Col>
            
            </Row>
            
            <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} onChange={(pagination) => setPagination({ ...pagination, current: pagination.current })} scroll={{ x: 1000 }} size="small" style={{ marginTop: 16 }} />
                
            <div style={{ marginTop: 16, textAlign: 'right', fontWeight: 'bold' }}>
                Total: {pagination.total} processo{pagination.total !== 1 ? 's' : ''}
            </div>

        </Card>

        <Modal title={editingItem ? (isEditMode ? 'Editar processo' : 'Visualizar processo') : 'Novo processo'} open={modalVisible} width={900} onOk={handleModalOk} onCancel={handleCancelModal} okButtonProps={{ style: { background: '#4e0c1e' }, loading: modalLoading }} okText={isEditMode ? (editingItem ? 'Salvar' : 'Criar') : 'Fechar'} cancelText="Cancelar" confirmLoading={modalLoading} mask={{ closable: false }}
        
        footer={
            
            !editingItem ? [
                <Button key="cancel" onClick={handleCancelModal}> Cancelar </Button>,
                <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}> Salvar </Button>,
            ] : isEditMode ? [
                
                <Button key="cancel" onClick={() => {
                    
                    setIsEditMode(false);
                    
                    if (editingItem) {
                        
                        form.setFieldsValue({
                            ...editingItem,
                            tipoAcao: formatarTipoAcao(editingItem.tipoAcao),
                            dataInicio: editingItem.dataInicio ? dayjs(editingItem.dataInicio) : null,
                            dataFim: editingItem.dataFim ? dayjs(editingItem.dataFim) : null,
                            dataPrazo: editingItem.dataPrazo ? dayjs(editingItem.dataPrazo) : null,
                        });
                    
                    }
                    
                }}> Cancelar </Button>,
                
                <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: '#4e0c1e' }}> Salvar </Button>,
            
            ] : [
                <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: '#4e0c1e' }}> <EditOutlined /> Editar informações </Button>,
                <Button key="delete" danger onClick={() => { Modal.confirm({ title: 'Excluir processo', content: 'Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: '#4e0c1e' }, danger: true }, centered: true, onOk: handleDelete, }); }}> <DeleteOutlined /> Excluir </Button>,
            ]
        
        }>
            
            <Form form={form} layout="vertical" disabled={!isEditMode}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
            </Form>
        
        </Modal>

        <Modal title="Adicionar tipo de ação" open={tipoAcaoModalVisible} onOk={handleAddTipoAcao} onCancel={() => setTipoAcaoModalVisible(false)} okButtonProps={{ style: { background: '#4e0c1e' } }} mask={{ closable: false }}>
            <Input placeholder="Digite o nome do novo tipo de ação" value={novoTipoAcao} onChange={(e) => setNovoTipoAcao(e.target.value)} onPressEnter={handleAddTipoAcao} />
        </Modal>

        <Modal title={editingMov ? 'Editar movimentação' : 'Nova movimentação'} open={movModalVisible} onOk={handleMovModalOk} onCancel={() => setMovModalVisible(false)} okButtonProps={{ style: { background: '#4e0c1e'} }} width={500} mask={{ closable: false }}>
            
            <Form form={movForm} layout="vertical" size="small">
                
                <Form.Item name="data" label="Data" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                </Form.Item>
                
                <Form.Item name="descricao" label="Movimentação" rules={[{ required: true }]}>
                    <TextArea rows={4} size="small" />
                </Form.Item>
                
            </Form>
        
        </Modal>

    </div>
    );
}

export default ProcessosLista;
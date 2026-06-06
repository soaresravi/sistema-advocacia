import { useState, useEffect } from "react";
import { Card, Form, Input, Button, Space, Typography, Alert, Spin, Progress, Row, Col, Statistic, Modal, Table, Upload } from 'antd';
import { GoogleOutlined, CloudUploadOutlined, DisconnectOutlined, CheckCircleOutlined, DownloadOutlined, UploadOutlined, DeleteOutlined, ExclamationCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { getCurrentUser, updatePerfil, alterarSenha, getGoogleStatus, disconnectGoogle, getAuthUrl, getEspacoArmazenamento } from '../services/configService';

import api from '../services/api';
import dayjs from 'dayjs';
import '../components/Layout/AppLayout.css';

const { Text } = Typography;

function Configuracoes() {

    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleEmail, setGoogleEmail] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);
    const [storage, setStorage] = useState({ total: 0, usado: 0, livre: 0, percentual: 0 });

    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsPagination, setLogsPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [backupLoading, setBackupLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);

    const [perfilForm] = Form.useForm();
    const [senhaForm] = Form.useForm();

    const showNotification = (type, message) => {
        Modal[type === 'success' ? 'success' : 'error']({ content: message, centered: true });
    };

    useEffect(() => {
        carregarDados();
    }, []);

    useEffect(() => {
        carregarLogs();
    }, []);

    const exportarCSV = async (entidade) => {
        
        try {
            
            const response = await api.get(`/backup/exportar/${entidade}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
            const link = document.createElement('a');
            
            link.href = url;
            link.setAttribute('download', `${entidade}_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            showNotification('success', `Exportação de ${entidade} concluída!`);
        
        } catch (error) {
            showNotification('error', 'Erro ao exportar dados');
        }
        
    };

    const carregarLogs = async (page = 0, size = 10) => {
        
        setLogsLoading(true);
        
        try {
            
            const response = await api.get('/logs', { params: { page, size } });
            setLogs(response.data.content);
            
            setLogsPagination({
                current: response.data.page + 1,
                pageSize: response.data.size,
                total: response.data.total,
            });

        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        } finally {
            setLogsLoading(false);
        }

    };
    
    const limparLogsAntigos = async () => {
       
        try {
            await api.delete('/logs/limpar', { params: { dias: 30 } });
            showNotification('success', 'Logs antigos removidos com sucesso!');
            carregarLogs();
        } catch (error) {
            showNotification('error', 'Erro ao limpar logs');
        }

    };
    
    const fazerBackup = async () => {
        
        setBackupLoading(true);
        
        try {
            
            const response = await api.get('/backup/download', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            
            link.href = url;
            link.setAttribute('download', `backup_${new Date().toISOString().slice(0, 19)}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            showNotification('success', 'Backup gerado com sucesso!');
        
        } catch (error) {
            showNotification('error', 'Erro ao gerar backup');
        } finally {
            setBackupLoading(false);
        }

    };
    
    const restaurarBackup = async (file) => {
       
        setRestoreLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            showNotification('success', 'Backup restaurado com sucesso!');
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            showNotification('error', 'Erro ao restaurar backup');
        } finally {
            setRestoreLoading(false);
        }

        return false;

    };

    const handleDeleteConta = async () => {
        
        let senha = '';
        
        Modal.confirm({ title: 'Excluir conta permanentemente', icon: <ExclamationCircleOutlined />, content: (
            
            <div>
                
                <p style={{ color: 'red', fontWeight: 'bold'}}> ATENÇÃO: Esta ação é irreversível! </p>
                <p>Todos os seus dados serão permanentemente excluídos:</p>
            
                <ul style={{ textAlign: 'left', marginLeft: 20 }}>
                    <li>Clientes (PF e PJ)</li>
                    <li>Processos e movimentações</li>
                    <li>Tarefas</li>
                    <li>Recebimentos e despesas</li>
                    <li>Atendimentos</li>
                    <li>Audiências e perícias</li>
                    <li>Documentos anexados</li>
                    <li>Logs de atividades</li>
                    <li>Backups</li>
                </ul>
    
                <p style={{ marginTop: 16 }}>Digite sua senha para confirmar a exclusão:</p>
                <Input.Password placeholder="Sua senha" onChange={(e) => senha = e.target.value} style={{ marginBottom: 10 }} />
            
            </div>
        ), okText: 'Sim, excluir minha conta', cancelText: 'Cancelar', okButtonProps: { danger: true, style: { background: '#ff4d4f' } }, centered: true, width: 500,
        
        onOk: async () => {
            
            if (!senha) {
                Modal.error({ content: 'Digite sua senha para confirmar a exclusão', centered: true });
                return;
            }
                
            setLoading(true);
        
            try {
    
                await api.delete('/auth/conta', { data: { senha } });
                Modal.success({ content: 'Conta excluída com sucesso!', centered: true });
                localStorage.removeItem('token');
                localStorage.removeItem('user');
        
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            
            } catch (error) {
                Modal.error({ content: error.response?.data?.message || 'Erro ao excluir conta', centered: true });
            } finally {
                setLoading(false);
            }

        }});

    };

    const carregarDados = async () => {

        setLoading(true);

        try {

            const [userData, googleStatus, storageData] = await Promise.all([
                getCurrentUser(),
                getGoogleStatus().catch(() => ({ connected: false, email: null })),
                getEspacoArmazenamento().catch(() => ({ total: 0, usado: 0, livre: 0, percentual: 0 }))
            ]);

            setUser(userData);
            setGoogleConnected(googleStatus.connected);
            setGoogleEmail(googleStatus.email);

            setStorage({
                total: storageData.total,
                usado: storageData.usado,
                livre: storageData.livre,
                percentual: storageData.percentual || 0
            });

            perfilForm.setFieldsValue({
                nome: userData.nome,
                email: userData.email,
                nomeEscritorio: userData.nomeEscritorio
            });

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }

    };

    const handleUpdatePerfil = async (values) => {

        setLoading(true);

        try {
            await updatePerfil(values);
            await carregarDados();
            Modal.success({ content: 'Perfil atualizado com sucesso!', centered: true });
        } catch (error) {
            Modal.error({ content: error.response?.data?.message || 'Erro ao atualizar perfil', centered: true });
        } finally {
            setLoading(false);
        }

    };

    const handleAlterarSenha = async (values) => {

        if (values.novaSenha !== values.confirmarSenha) {
            Modal.error({ content: 'As senhas não coincidem', centered: true });
            return;
        }

        setLoading(true);

        try {

            await alterarSenha({
                senhaAtual: values.senhaAtual,
                novaSenha: values.novaSenha,
                confirmarSenha: values.confirmarSenha
            });

            senhaForm.resetFields();
            Modal.success({ content: 'Senha alterada com sucesso!', centered: true });
        
        } catch (error) {
            Modal.error({ content: error.response?.data?.message || 'Erro ao alterar senha', centered: true });
        } finally {
            setLoading(false);
        }

    };

    const handleConnectGoogle = async () => {

        setGoogleLoading(true);

        try {

            const response = await getAuthUrl();
            const googleWindow = window.open(response.url, '_blank');

            const interval = setInterval(() => {
                
                if (googleWindow && googleWindow.closed) {
                    clearInterval(interval);
                    carregarDados();
                    Modal.success({ content: 'Google Agenda conectado com sucesso!', centered: true });
                }

            }, 500);

            setTimeout(() => {
                clearInterval(interval); 
            }, 300000);

        } catch (error) {
            Modal.error({ content: 'Erro ao conectar com Google', centered: true });
        } finally {
            setGoogleLoading(false);
        }

    };

    const handleDisconnectGoogle = async () => {

        Modal.confirm({ title: 'Desconectar Google Agenda', content: 'Tem certeza que deseja desconectar sua conta do Google? Os eventos não serão mais sincronizados.', okText: 'Sim, desconectar', cancelText: 'Cancelar', okButtonProps: { danger: true, style: { background: '#4e0c1e' } }, centered: true,

        onOk: async () => {

            try {
                await disconnectGoogle();
                await carregarDados();
                Modal.success({ content: 'Google Agenda desconectado!', centered: true });
            } catch (error) {
                Modal.error({ content: 'Erro ao desconectar', centered: true });
            }
            
        } });

    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading && !user) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }

    return (
    
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        
        <Card title={<span style={{ color: '#4e0c1e' }}> Perfil </span>} style={{ marginBottom: 24 }}>
    
            <Form form={perfilForm} layout="vertical" onFinish={handleUpdatePerfil}>

                <Form.Item name="nome" label="Nome completo" rules={[{ required: true }]}>
                    <Input size="large" />
                </Form.Item>
            
                <Form.Item name="email" label="E-mail" rules={[{ required: true, type: 'email' }]}>
                    <Input size="large" />
                </Form.Item>

                <Form.Item name="nomeEscritorio" label="Nome do escritório">
                    <Input size="large" />
                </Form.Item>
            
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#4e0c1e' }}> Salvar alterações </Button>
                </Form.Item>
            
            </Form>
        
        </Card>

        <Card title={<span style={{ color: '#4e0c1e' }}>Segurança </span>} style={{ marginBottom: 24 }}>
            
            <Form form={senhaForm} layout="vertical" onFinish={handleAlterarSenha}>
        
                <Form.Item name="senhaAtual" label="Senha atual" rules={[{ required: true }]}>
                    <Input.Password size="large" />
                </Form.Item>
                
                <Form.Item name="novaSenha" label="Nova senha" rules={[{ required: true, min: 6 }]}>
                    <Input.Password size="large" />
                </Form.Item>
    
                <Form.Item name="confirmarSenha" label="Confirmar nova senha" rules={[{ required: true }]}>
                    <Input.Password size="large" />
                </Form.Item>
            
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#4e0c1e' }}> Alterar senha </Button>
                </Form.Item>
            
            </Form>
        
        </Card>

        <Card title={<span style={{ color: '#4e0c1e' }}><GoogleOutlined /> Google Agenda </span>} style={{ marginBottom: 24 }}>
            
            {googleConnected ? (
                
                <Space orientation="vertical" style={{ width: '100%' }}>
                    <Alert title="Conectado" type="success" icon={<CheckCircleOutlined />} showIcon />
                    <Button danger icon={<DisconnectOutlined />} onClick={handleDisconnectGoogle} loading={googleLoading}> Desconectar Google Agenda </Button>
                </Space>
                
            ) : (
                
                <Space orientation="vertical" style={{ width: '100%' }}>
                    <Alert title="Não conectado" description="Conecte sua conta do Google para sincronizar automaticamente tarefas, audiências e perícias." type="warning" showIcon />
                    <Button type="primary" icon={<GoogleOutlined />} onClick={handleConnectGoogle} loading={googleLoading} style={{ background: '#4e0c1e', borderColor: '#4e0c1e' }}> Conectar Google Agenda </Button>
                </Space>
            )}
        
        </Card>

        <Card title={<span style={{ color: '#4e0c1e' }}><CloudUploadOutlined /> Armazenamento</span>}>
            
            <Row gutter={[16, 16]}>
        
                <Col span={8}>
                    <Statistic title="Espaço total" value={formatBytes(storage.total)} />
                </Col>
                
                <Col span={8}>
                    <Statistic title="Espaço usado" value={formatBytes(storage.usado)} />
                </Col>
    
                <Col span={8}>
                    <Statistic title="Espaço livre" value={formatBytes(storage.livre)} />
                </Col>
            
            </Row>
        
            <div style={{ marginTop: 16 }}>
                <Progress percent={storage.percentual} status={storage.percentual > 90 ? 'exception' : storage.percentual > 70 ? 'active' : 'success'} strokeColor="#4e0c1e" />
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}> {storage.percentual}% utilizado - Limite de 50 GB </Text>
            </div>
        
        </Card>

        <Card title={<span style={{ color: '#4e0c1e' }}>Log de atividades</span>} style={{ marginBottom: 24, marginTop: 24 }}>
            
            <Table dataSource={logs} rowKey="id" loading={logsLoading} pagination={logsPagination} onChange={(pagination) => carregarLogs(pagination.current - 1, pagination.pageSize)} size="small" columns={[
                
                { title: 'Data/Hora', dataIndex: 'createdAt', width: 160, render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm:ss') },
                { title: 'Ação', dataIndex: 'acao', width: 100 },
                { title: 'Entidade', dataIndex: 'entidade', width: 120 },
                { title: 'Descrição', dataIndex: 'descricao', ellipsis: true },
            ]} />
            
            <div style={{ marginTop: 16, textAlign: 'right' }}>    
                <Button size="small" onClick={() => Modal.confirm({ title: 'Limpar logs antigos', content: 'Deseja remover logs com mais de 30 dias?', onOk: limparLogsAntigos })}> Limpar logs antigos </Button>
            </div>
        
        </Card>
        
        <Card title={<span style={{ color: '#4e0c1e' }}>Backup e restauração</span>}>
            
            <Row gutter={16}>
                
                <Col span={12}>
                    
                    <div style={{ textAlign: 'center', padding: 20 }}>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={fazerBackup} loading={backupLoading} style={{ background: '#4e0c1e', marginBottom: 16 }}> Baixar backup </Button>
                        <p style={{ fontSize: 12, color: '#666' }}> Exporta todos os seus dados (clientes, processos, finanças, etc.) em um arquivo ZIP. </p>
                    </div>
                
                </Col>
                
                <Col span={12}>
                    
                    <div style={{ textAlign: 'center', padding: 20 }}>
                        
                        <Upload accept=".zip" showUploadList={false} beforeUpload={restaurarBackup} customRequest={() => {}}>
                            <Button icon={<UploadOutlined />} style={{ borderColor: '#faad14', color: '#faad14', marginBottom: 16 }} loading={restoreLoading}> Restaurar backup </Button>
                        </Upload>
                        
                        <p style={{ fontSize: 12, color: '#666' }}> Restaura dados a partir de um backup anterior. <strong>Cuidado:</strong> substitui dados atuais! </p>
                    
                    </div>
                
                </Col>
            
            </Row>
        </Card>

        <Card title={<span style={{ color: '#4e0c1e' }}>Exportar dados (CSV)</span>} style={{ marginTop: 24 }}>
            
            <Row gutter={16}>
                
                <Col span={8}>
                    <Button icon={<FileTextOutlined />} onClick={() => exportarCSV('clientes')} style={{ width: '100%' }}> Clientes </Button>
                </Col>
                
                <Col span={8}>
                    <Button icon={<FileTextOutlined />} onClick={() => exportarCSV('processos')} style={{ width: '100%' }}> Processos </Button>
                </Col>
                
                <Col span={8}>
                    <Button icon={<FileTextOutlined />} onClick={() => exportarCSV('financeiro')} style={{ width: '100%' }}> Financeiro </Button>
                </Col>
            
            </Row>
            
            <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}> Exporta os dados em formato CSV para abrir no Excel ou Google Sheets </Text>
            </div>
        
        </Card>
        
        <div style={{ marginTop: 24, backgroundColor: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
            <Button danger icon={<DeleteOutlined />} onClick={handleDeleteConta} loading={loading} size="large" style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: '#fff', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}> Excluir minha conta </Button> 
            <p style={{ fontSize: 12, color: '#ff4d4f', marginTop: 12, marginBottom: 0, fontWeight: 500 }}> ATENÇÃO: Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos. </p>
        </div>
    
    </div>
    );
}

export default Configuracoes;
import { useState } from 'react';
import { Form, Input, Button, Card, Tabs, Row, Col, notification } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../../services/api';
import './Login.css';

function Login({ onLogin }) {
    
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');

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

    const handleLogin = async (values) => {

        setLoading(true);

        try {

            const response = await api.post('/auth/login', {
                email: values.email,
                senha: values.password,
            });

            localStorage.setItem('token', response.data.token);
            
            localStorage.setItem('user', JSON.stringify({
                id: response.data.userId,
                nome: response.data.nome,
                email: response.data.email,
            }));

            showNotification('success', 'Login realizado! Bem-vindo(a) de volta!');
            onLogin(true);

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao fazer login');
        } finally {
            setLoading(false)
        }

    };

    const handleRegister = async (values) => {

        if (values.password !== values.confirmPassword) {
            showNotification('error', 'As senhas não coincidem');
            return;
        }

        setLoading(true);

        try {

            await api.post('/auth/register', {
                nome: values.nome,
                email: values.email,
                senha: values.password,
                nomeEscritorio: values.nomeEscritorio,
            });

            localStorage.setItem('token', response.data.token);

            localStorage.setItem('user', JSON.stringify({
                id: response.data.userId,
                nome: response.data.nome,
                email: response.data.email,
            }));

            showNotification('success', 'Cadastro realizado com sucesso!');
            onLogin(true);

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao cadastrar');
        } finally {
            setLoading(false);
        }

    };

    return (

        <div className="login-container">
            <div className="login-overlay">

                <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
                    <Col xs={22} sm={18} md={14} lg={10} xl={8}>
                        
                        <Card className="login-card">

                            <div className="login-avatar">
                                <div className="avatar-circle"> <UserOutlined style={{ fontSize: 48, color: '#fff' }} /> </div>
                            </div>

                            <Tabs activeKey={activeTab} onChange={setActiveTab} className="login-tabs" items={[
                                
                                { key: 'login', label: <span className="tab-label"> Entrar </span>, children: (
                                    
                                    <Form onFinish={handleLogin} layout="vertical" className="login-form">
                                        
                                        <Form.Item name="email" rules={[{ required: true, message: 'E-mail é obrigatório' }, { type: 'email', message: 'E-mail inválido' }]}>
                                            <Input prefix={<MailOutlined className="input-icon" /> } placeholder="E-mail" size="large" className="login-input" />
                                        </Form.Item>

                                        <Form.Item name="password" rules={[{ required: true, message: "Senha é obrigatória" }]}>
                                            <Input.Password prefix={<LockOutlined className="input-icon" /> } placeholder="Senha" size="large" className="login-input" />
                                        </Form.Item>

                                        <Form.Item>
                                            <Button type="primary" htmlType="submit" loading={loading} block size="large" className="login-button"> Entrar </Button>
                                        </Form.Item>

                                    </Form>

                                )},

                                { key: 'register', label: <span className="tab-label"> Cadastrar </span>, children: (

                                    <Form onFinish={handleRegister} layout="vertical" className="login-form">

                                        <Form.Item name="nome" rules={[{ required: true, message: 'Nome é obrigatório' }]}>
                                            <Input prefix={<UserOutlined className="input-icon" />} placeholder="Nome completo" size="large" className="login-input" />
                                        </Form.Item>

                                        <Form.Item name="email" rules={[{ required: true, message: 'E-mail é obrigatório' }, { type: 'email', message: 'E-mail inválido' }]}>
                                            <Input prefix={<MailOutlined className="input-icon" />} placeholder="E-mail" size="large" className="login-input" />
                                        </Form.Item>

                                        <Form.Item name="password" rules={[{ required: true, message: 'Senha é obrigatória', min: 6 }]}>
                                            <Input.Password prefix={<LockOutlined className="input-icon" />} placeholder="Senha" size="large" className="login-input" />
                                        </Form.Item>

                                        <Form.Item name="confirmPassword" dependencies={['password']} rules={[{ required: true, message: 'Confirme sua senha' }, ({ getFieldValue }) => ({ validator(_, value) {
                                            
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }

                                            return Promise.reject(new Error('As senhas não coincidem'));

                                        },}),]}>

                                            <Input.Password prefix={<LockOutlined className="input-icon" /> } placeholder="Confirmar senha" size="large" className="login-input" />
                                        
                                        </Form.Item>

                                        <Form.Item name="nomeEscritorio">
                                            <Input prefix={<PhoneOutlined className="input-icon" />} placeholder="Nome do escritório (opcional)" size="large" className="login-input" />
                                        </Form.Item>

                                        <Form.Item>
                                            <Button type="primary" htmlType="submit" loading={loading} block size="large" className="login-button"> Cadastrar </Button>
                                        </Form.Item>

                                    </Form>

                                )}
                            ]}
                        /> </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default Login;
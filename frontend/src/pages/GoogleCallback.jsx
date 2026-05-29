import { useState, useEffect } from 'react';
import { Result, Button, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutlined } from '@ant-design/icons';

function GoogleCallback() {

    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('success');

    useEffect(() => {
        
        const urlParams = new URLSearchParams(window.location.search);
        const googleStatus = urlParams.get('google');

        if (googleStatus === 'success') {
            setStatus('success');
        } else if (googleStatus === 'error') {
            setStatus('error');
        }

        setLoading(false);

        const timer = setTimeout(() => {
            window.close();
            navigate('/configuracoes');
        }, 3000);

        return () => clearTimeout(timer);

    }, [navigate]);

    if (loading) {
        
        return (
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>

        );

    }

    if (status === 'success') {
        
        return (
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                
                <Result status="success" title="Permissão concedida!" subTitle="Sua conta do Google foi conectada com sucesso. Agora você pode fechar esta janela e tentar salvar novamente." extra={[
                    <Button type="primary" key="close" onClick={() => window.close()} style={{ background: '#4e0c1e' }}> Fechar esta janela </Button>,
                ]} />

            </div>

        );

    }

    return (
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            
            <Result status="error" title="Erro na conexão" subTitle="Ocorreu um erro ao conectar sua conta do Google. Tente novamente." extra={[
                <Button type="primary" key="close" onClick={() => window.close()} style={{ background: '#4e0c1e' }}> Fechar </Button>,
            ]} />

        </div>

    );
}

export default GoogleCallback;
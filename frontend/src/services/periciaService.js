import api from './api';

export const getPericias = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters };
    const response = await api.get('/pericias', { params });
    return response.data;
};

export const getPericiaById = async (id) => {
    const response = await api.get(`/pericias/${id}`);
    return response.data;
};

export const createPericia = async (data) => {
    const response = await api.post('/pericias', data);
    return response.data;
};

export const updatePericia = async (id, data) => {
    const response = await api.put(`/pericias/${id}`, data);
    return response.data;
};

export const deletePericia = async (id) => {
    await api.delete(`/pericias/${id}`);
};

export const getPericiasDashboard = async () => {
    const response = await api.get('/pericias/dashboard');
    return response.data;
};

export const getPericiasHoje = async () => {
    const response = await api.get('/pericias/hoje');
    return response.data;
};

export const getPericiasProximos = async () => {
    const response = await api.get('/pericias/proximos');
    return response.data;
};

export const getGoogleStatus = async () => {
    const response = await api.get('/auth/google/status');
    return response.data;
};

export const getProcessosOptions = async () => {

    const response = await api.get('/processos?size=1000');

    return response.data.content.map(p => ({
        id: p.id,
        numero: p.numeroProcesso,
        cliente: p.clienteNome
    }));

};
import api from './api';

export const getAtendimentos = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters };
    const response = await api.get('/atendimentos', { params });
    return response.data;
};

export const getAtendimentoById = async (id) => {
    const response = await api.get(`/atendimentos/${id}`);
    return response.data;
};

export const createAtendimento = async (data) => {
    const response = await api.post('/atendimentos', data);
    return response.data;
};

export const updateAtendimento = async (id, data) => {
    const response = await api.put(`/atendimentos/${id}`, data);
    return response.data;
};

export const deleteAtendimento = async (id) => {
    await api.delete(`/atendimentos/${id}`);
};

export const getAtendimentosDashboard = async (ano) => {
    const response = await api.get('/atendimentos/dashboard', { params: { ano } });
    return response.data;
};

export const getContatosHoje = async () => {
    const response = await api.get('/atendimentos/contatos/hoje');
    return response.data;
};

export const getGoogleStatus = async () => {
    const response = await api.get('/auth/google/status');
    return response.data;
};
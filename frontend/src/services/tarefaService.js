import api from './api';

export const getTarefas = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters };
    const response = await api.get('/tarefas', { params });
    return response.data;
};

export const getTarefaById = async (id) => {
    const response = await api.get(`/tarefas/${id}`);
    return response.data;
};

export const createTarefa = async (data) => {
    const response = await api.post('/tarefas', data);
    return response.data;
};

export const updateTarefa = async (id, data) => {
    const response = await api.put(`/tarefas/${id}`, data);
    return response.data;
};

export const deleteTarefa = async (id) => {
    await api.delete(`/tarefas/${id}`);
};

export const getTarefasAtrasadas = async () => {
    const response = await api.get('/tarefas/alertas/atrasadas');
    return response.data;
};

export const getTarefasDashboard = async (ano) => {
    const response = await api.get('/tarefas/dashboard', { params: { ano } });
    return response.data;
};

export const getGoogleStatus = async () => {
    const response = await api.get('/auth/google/status');
    return response.data;
};
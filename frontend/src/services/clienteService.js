import api from './api';

export const getClientesPF = async (page = 0, size = 10, search = '') => {
    const response = await api.get('/clientes/pf', { params: { page, size, search } });
    return response.data;
};

export const getClientePFById = async (id) => {
    const response = await api.get(`/clientes/pf/${id}`);
    return response.data;
};

export const createClientePF = async (data) => {
    const response = await api.post('/clientes/pf', data);
    return response.data;
};

export const updateClientePF = async (id, data) => {
    const response = await api.put(`/clientes/pf/${id}`, data);
    return response.data;
};

export const deleteClientePF = async (id) => {
    await api.delete(`/clientes/pf/${id}`);
};

export const getDashboardPF = async () => {
    const response = await api.get('/clientes/pf/dashboard');
    return response.data;
};

export const getClientesPJ = async (page = 0, size = 10, search = '') => {
    const response = await api.get('/clientes/pj', { params: { page, size, search } });
    return response.data;
};

export const getClientePJById = async (id) => {
    const response = await api.get(`/clientes/pj/${id}`);
    return response.data;
};

export const createClientePJ = async (data) => {
    const response = await api.post('/clientes/pj', data);
    return response.data;
};

export const updateClientePJ = async (id, data) => {
    const response = await api.put(`/clientes/pj/${id}`, data);
    return response.data;
};

export const deleteClientePJ = async (id) => {
    await api.delete(`/clientes/pj/${id}`);
};

export const getDashboardPJ = async () => {
    const response = await api.get('/clientes/pj/dashboard');
    return response.data;
};

export const getAniversariantes = async (mes) => {
    const response = await api.get('/clientes/pf/aniversariantes', { params: { mes } });
    return response.data;
};

export const getAniversariantesHoje = async () => {
    const response = await api.get('/clientes/pf/aniversariantes/hoje');
    return response.data;
};

export const buscarCep = async (cep) => {
    const response = await api.get(`/public/cep/${cep}`);
    return response.data;
};

export const buscarCidades = async (uf) => {
    const response = await api.get(`/public/cidades/${uf}`);
    return response.data;
};

export const buscarEstados = async () => {
    const response = await api.get('/public/estados');
    return response.data;
};
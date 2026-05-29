import api from './api';

export const getProcessos = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters, };
    const response = await api.get('/processos', { params });
    return response.data;
};

export const getProcessoById = async (id) => {
    const response = await api.get(`/processos/${id}`);
    return response.data;
};

export const createProcesso = async (data) => {
    const response = await api.post('/processos', data);
    return response.data;
};

export const updateProcesso = async (id, data) => {
    const response = await api.put(`/processos/${id}`, data);
    return response.data;
};

export const deleteProcesso = async (id) => {
    await api.delete(`/processos/${id}`);
};

export const getProcessosDashboard = async () => {
    const response = await api.get('processos/dashboard');
    return response.data;
};

export const getMovimentacoes = async (processoId) => {
    const response = await api.get(`/processos/${processoId}/movimentacoes`);
    return response.data;
};

export const createMovimentacao = async (processoId, data) => {
    const response = await api.post(`/processos/${processoId}/movimentacoes`, data);
    return response.data;
};

export const updateMovimentacao = async (processoId, movId, data) => {
    const response = await api.put(`/processos/${processoId}/movimentacoes/${movId}`, data);
    return response.data;
};

export const deleteMovimentacao = async (processoId, movId) => {
    await api.delete(`/processos/${processoId}/movimentacoes/${movId}`);
};

export const getDocumentos = async (processoId) => {
    const response = await api.get(`/processos/${processoId}/documentos`);
    return response.data;
};

export const uploadDocumento = async (processoId, file) => {

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/processos/${processoId}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;

};

export const deleteDocumento = async (processoId, uuid) => {
    await api.delete(`/processos/${processoId}/documentos/${uuid}`);
};

export const downloadDocumento = async (processoId, uuid) => {

    const response = await api.get(`/processos/${processoId}/documentos/${uuid}/download`, {
        responseType: 'blob',
    });

    return response;

};

export const downloadAllDocumentos = async (processoId) => {

    const response = await api.get(`/processos/${processoId}/documentos/download-all`, {
        responseType: 'blob',
    });

    return response;

};

export const getPrazosHoje = async () => {
    const response = await api.get('/processos/prazos/hoje');
    return response.data;
};

export const getPrazosProximos = async () => {
    const response = await api.get('/processos/prazos/proximos');
    return response.data;
};

export const getCalendarioPrazos = async () => {
    const response = await api.get('/processos/prazos/calendario');
    return response.data;
};

export const getTiposAcao = async () => {
    const response = await api.get('/config/tipos-acao');
    return response.data;
};

export const createTipoAcao = async (nome) => {
    const response = await api.post('/config/tipos-acao', { nome });
    return response.data;
};

export const deleteTipoAcao = async (id) => {
    await api.delete(`/config/tipos-acao/${id}`);
};

export const getClientesOptions = async () => {

    const [pf, pj] = await Promise.all([
        api.get('/clientes/pf?size=100'),
        api.get('/clientes/pj?size=100'),
    ]);

    return {
        pf: pf.data.content.map(c => ({ id: c.id, nome: c.nome })),
        pj: pj.data.content.map(c => ({ id: c.id, nome: c.nomeFantasia })),
    };

};
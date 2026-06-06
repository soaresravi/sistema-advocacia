package com.advocacia.service;

import com.advocacia.entity.AtividadeLog;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class AtividadeLogService {

    @Transactional
    public void registrar(Long userId, String acao, String entidade, Long entidadeId, String descricao, String ip, String userAgent) {

        AtividadeLog log = new AtividadeLog();

        log.userId = userId;
        log.acao = acao;
        log.entidade = entidade;
        log.entidadeId = entidadeId;
        log.descricao = descricao;
        log.ip = ip;
        log.userAgent = userAgent;
        log.createdAt = LocalDateTime.now();
        log.persist();

    }

    public List<AtividadeLog> listar(Long userId, int page, int size) {
        return AtividadeLog.find("userId = ?1 order by createdAt desc", userId).page(page, size).list();
    }

    public long count(Long userId) {
        return AtividadeLog.count("userId", userId);
    }

    @Transactional

    public void limparLogsAntigos(Long userId, int dias) {
        LocalDateTime dataLimite = LocalDateTime.now().minusDays(dias);
        AtividadeLog.delete("userId = ?1 and createdAt < ?2", userId, dataLimite);
    }
}

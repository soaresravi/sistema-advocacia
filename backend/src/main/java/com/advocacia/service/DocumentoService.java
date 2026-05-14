package com.advocacia.service;

import com.advocacia.entity.Documento;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@ApplicationScoped

public class DocumentoService {
    
    private static final String UPLOAD_BASE_DIR = System.getProperty("user.dir") + "/uploads";

    @Transactional

    public Documento salvarArquivo(byte[] conteudo, String nomeArquivo, String contentType, Long userId, Long processoId) throws IOException {

        Path userDir = Paths.get(UPLOAD_BASE_DIR, String.valueOf(userId), String.valueOf(processoId));
        Files.createDirectories(userDir);

        String timestamp = String.valueOf(System.currentTimeMillis());
        String nomeUnico = timestamp + "_" + nomeArquivo;
        Path filePath = userDir.resolve(nomeUnico);

        Files.write(filePath, conteudo);

        String url = "/uploads/" + userId + "/" + processoId + "/" + nomeUnico;
        Documento doc = new Documento();

        doc.uuid = UUID.randomUUID().toString();
        doc.nome = nomeArquivo;
        doc.tipo = contentType;
        doc.tamanho = (long) conteudo.length;
        doc.url = url;
        doc.userId = userId;
        doc.processoId = processoId;
        
        doc.persist();
        return doc;

    }
    

    public List<Documento> listarDocumentos(Long processoId, Long userId) {
        return Documento.list("processoId = ?1 and userId = ?2", processoId, userId);
    }

    public Documento buscarDocumento(Long processoId, String uuid, Long userId) {
        return Documento.find("processoId = ?1 and uuid = ?2 and userId = ?3", processoId, uuid, userId).firstResult();
    }

    @Transactional
    
    public boolean deletarDocumento(Long processoId, String uuid, Long userId) {
        
        Documento doc = buscarDocumento(processoId, uuid, userId);
        if (doc == null) return false;

        try {
            String fileName = doc.url.substring(doc.url.lastIndexOf("/") + 1);
            Path filePath = Paths.get(UPLOAD_BASE_DIR, String.valueOf(userId), String.valueOf(processoId), fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            System.err.println("Erro ao deletar arquivo físico: " + e.getMessage());
            e.printStackTrace();
            return false;
        }

        doc.delete();
        return true;

    }

    public Path getArquivoPath(String url, Long userId, Long processoId) {
        String fileName = url.substring(url.lastIndexOf("/") + 1);
        return Paths.get(UPLOAD_BASE_DIR, String.valueOf(userId), String.valueOf(processoId), fileName);
    }
}

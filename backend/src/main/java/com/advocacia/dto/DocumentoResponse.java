package com.advocacia.dto;

import java.time.LocalDateTime;

public class DocumentoResponse {
    public String id;
    public String nome, tipo;
    public long tamanho;
    public String url;
    public LocalDateTime uploadedAt;    
}

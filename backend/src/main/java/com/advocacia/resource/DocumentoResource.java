package com.advocacia.resource;

import com.advocacia.dto.DocumentoResponse;
import com.advocacia.entity.*;
import com.advocacia.service.DocumentoService;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.graphics.image.*;
import org.imgscalr.Scalr;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.*;

@Path("/processos/{id}/documentos")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class DocumentoResource {
    
    @Inject
    JsonWebToken jwt;
    
    @Inject
    DocumentoService documentoService;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    private byte[] comprimirImagem(InputStream imagemStream, String formato) throws Exception {
        BufferedImage imagem = ImageIO.read(imagemStream);
        BufferedImage imagemRedimensionada = Scalr.resize(imagem, Scalr.Method.QUALITY, 1200);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(imagemRedimensionada, formato, baos);
        return baos.toByteArray();
    }

    private byte[] comprimirPdf(InputStream pdfStream) throws Exception {

        try (PDDocument document = Loader.loadPDF(pdfStream.readAllBytes())) {

            for (PDPage page : document.getPages()) {

                PDResources res = page.getResources();

                for (COSName name : res.getXObjectNames()) {

                    if (res.isImageXObject(name)) {
                        PDImageXObject image = (PDImageXObject) res.getXObject(name);
                        BufferedImage rawImage = image.getImage();
                        BufferedImage resizedImage = Scalr.resize(rawImage, Scalr.Method.QUALITY, 1200);
                        PDImageXObject compressedImage = JPEGFactory.createFromImage(document, resizedImage, 0.75f);
                        res.put(name, compressedImage);
                    }
                }
            }
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();

        }
    }

    @GET
    public Response listarDocumentos(@PathParam("id") Long processoId) {

        Processo processo = Processo.find("id = ?1 and userId = ?2", processoId, getUserId()).firstResult();
        if (processo == null) return Response.status(404).build();

        List<Documento> docs = documentoService.listarDocumentos(processoId, getUserId());
        List<DocumentoResponse> response = new ArrayList<>();

        for (Documento doc : docs) {

            DocumentoResponse r = new DocumentoResponse();

            r.id = doc.uuid;
            r.nome = doc.nome;
            r.tipo = doc.tipo;
            r.tamanho = doc.tamanho;
            r.url = doc.url;
            r.uploadedAt = doc.uploadedAt;

            response.add(r);

        }

        return Response.ok(response).build();

    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Transactional

    public Response uploadDocumento(@PathParam("id") Long processoId, @RestForm("file") FileUpload file) {

        Processo processo = Processo.find("id = ?1 and userId = ?2", processoId, getUserId()).firstResult();
        if (processo == null) return Response.status(404).build();

        try {

            String fileName = file.fileName();
            String contentType = file.contentType();
            InputStream fileStream = file.filePath().toFile().toURI().toURL().openStream();

            byte[] conteudo;

            if (contentType != null && contentType.startsWith("image/")) {
                String formato = contentType.split("/")[1];
                conteudo = comprimirImagem(fileStream, formato);
            } else if (contentType != null && contentType.equals("application/pdf")) {
                conteudo = comprimirPdf(fileStream);
            } else {
                
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buffer = new byte[8192];
                int bytesRead;

                while((bytesRead = fileStream.read(buffer)) != -1) {
                    baos.write(buffer, 0, bytesRead);
                }

                conteudo = baos.toByteArray();

            }

            Documento doc = documentoService.salvarArquivo(conteudo, fileName, contentType, getUserId(), processoId);
            DocumentoResponse response = new DocumentoResponse();

            response.id = doc.uuid;
            response.nome = doc.nome;
            response.tipo = doc.tipo;
            response.tamanho = doc.tamanho;
            response.url = doc.url;
            response.uploadedAt = doc.uploadedAt;

            return Response.status(Response.Status.CREATED).entity(response).build();

        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(Map.of("error", "Erro no upload: " + e.getMessage())).build();
        }

    }

    @DELETE
    @Path("/{uuid}")
    @Transactional

    public Response deletarDocumento(@PathParam("id") Long processoId, @PathParam("uuid") String uuid) {
        Processo processo = Processo.find("id = ?1 and userId = ?2", processoId, getUserId()).firstResult();
        if (processo == null) return Response.status(404).build();
        boolean deleted = documentoService.deletarDocumento(processoId, uuid, getUserId());
        if (!deleted) return Response.status(404).build();
        return Response.noContent().build();
    }

    @GET
    @Path("/{uuid}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)

    public Response downloadDocumento(@PathParam("id") Long processoId, @PathParam("uuid") String uuid) {
        Processo processo = Processo.find("id = ?1 and userId = ?2", processoId, getUserId()).firstResult();
        if (processo == null) return Response.status(404).build();
        Documento doc = documentoService.buscarDocumento(processoId, uuid, getUserId());
        if (doc == null) return Response.status(404).build();
        java.nio.file.Path filePath = documentoService.getArquivoPath(doc.url, getUserId(), processoId);
        if (!Files.exists(filePath)) return Response.status(404).build();
        return Response.ok(filePath.toFile()).header("Content-Disposition", "attachment; filename=\"" + doc.nome + "\"").build();
    }

    @GET
    @Path("/download-all")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)

    public Response downloadTodosDocumentos(@PathParam("id") Long processoId) {

        Processo processo = Processo.find("id = ?1 and userId = ?2", processoId, getUserId()).firstResult();
        if (processo == null) return Response.status(404).build();

        List<Documento> docs = documentoService.listarDocumentos(processoId, getUserId());
        if (docs.isEmpty()) return Response.status(404).entity(Map.of("error", "Nenhum documento encontrado")).build();

        try {

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(baos);

            for (Documento doc : docs) {
                java.util.zip.ZipEntry entry = new java.util.zip.ZipEntry(doc.nome);
                zos.putNextEntry(entry);
                java.nio.file.Path filePath = documentoService.getArquivoPath(doc.url, getUserId(), processoId);
                byte[] content = java.nio.file.Files.readAllBytes(filePath);
                zos.write(content);
                zos.closeEntry();
            }

            zos.close();

            return Response.ok(baos.toByteArray()).header("Content-Disposition", "attachment; filename=documentos_processo_" + processoId + ".zip").build();
        
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(Map.of("error", "Erro ao criar ZIP: " + e.getMessage())).build();
        }

    }
}

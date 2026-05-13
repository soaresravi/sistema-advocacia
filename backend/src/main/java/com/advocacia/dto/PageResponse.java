package com.advocacia.dto;

import java.util.List;

public class PageResponse<T> {

    public List<T> content;
    public int page, size;
    public long total;
    public int totalPages;

    public PageResponse(List<T> content, int page, int size, long total) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.total = total;
        this.totalPages = (int) Math.ceil((double) total / size);
    }
}

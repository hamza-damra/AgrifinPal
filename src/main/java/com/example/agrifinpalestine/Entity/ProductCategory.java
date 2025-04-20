package com.example.agrifinpalestine.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "category_name_en", nullable = false)
    private String categoryNameEn;

    @Column(name = "category_name_ar", nullable = false)
    private String categoryNameAr;

    @Column(name = "category_description")
    private String categoryDescription;

    @Column(name = "category_image")
    private String categoryImage;
}

// src/app/products/page.tsx
"use client"; 

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard'; 

interface Product {
  id: number;
  name: string;
  brand: string | null;
  short_description: string | null;
  image_url: string | null;
  category: string | null;
  unit_of_measure: string;
  min_price_per_100g: number | null;
}

interface ApiResponse {
  data: Product[];
  page_info: {
    limit: number;
    offset: number;
    total_items?: number; 
    current_page_count?: number;
  };
}

export default function ProductsPage() {
  console.log("RENDERING: /app/products/page.tsx (All Products List)"); // <-- לוג לבדיקה

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("ProductsPage useEffect: Starting to fetch all products.");
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      // ודא שה-API שלך רץ ונגיש בכתובת זו!
      const apiUrl = 'https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products?limit=50'; 
      
      try {
        const response = await fetch(apiUrl);
        console.log("ProductsPage fetch response status:", response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
          console.error("ProductsPage fetch error data:", errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        console.log("ProductsPage fetched data:", data);
        setProducts(data.data || []); // ודא שאתה מטפל במקרה ש-data.data הוא undefined
      } catch (e: any) {
        console.error("ProductsPage - Failed to fetch products:", e);
        setError(e.message || 'Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
        console.log("ProductsPage useEffect: Finished fetching products.");
      }
    };

    fetchProducts();
  }, []); 

  if (isLoading) {
    return <div className="text-center py-10">טוען מוצרים... (מתוך /products/page.tsx)</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">שגיאה בטעינת המוצרים (מתוך /products/page.tsx): {error}</div>;
  }

  if (products.length === 0) {
    return <div className="text-center py-10">לא נמצאו מוצרים. (מתוך /products/page.tsx)</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-700 mb-8">רשימת מוצרים (מתוך /products/page.tsx)</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
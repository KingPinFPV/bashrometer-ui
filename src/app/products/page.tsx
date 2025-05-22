// src/app/products/page.tsx
"use client"; 

import { useState, useEffect } from 'react';
// import Link from 'next/link'; // כבר לא צריך כאן, נמצא ב-ProductCard
import ProductCard from '@/components/ProductCard'; // <-- ייבוא חדש

interface Product {
  id: number;
  name: string;
  brand: string | null;
  short_description: string | null;
  image_url: string | null;
  category: string | null;
  unit_of_measure: string;
  min_price_per_100g: number | null; // <-- הוספה
  // אם ה-API מחזיר עוד שדות שתרצה להשתמש בהם ישירות, הוסף גם אותם
  // למשל: origin_country, kosher_level, animal_type, cut_type, default_weight_per_unit_grams
}
// ... שאר הקובץ נשאר דומה ...


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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      const apiUrl = 'https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products?limit=20'; 
      // !!! ודא שזהו ה-URL הנכון !!!
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        setProducts(data.data); 
      } catch (e: any) {
        console.error("Failed to fetch products:", e);
        setError(e.message || 'Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []); 

  if (isLoading) {
    return <div className="text-center py-10">טוען מוצרים...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">שגיאה בטעינת המוצרים: {error}</div>;
  }

  if (products.length === 0) {
    return <div className="text-center py-10">לא נמצאו מוצרים.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-700 mb-8">רשימת מוצרים</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} /> // <-- שימוש ברכיב החדש
        ))}
      </div>
      {/* TODO: Add pagination controls here if page_info.total_items suggests more pages */}
    </div>
  );
}
// src/app/products/[productId]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface PriceExample {
  price_id: number;
  retailer_id: number;
  retailer: string;
  regular_price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  unit_for_price: string;
  quantity_for_price: number;
  submission_date: string;
  valid_to: string | null;
  notes: string | null;
  calculated_price_per_100g: number | null;
}

interface ProductDetailed {
  id: number;
  name: string;
  brand: string | null;
  origin_country: string | null;
  kosher_level: string | null;
  animal_type: string | null;
  cut_type: string | null;
  description: string | null;
  category: string | null;
  unit_of_measure: string;
  default_weight_per_unit_grams: number | null;
  image_url: string | null;
  short_description: string | null;
  is_active: boolean;
  price_examples: PriceExample[];
}

export default function ProductDetailPage() {
  console.log("RENDERING: /app/products/[productId]/page.tsx (Single Product Detail)"); // <-- לוג לבדיקה
  const params = useParams();
  const productId = params.productId as string;
  const { user, isLoading: authLoading } = useAuth();

  const [product, setProduct] = useState<ProductDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`ProductDetailPage useEffect: productId is '${productId}'. Starting to fetch details.`);
    if (!productId) {
      setIsLoading(false);
      setError("Product ID is missing from URL parameters.");
      console.error("ProductDetailPage: Product ID is missing!");
      return;
    }

    const fetchProductDetails = async () => {
      setIsLoading(true);
      setError(null);
      const apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products/${productId}`;

      try {
        const response = await fetch(apiUrl);
        console.log(`ProductDetailPage fetch response for product ${productId}:`, response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
          console.error(`ProductDetailPage fetch error data for product ${productId}:`, errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: ProductDetailed = await response.json();
        console.log(`ProductDetailPage fetched data for product ${productId}:`, data);
        setProduct(data);
      } catch (e: any) {
        console.error(`ProductDetailPage - Failed to fetch product ${productId} details:`, e);
        setError(e.message || 'Failed to load product details.');
      } finally {
        setIsLoading(false);
        console.log(`ProductDetailPage useEffect: Finished fetching product ${productId} details.`);
      }
    };

    fetchProductDetails();
  }, [productId]); 

  if (isLoading || authLoading) {
    return <div className="text-center py-10">טוען פרטי מוצר... (מתוך /products/[productId]/page.tsx)</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">שגיאה (מתוך /products/[productId]/page.tsx): {error}</div>;
  }

  if (!product) {
    return <div className="text-center py-10">המוצר לא נמצא. (מתוך /products/[productId]/page.tsx)</div>;
  }

  // ... שאר קוד ה-JSX להצגת פרטי המוצר והמחירים נשאר כפי שהיה ...
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Product Main Details */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        {product.image_url && (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full md:w-1/3 h-auto object-cover rounded-md mb-4 md:float-right md:ml-6 rtl:md:float-left rtl:md:mr-6" 
          />
        )}
        {!product.image_url && (
           <div className="w-full md:w-1/3 h-60 bg-slate-200 rounded-md mb-4 md:float-right md:ml-6 rtl:md:float-left rtl:md:mr-6 flex items-center justify-center text-slate-400">
             אין תמונה זמינה
           </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">{product.name}</h1>
        {product.brand && <p className="text-lg text-slate-600 mb-1"><strong>מותג:</strong> {product.brand}</p>}
        {product.category && <p className="text-lg text-slate-600 mb-1"><strong>קטגוריה:</strong> {product.category}</p>}
        {product.cut_type && <p className="text-sm text-slate-500 mb-1">סוג נתח: {product.cut_type}</p>}
        {product.animal_type && <p className="text-sm text-slate-500 mb-1">סוג חיה: {product.animal_type}</p>}
        {product.kosher_level && <p className="text-sm text-slate-500 mb-1">כשרות: {product.kosher_level}</p>}
        {product.origin_country && <p className="text-sm text-slate-500 mb-4">ארץ מקור: {product.origin_country}</p>}
        
        {product.description && <p className="text-slate-700 mt-4 mb-4 whitespace-pre-wrap">{product.description}</p>}
        {product.short_description && !product.description && <p className="text-slate-700 mt-4 mb-4">{product.short_description}</p>}
        
        {product.default_weight_per_unit_grams && (product.unit_of_measure === 'unit' || product.unit_of_measure === 'package') && (
          <p className="text-sm text-slate-500">משקל ברירת מחדל ליחידה/מארז: {product.default_weight_per_unit_grams} גרם</p>
        )}
      </div>

      {user && product && (
        <div className="my-6 text-center sm:text-right">
          <Link
            href={`/report-price?productId=${product.id}&productName=${encodeURIComponent(product.name)}`}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors text-sm sm:text-base"
          >
            מצאת מחיר אחר? דווח לנו על מחיר למוצר "{product.name}"
          </Link>
        </div>
      )}

      <h2 className="text-2xl font-semibold text-slate-700 mb-6">השוואת מחירים:</h2>
      {product.price_examples && product.price_examples.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">קמעונאי</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">מחיר (ל-100 גרם)</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">מחיר ליח' מכירה</th>
                <th scope="col" className="hidden md:table-cell px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">תאריך דיווח</th>
                <th scope="col" className="hidden lg:table-cell px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">הערות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {product.price_examples.map((price) => (
                <tr key={price.price_id} className={`${price.is_on_sale ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-slate-50'} transition-colors`}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{price.retailer}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-semibold">
                    {price.calculated_price_per_100g ? `₪${price.calculated_price_per_100g.toFixed(2)}` : 'לא זמין'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {price.sale_price && price.is_on_sale ? (
                      <>
                        <span className="line-through text-slate-400 mr-1 rtl:ml-1 rtl:mr-0">₪{Number(price.regular_price).toFixed(2)}</span>
                        <span className="font-bold text-red-600">₪{Number(price.sale_price).toFixed(2)}</span>
                      </>
                    ) : (
                      `₪${Number(price.regular_price).toFixed(2)}`
                    )}
                    <span className="text-xs text-slate-400 ml-1 rtl:mr-1 rtl:ml-0"> ({Number(price.quantity_for_price)} {price.unit_for_price})</span>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(price.submission_date).toLocaleDateString('he-IL')}
                  </td>
                  <td className="hidden lg:table-cell px-3 sm:px-6 py-4 text-sm text-slate-500 max-w-[150px] sm:max-w-xs truncate" title={price.notes || undefined}>{price.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-600 mt-4">אין דיווחי מחירים זמינים עבור מוצר זה כרגע.</p>
      )}
    </div>
  );
}
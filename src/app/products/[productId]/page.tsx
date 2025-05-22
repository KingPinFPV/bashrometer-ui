// src/app/products/[productId]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Hook לקבלת פרמטרים מהנתיב

// ממשקים שכבר הגדרנו (או דומים להם) - ודא שהם תואמים למה שה-API מחזיר
// עבור GET /api/products/{id}
interface PriceExample {
  price_id: number;
  retailer_id: number;
  retailer: string; // שם הקמעונאי
  regular_price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  unit_for_price: string;
  quantity_for_price: number;
  submission_date: string; // או Date אם תמיר אותו
  valid_to: string | null; // או Date
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
  const params = useParams(); // קבלת הפרמטרים מהנתיב
  const productId = params.productId as string; // ה-productId מהשם של התיקייה [productId]

  const [product, setProduct] = useState<ProductDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      // אם אין productId (למקרה קצה, לא אמור לקרות בנתיב דינמי כזה)
      setIsLoading(false);
      setError("Product ID is missing.");
      return;
    }

    const fetchProductDetails = async () => {
      setIsLoading(true);
      setError(null);
      // ודא שה-URL הזה נכון ופעיל!
      const apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products/${productId}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: ProductDetailed = await response.json();
        setProduct(data);
      } catch (e: any) {
        console.error("Failed to fetch product details:", e);
        setError(e.message || 'Failed to load product details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]); // ה-useEffect ירוץ מחדש אם ה-productId משתנה

  if (isLoading) {
    return <div className="text-center py-10">טוען פרטי מוצר...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">שגיאה: {error}</div>;
  }

  if (!product) {
    return <div className="text-center py-10">המוצר לא נמצא.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* פרטי מוצר ראשיים */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        {product.image_url && (
          <img src={product.image_url} alt={product.name} className="w-full md:w-1/3 h-auto object-cover rounded-md mb-4 md:float-right md:ml-6" />
        )}
        <h1 className="text-4xl font-bold text-slate-800 mb-3">{product.name}</h1>
        {product.brand && <p className="text-lg text-slate-600 mb-1"><strong>מותג:</strong> {product.brand}</p>}
        {product.category && <p className="text-lg text-slate-600 mb-1"><strong>קטגוריה:</strong> {product.category}</p>}
        {product.cut_type && <p className="text-sm text-slate-500 mb-1">סוג נתח: {product.cut_type}</p>}
        {product.animal_type && <p className="text-sm text-slate-500 mb-1">סוג חיה: {product.animal_type}</p>}
        {product.kosher_level && <p className="text-sm text-slate-500 mb-1">כשרות: {product.kosher_level}</p>}
        {product.origin_country && <p className="text-sm text-slate-500 mb-4">ארץ מקור: {product.origin_country}</p>}
        
        {product.description && <p className="text-slate-700 mt-4 mb-4 whitespace-pre-wrap">{product.description}</p>}
        {product.short_description && !product.description && <p className="text-slate-700 mt-4 mb-4">{product.short_description}</p>}
        
        {product.default_weight_per_unit_grams && product.unit_of_measure === 'unit' && (
          <p className="text-sm text-slate-500">משקל ברירת מחדל ליחידה: {product.default_weight_per_unit_grams} גרם</p>
        )}
      </div>

      {/* טבלת השוואת מחירים */}
      <h2 className="text-2xl font-semibold text-slate-700 mb-6">השוואת מחירים:</h2>
      {product.price_examples && product.price_examples.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">קמעונאי</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">מחיר (ל-100 גרם)</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">מחיר ליחידת מכירה</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">תאריך דיווח</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">הערות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {product.price_examples.map((price) => (
                <tr key={price.price_id} className={`${price.is_on_sale ? 'bg-green-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{price.retailer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-semibold">
                    {price.calculated_price_per_100g ? `₪${price.calculated_price_per_100g.toFixed(2)}` : 'לא זמין'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {price.sale_price ? (
                      <>
                        <span className="line-through text-slate-400">₪{price.regular_price.toFixed(2)}</span> ₪{price.sale_price.toFixed(2)}
                      </>
                    ) : (
                      `₪${price.regular_price.toFixed(2)}`
                    )}
                    <span className="text-xs text-slate-400 ml-1"> ({price.quantity_for_price} {price.unit_for_price})</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(price.submission_date).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{price.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-600">אין דיווחי מחירים זמינים עבור מוצר זה כרגע.</p>
      )}
    </div>
  );
}
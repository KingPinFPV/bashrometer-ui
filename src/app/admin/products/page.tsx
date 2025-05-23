// src/app/admin/products/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; //

// ממשק למוצר כפי שהוא מגיע מה-API (התאם לפי הצורך)
interface Product {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  unit_of_measure: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // הוסף שדות נוספים שתרצה להציג בטבלה
}

interface ApiResponse {
  data: Product[];
  page_info?: { // page_info הוא אופציונלי בשלב זה
    total_items?: number;
    limit?: number;
    offset?: number;
    // ...
  };
}

export default function AdminProductsPage() {
  const { token, user } = useAuth(); //
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminProducts = useCallback(async () => {
    if (!token || (user && user.role !== 'admin')) {
      setError("אין לך הרשאה לצפות בדף זה.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    // עדכן את כתובת ה-API שלך בהתאם
    const apiUrl = 'https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products?limit=100'; // שלוף כמות גדולה יותר לאדמין או הוסף עימוד

    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setProducts(data.data || []);
    } catch (e: any) {
      console.error("Failed to fetch admin products:", e);
      setError(e.message || 'Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchAdminProducts();
  }, [fetchAdminProducts]);

  if (isLoading) {
    return <div className="text-center py-10">טוען רשימת מוצרים...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">שגיאה: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">ניהול מוצרים</h1>
        <Link
          href="/admin/products/new" // נתיב ליצירת מוצר חדש (נוסיף בעתיד)
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors"
        >
          הוסף מוצר חדש
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-slate-600">לא נמצאו מוצרים במערכת.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">שם מוצר</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">מותג</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">קטגוריה</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">פעיל?</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{product.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{product.brand || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{product.category || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'כן' : 'לא'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/products/edit/${product.id}`} className="text-sky-600 hover:text-sky-800 mr-3 rtl:ml-3 rtl:mr-0">
                      ערוך
                    </Link>
                    {/* כפתור מחיקה (נוסיף לוגיקה בעתיד) */}
                    <button 
                      onClick={() => alert(`TODO: Implement delete for product ID ${product.id}`)}
                      className="text-red-600 hover:text-red-800"
                    >
                      מחק
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* כאן נוכל להוסיף בעתיד רכיב עימוד אם יש הרבה מוצרים */}
    </div>
  );
}
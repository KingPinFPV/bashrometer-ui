// src/app/admin/products/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; //

// ממשק למוצר כפי שהוא מגיע מה-API
interface Product {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  unit_of_measure: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: Product[];
  page_info?: {
    total_items?: number;
    limit?: number;
    offset?: number;
  };
}

export default function AdminProductsPage() {
  console.log("AdminProductsPage.tsx - RENDERING - V4 (with full delete logic)"); // לוג גרסה

  const { token, user, isLoading: authIsLoading } = useAuth(); // הוספת authIsLoading
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true); // טעינה כללית לדף
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});

  const fetchAdminProducts = useCallback(async () => {
    // ודא שיש טוקן ושהמשתמש הוא אדמין לפני שליחת הבקשה
    if (!token || !user || user.role !== 'admin') {
      setError("אין לך הרשאה לצפות בדף זה או שאינך מחובר.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const apiUrl = 'https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products?limit=100'; 

    console.log("fetchAdminProducts: Attempting to fetch. Token exists:", !!token);
    console.log("fetchAdminProducts: User role:", user?.role);

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
  }, [token, user]); // user נוסף כתלות

  useEffect(() => {
    console.log("AdminProductsPage: useEffect triggered. Auth isLoading:", authIsLoading, "User exists:", !!user, "Token exists:", !!token);
    if (!authIsLoading) { // המתן לסיום טעינת נתוני האימות
      if (user && token) { 
          fetchAdminProducts();
      } else {
          setError("יש להתחבר כאדמין כדי לצפות בדף זה.");
          setIsLoading(false); // הפסק טעינה אם אין משתמש/טוקן
      }
    }
  }, [authIsLoading, user, token, fetchAdminProducts]); // הוספת token ו-authIsLoading לתלויות

  const handleDeleteProduct = async (productId: number, productName: string) => {
    console.log(`handleDeleteProduct CALLED - For product ID: ${productId}, Name: ${productName}`);
    
    if (!token || (user && user.role !== 'admin')) {
      setActionMessage("שגיאה: אין לך הרשאה לבצע פעולה זו.");
      console.log("handleDeleteProduct: Permission denied.");
      return;
    }

    const confirmDelete = window.confirm(`האם אתה בטוח שברצונך למחוק את המוצר "${productName}" (ID: ${productId})? פעולה זו אינה הפיכה.`);
    if (!confirmDelete) {
      console.log("handleDeleteProduct: Delete cancelled by user.");
      return;
    }

    setActionMessage(null); 
    setIsDeleting(prev => ({ ...prev, [productId]: true })); 
    
    const apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products/${productId}`;
    console.log("handleDeleteProduct: Attempting to DELETE from URL:", apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log("handleDeleteProduct: Delete API response status:", response.status);

      if (response.status === 204 || response.ok) { 
        setActionMessage(`המוצר "${productName}" נמחק בהצלחה.`);
        fetchAdminProducts(); 
      } else {
        // נסה לקרוא את גוף השגיאה אם קיים
        let errorDetail = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.error || errorData.message || errorDetail;
        } catch (e) {
            // אם אין גוף JSON או שהוא לא תקין, השתמש בהודעה הכללית
        }
        console.error("Error deleting product:", errorDetail);
        setActionMessage(`אירעה שגיאה במחיקת המוצר: ${errorDetail}`);
      }
    } catch (e: any) {
      console.error("Failed to delete product (exception):", e);
      setActionMessage(`שגיאת רשת במחיקת המוצר: ${e.message}`);
    } finally {
      setIsDeleting(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (authIsLoading || (isLoading && products.length === 0)) { 
    return <div className="text-center py-10">טוען נתונים...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">שגיאה: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">ניהול מוצרים</h1>
        <Link
          href="/admin/products/new"
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors"
        >
          הוסף מוצר חדש
        </Link>
      </div>

      {actionMessage && (
        <div className={`p-4 mb-4 text-sm rounded-md ${actionMessage.includes('בהצלחה') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {actionMessage}
        </div>
      )}

      {products.length === 0 && !isLoading && !error ? (
        <p className="text-slate-600">לא נמצאו מוצרים במערכת.</p>
      ) : !isLoading && products.length > 0 ? ( 
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
                    <button 
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isDeleting[product.id] || isLoading} 
                    >
                      {isDeleting[product.id] ? 'מוחק...' : 'מחק'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null } 
    </div>
  );
}
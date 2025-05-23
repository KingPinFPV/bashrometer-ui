// src/app/admin/products/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AdminPagination from '@/components/AdminPagination'; // ייבוא רכיב העימוד

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
    current_page_count?: number;
    total_pages?: number;
  };
}

export default function AdminProductsPage() {
  console.log("AdminProductsPage.tsx - RENDERING - V5 (with Pagination Component)"); 

  const { token, user, isLoading: authIsLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const ITEMS_PER_PAGE = 10; 

  const fetchAdminProducts = useCallback(async (pageToFetch = 1) => {
    if (!token || !user || user.role !== 'admin') {
      setError("אין לך הרשאה לצפות בדף זה או שאינך מחובר.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const offset = (pageToFetch - 1) * ITEMS_PER_PAGE;
    const apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products?limit=${ITEMS_PER_PAGE}&offset=${offset}`; 
    
    console.log("fetchAdminProducts: Attempting to fetch. Token exists:", !!token);
    console.log("fetchAdminProducts: User role:", user?.role);
    console.log("fetchAdminProducts: API URL:", apiUrl);

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
      if (data.page_info && data.page_info.total_items !== undefined && data.page_info.limit !== undefined) {
        setTotalPages(Math.ceil(data.page_info.total_items / data.page_info.limit));
      } else if (data.data && data.data.length === 0 && data.page_info?.total_items === 0) {
        setTotalPages(0);
      } else if (data.data && data.data.length > 0 && (!data.page_info || data.page_info.total_items === undefined)) {
        setTotalPages(1);
      } else {
        setTotalPages(0);
      }
      setCurrentPage(pageToFetch);

    } catch (e: any) {
      console.error("Failed to fetch admin products:", e);
      setError(e.message || 'Failed to load products.');
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, ITEMS_PER_PAGE]); 

  useEffect(() => {
    console.log("AdminProductsPage: useEffect triggered. Auth isLoading:", authIsLoading, "User exists:", !!user, "Token exists:", !!token, "CurrentPage:", currentPage);
    if (!authIsLoading) { 
      if (user && token) { 
          fetchAdminProducts(currentPage); 
      } else {
          setError("יש להתחבר כאדמין כדי לצפות בדף זה.");
          setIsLoading(false); 
      }
    }
  }, [authIsLoading, user, token, currentPage, fetchAdminProducts]); 

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
        // לאחר מחיקה, בדוק אם הדף הנוכחי עדיין תקין או שצריך לחזור לדף קודם
        if (products.length === 1 && currentPage > 1) {
            fetchAdminProducts(currentPage - 1); // עבור לדף הקודם אם זה היה הפריט היחיד בדף האחרון
        } else {
            fetchAdminProducts(currentPage); 
        }
      } else {
        let errorDetail = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.error || errorData.message || errorDetail;
        } catch (e) { /* no json body */ }
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
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  if (authIsLoading || (isLoading && products.length === 0 && currentPage === 1)) { 
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
      ) : products.length > 0 ? ( 
        <>
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
          {/* שילוב רכיב העימוד */}
          {totalPages > 1 && ( // הצג עימוד רק אם יש יותר מדף אחד
            <div className="mt-6 flex justify-center">
              <AdminPagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>
          )}
        </>
      ) : null } 
    </div>
  );
}
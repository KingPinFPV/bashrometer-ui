// src/app/admin/retailers/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; //
import AdminPagination from '@/components/AdminPagination'; // ייבוא רכיב העימוד

// ממשק לקמעונאי (כפי שהיה לך)
interface Retailer {
  id: number;
  name: string;
  chain: string | null;
  type: string | null;
  address: string | null;
  is_active: boolean;
}

interface ApiRetailerResponse {
  data: Retailer[];
  page_info?: {
    total_items?: number;
    limit?: number;
    offset?: number;
    current_page_count?: number; // בהנחה שה-API מחזיר את זה
    total_pages?: number;      // וגם את זה
  };
}

export default function AdminRetailersPage() {
  console.log("AdminRetailersPage.tsx - RENDERING - V1 (with Pagination)");

  const { token, user, isLoading: authIsLoading } = useAuth(); //
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});

  // --- States חדשים לעימוד ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const ITEMS_PER_PAGE = 10; // אפשר לקבוע לערך אחר

  const fetchAdminRetailers = useCallback(async (pageToFetch = 1) => {
    if (!token || !user || user.role !== 'admin') {
      setError("אין לך הרשאה לצפות בדף זה או שאינך מחובר.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const offset = (pageToFetch - 1) * ITEMS_PER_PAGE;
    const apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/retailers?limit=${ITEMS_PER_PAGE}&offset=${offset}`;
    // הוסף פרמטרי מיון וסינון אם יש לך אותם ב-API לקמעונאים
    // apiUrl += `&sort_by=name&order=ASC`;

    console.log("fetchAdminRetailers: Fetching from URL:", apiUrl);

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

      const data: ApiRetailerResponse = await response.json();
      setRetailers(data.data || []);
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
      console.error("Failed to fetch admin retailers:", e);
      setError(e.message || 'Failed to load retailers.');
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, ITEMS_PER_PAGE]);

  useEffect(() => {
    console.log("AdminRetailersPage: useEffect triggered. Auth isLoading:", authIsLoading, "User exists:", !!user, "Token exists:", !!token, "CurrentPage:", currentPage);
    if (!authIsLoading) { 
      if (user && token) { 
          fetchAdminRetailers(currentPage); 
      } else {
          setError("יש להתחבר כאדמין כדי לצפות בדף זה.");
          setIsLoading(false); 
      }
    }
  }, [authIsLoading, user, token, currentPage, fetchAdminRetailers]);

  const handleDeleteRetailer = async (retailerId: number, retailerName: string) => {
    if (!token || !user || user.role !== 'admin') {
      setActionMessage("שגיאה: אין לך הרשאה לבצע פעולה זו.");
      return;
    }
    const confirmDelete = window.confirm(`האם אתה בטוח שברצונך למחוק את הקמעונאי "${retailerName}" (ID: ${retailerId})?`);
    if (!confirmDelete) return;

    setActionMessage(null);
    setIsDeleting(prev => ({ ...prev, [retailerId]: true }));
    const apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/retailers/${retailerId}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 204 || response.ok) {
        setActionMessage(`הקמעונאי "${retailerName}" נמחק בהצלחה.`);
        if (retailers.length === 1 && currentPage > 1) {
            fetchAdminRetailers(currentPage - 1);
        } else {
            fetchAdminRetailers(currentPage); 
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        setActionMessage(errorData.error || 'אירעה שגיאה במחיקת הקמעונאי.');
      }
    } catch (e: any) {
      setActionMessage(`שגיאת רשת במחיקת הקמעונאי: ${e.message}`);
    } finally {
      setIsDeleting(prev => ({ ...prev, [retailerId]: false }));
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  if (authIsLoading || (isLoading && retailers.length === 0 && currentPage === 1)) { 
    return <div className="text-center py-10">טוען רשימת קמעונאים...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-600">שגיאה: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">ניהול קמעונאים</h1>
        <Link
          href="/admin/retailers/new"
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors"
        >
          הוסף קמעונאי חדש
        </Link>
      </div>

      {actionMessage && (
        <div className={`p-4 mb-4 text-sm rounded-md ${actionMessage.includes('בהצלחה') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {actionMessage}
        </div>
      )}

      {retailers.length === 0 && !isLoading && !error ? (
        <p className="text-slate-600">לא נמצאו קמעונאים במערכת.</p>
      ) : retailers.length > 0 ? ( 
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">שם קמעונאי</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">רשת</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">סוג</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">פעיל?</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {retailers.map((retailer) => (
                  <tr key={retailer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{retailer.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{retailer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{retailer.chain || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{retailer.type || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        retailer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {retailer.is_active ? 'כן' : 'לא'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/retailers/edit/${retailer.id}`} className="text-sky-600 hover:text-sky-800 mr-3 rtl:ml-3 rtl:mr-0">
                        ערוך
                      </Link>
                      <button 
                        onClick={() => handleDeleteRetailer(retailer.id, retailer.name)}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isDeleting[retailer.id] || isLoading} 
                      >
                        {isDeleting[retailer.id] ? 'מוחק...' : 'מחק'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && ( 
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
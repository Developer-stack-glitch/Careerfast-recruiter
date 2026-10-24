'use client';
import React from 'react';
import HrHeader from './HrHeader';
import ProtectedRoute from '@/ProtectedRoute/ProtectedRoute';

const HrLayout = ({ children }) => {
    return (
        <ProtectedRoute allowedRoles={[1, 3]}>
            <div className="flex flex-col min-h-screen bg-[#F8FAFC] overflow-x-clip w-full">
                <HrHeader />
                <main className="flex-1 w-full relative">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
};

export default HrLayout;

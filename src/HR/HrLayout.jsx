'use client';
import React from 'react';
import HrHeader from './HrHeader';

const HrLayout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] overflow-x-hidden w-full">
            <HrHeader />
            <main className="flex-1 w-full relative">
                {children}
            </main>
        </div>
    );
};

export default HrLayout;

'use client';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/ProtectedRoute/ProtectedRoute';
import HrLayout from '@/HR/HrLayout';

const PostEdit = dynamic(() => import('@/HR/PostEdit'), { ssr: false });

export default function EditJobPage() {
    return (
        <ProtectedRoute allowedRoles={[1, 3]}>
            <HrLayout>
                <PostEdit />
            </HrLayout>
        </ProtectedRoute>
    );
}

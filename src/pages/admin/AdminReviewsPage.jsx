
import React from 'react';
import { Helmet } from 'react-helmet';
import ReviewsTab from '@/components/admin/ReviewsTab';

const AdminReviewsPage = () => {
  return (
    <>
      <Helmet>
        <title>Reviews - Admin Dashboard</title>
      </Helmet>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Reviews</h1>
            <p className="text-muted-foreground">Manage and moderate customer reviews.</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
            <ReviewsTab />
        </div>
      </div>
    </>
  );
};

export default AdminReviewsPage;

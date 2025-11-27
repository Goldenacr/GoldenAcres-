
SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    p.category,
    p.stock,
    p.unit,
    p.farmer_id,
    p.created_at,
    pr.full_name as farmer_name,
    pr.is_verified as farmer_is_verified,
    COALESCE(rev.avg_rating, 0) as average_rating,
    COALESCE(rev.total_reviews, 0) as total_reviews,
    p.total_units_sold, -- Use the new dedicated column
    p.times_in_cart
FROM 
    products p
LEFT JOIN 
    profiles pr ON p.farmer_id = pr.id
LEFT JOIN LATERAL (
    SELECT 
        AVG(rating) as avg_rating,
        COUNT(id) as total_reviews
    FROM product_reviews
    WHERE product_id = p.id
) rev ON true
ORDER BY 
    p.created_at DESC;

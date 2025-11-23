import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const StarRating = ({ rating, maxRating = 5, onRatingChange, readonly = false, size = "md" }) => {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-8 h-8"
  };

  return (
    <div className="flex items-center space-x-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRatingChange && onRatingChange(star)}
          disabled={readonly}
          className={cn(
            "focus:outline-none transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
            )}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
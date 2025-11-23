import React from 'react';
import { BadgeCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const VerifiedBadge = ({ className }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <BadgeCheck className={`h-4 w-4 text-sky-500 fill-sky-100 ${className}`} />
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Farmer</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerifiedBadge;
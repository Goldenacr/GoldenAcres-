
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import countryData from '@/lib/countryData.json';

const regions = countryData.regions || [];

const RegionSelectorDialog = ({ isOpen, setIsOpen, currentValue, onSelect }) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Region</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {regions.map((region) => (
            <div
              key={region}
              onClick={() => {
                onSelect(region);
                setIsOpen(false);
              }}
              className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
            >
              <span className="font-medium">{region}</span>
              {currentValue === region && <CheckCircle className="h-5 w-5 text-primary" />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegionSelectorDialog;

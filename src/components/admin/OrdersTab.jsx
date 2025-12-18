
import React, { useState } from 'react';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash, Eye, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const OrdersTab = ({ orders, onStatusUpdate, onDelete }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-500 hover:bg-green-600';
      case 'Cancelled': return 'bg-red-500 hover:bg-red-600';
      case 'Out for Delivery': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Order Placed': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(price);
  };

  // Helper to extract hub name from JSON delivery_info or just show "Home Delivery"
  const getDeliveryDisplay = (order) => {
    if (!order.delivery_info) return 'N/A';
    
    // Check if it's a simple string or JSON object
    if (typeof order.delivery_info === 'string') {
         // Attempt to parse if it's a JSON string, otherwise return as is
         try {
             const parsed = JSON.parse(order.delivery_info);
             if (parsed.method === 'Pickup') return `Pickup: ${parsed.hub_name || parsed.hub_id || 'Unknown Hub'}`;
             return parsed.address || 'Home Delivery';
         } catch {
             return order.delivery_info;
         }
    }
    
    if (order.delivery_info.method === 'Pickup') {
        return `Pickup: ${order.delivery_info.hub_name || 'Hub #' + order.delivery_info.hub_id || 'Hub'}`;
    }
    return 'Home Delivery';
  };

  return (
    <>
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Delivery Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No orders found.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{order.customer_name || 'Guest'}</span>
                    <span className="text-xs text-muted-foreground">{order.customer_phone || 'No phone'}</span>
                  </div>
                </TableCell>
                <TableCell>{formatPrice(order.total_amount)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {getDeliveryDisplay(order)}
                   </div>
                </TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'Order Placed')}>Order Placed</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'Out for Delivery')}>Out for Delivery</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'Delivered')}>Delivered</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'Cancelled')} className="text-red-600">Cancelled</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(order)} className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" /> Delete Order
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>

    {/* Order Details Modal */}
    <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Order Details - #{selectedOrder?.id?.substring(0,8)}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold mb-2">Customer Info</h4>
                            <p className="text-sm">Name: {selectedOrder.customer_name}</p>
                            <p className="text-sm">Phone: {selectedOrder.customer_phone}</p>
                            <p className="text-sm">Email: {selectedOrder.user_email || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Delivery Info</h4>
                            <p className="text-sm font-medium text-primary">{getDeliveryDisplay(selectedOrder)}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold mb-2">Order Items</h4>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Farmer</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedOrder.order_items?.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{item.product_name}</TableCell>
                                            <TableCell>{item.farmer_name || 'N/A'}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                        <span className="font-bold text-lg">Total Amount</span>
                        <span className="font-bold text-2xl text-primary">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                </div>
            )}
        </DialogContent>
    </Dialog>
    </>
  );
};

export default OrdersTab;

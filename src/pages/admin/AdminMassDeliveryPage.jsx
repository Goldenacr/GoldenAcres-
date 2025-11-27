import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Package, MapPin, Building, Printer, Check, X, Clipboard, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';

const OrderItem = ({ order, onToggle, isSelected }) => (
    <div className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
        <Checkbox id={`order-${order.id}`} checked={isSelected} onCheckedChange={onToggle} className="mt-1"/>
        <div className="flex-grow">
            <div className="flex justify-between items-start">
                <div>
                    <label htmlFor={`order-${order.id}`} className="font-semibold cursor-pointer">{order.customer_name}</label>
                    <p className="text-sm text-muted-foreground">{order.delivery_info?.address || 'Address not available'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{order.id.substring(0,8)}...</p>
                </div>
                <Badge variant={order.status === 'Out for Delivery' ? 'default' : 'secondary'} className="whitespace-nowrap">{order.status}</Badge>
            </div>
        </div>
    </div>
);

const AreaGroup = ({ area, orders, onToggle, selectedOrders }) => {
    const allSelectedInArea = orders.every(order => selectedOrders.has(order.id));
    
    const handleSelectAll = () => {
        const orderIds = orders.map(o => o.id);
        if (allSelectedInArea) {
            orderIds.forEach(id => selectedOrders.delete(id));
        } else {
            orderIds.forEach(id => selectedOrders.add(id));
        }
        onToggle(new Set(selectedOrders));
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
                <CardTitle className="text-lg flex items-center gap-2"><Building className="h-5 w-5 text-primary"/>{area}</CardTitle>
                <div className="flex items-center gap-2">
                    <label htmlFor={`select-all-${area}`} className="text-sm font-medium">Select All</label>
                    <Checkbox id={`select-all-${area}`} checked={allSelectedInArea} onCheckedChange={handleSelectAll} />
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                {orders.map(order => (
                    <OrderItem key={order.id} order={order} isSelected={selectedOrders.has(order.id)} onToggle={() => onToggle(order.id)}/>
                ))}
            </CardContent>
        </Card>
    );
};

const CopyToClipboardButton = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            toast({ title: 'Copied to clipboard!' });
            setTimeout(() => setCopied(false), 2000);
        }, () => {
            toast({ variant: 'destructive', title: 'Failed to copy' });
        });
    };

    return (
        <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <ClipboardCheck className="h-4 w-4 mr-2"/> : <Clipboard className="h-4 w-4 mr-2"/>}
            Copy List
        </Button>
    );
};


const AdminMassDeliveryPage = () => {
    const { toast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState(new Set());

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .in('status', ['Order Placed', 'Rider Dispatched to Farm', 'Products Picked Up'])
            .eq('delivery_info->>method', 'Delivery')
            .order('created_at', { ascending: true });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching orders', description: error.message });
            setOrders([]);
        } else {
            const ordersWithLocation = data.map(o => {
                const profileRegion = o.delivery_info?.region; 
                const profileArea = o.delivery_info?.area; 
                return { ...o, region: profileRegion || 'Unknown Region', area: profileArea || 'Unknown Area' };
            });
            setOrders(ordersWithLocation);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const ordersByRegion = useMemo(() => {
        return orders.reduce((acc, order) => {
            const region = order.region;
            const area = order.area;
            if (!acc[region]) {
                acc[region] = {};
            }
            if (!acc[region][area]) {
                acc[region][area] = [];
            }
            acc[region][area].push(order);
            return acc;
        }, {});
    }, [orders]);

    const handleToggleOrder = useCallback((orderIdOrSet) => {
        setSelectedOrders(prev => {
            const newSet = new Set(prev);
            if (orderIdOrSet instanceof Set) {
                return orderIdOrSet;
            }
            if (newSet.has(orderIdOrSet)) {
                newSet.delete(orderIdOrSet);
            } else {
                newSet.add(orderIdOrSet);
            }
            return newSet;
        });
    }, []);

    const handleMassUpdate = async (newStatus) => {
        if (selectedOrders.size === 0) {
            toast({ variant: 'destructive', title: 'No orders selected' });
            return;
        }

        const orderIds = Array.from(selectedOrders);
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .in('id', orderIds);
        
        if (error) {
            toast({ variant: 'destructive', title: `Failed to update ${orderIds.length} orders`, description: error.message });
        } else {
            toast({ title: `${orderIds.length} orders updated to "${newStatus}"` });
            setSelectedOrders(new Set());
            fetchOrders(); // Refresh data
        }
    };
    
    const generatePrintableList = () => {
        const selectedOrderDetails = orders.filter(o => selectedOrders.has(o.id));
        const listContent = selectedOrderDetails.map(o => 
            `Name: ${o.customer_name}\nPhone: ${o.customer_phone}\nAddress: ${o.delivery_info?.address || 'N/A'}\nAmount: GHS ${o.total_amount}\n\n`
        ).join('-----------------------------------\n');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<html><head><title>Delivery List</title><style>body{font-family:monospace;white-space:pre-wrap;}</style></head><body>${listContent}</body></html>`);
        printWindow.document.close();
        printWindow.print();
    };

    const generatePlainTextList = () => {
         const selectedOrderDetails = orders.filter(o => selectedOrders.has(o.id));
         return selectedOrderDetails.map((o, i) => 
            `${i+1}. Name: ${o.customer_name}, Phone: ${o.customer_phone}, Address: ${o.delivery_info?.address || 'N/A'}, Amount: GHS ${o.total_amount}`
        ).join('\n');
    }

    return (
        <>
            <Helmet><title>Mass Delivery Management - Admin</title></Helmet>
            <div className="py-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Mass Delivery Management</h1>
                        <p className="text-muted-foreground">Organize and dispatch home delivery orders efficiently.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => handleMassUpdate('Out for Delivery')} disabled={selectedOrders.size === 0}>
                            <Check className="h-4 w-4 mr-2"/> Dispatch Selected ({selectedOrders.size})
                        </Button>
                         <Button variant="secondary" onClick={generatePrintableList} disabled={selectedOrders.size === 0}>
                            <Printer className="h-4 w-4 mr-2"/> Print List
                        </Button>
                         <CopyToClipboardButton text={generatePlainTextList()} />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                ) : Object.keys(ordersByRegion).length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground"/>
                        <h3 className="mt-4 text-lg font-semibold">No Pending Deliveries</h3>
                        <p className="mt-1 text-sm text-muted-foreground">All home delivery orders are processed. Check back later.</p>
                    </div>
                ) : (
                    <Tabs defaultValue={Object.keys(ordersByRegion)[0]} className="w-full">
                        <TabsList>
                            {Object.keys(ordersByRegion).map(region => (
                                <TabsTrigger key={region} value={region} className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4"/> {region}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {Object.entries(ordersByRegion).map(([region, areas]) => (
                            <TabsContent key={region} value={region}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pt-6">
                                    {Object.entries(areas).map(([area, areaOrders]) => (
                                        <AreaGroup key={area} area={area} orders={areaOrders} selectedOrders={selectedOrders} onToggle={handleToggleOrder}/>
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </div>
        </>
    );
};

export default AdminMassDeliveryPage;
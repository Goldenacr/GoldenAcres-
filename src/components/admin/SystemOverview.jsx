
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, ShoppingCart, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, trend }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <p className="text-xs text-muted-foreground flex items-center">
                        {trend.value > 0 ? <ArrowUp className="h-4 w-4 text-green-500 mr-1" /> : <ArrowDown className="h-4 w-4 text-red-500 mr-1" />}
                        {trend.value}% {trend.period}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};


const SystemOverview = ({ stats }) => {
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.5,
                ease: "easeOut"
            }
        })
    };

    const overviewStats = [
        {
            title: "Total Revenue",
            value: `GHS ${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            trend: { value: 5.2, period: "from last month" } // Dummy data
        },
        {
            title: "Total Orders",
            value: stats.totalOrders.toLocaleString(),
            icon: ShoppingCart,
            trend: { value: 12.1, period: "from last month" } // Dummy data
        },
        {
            title: "Active Users",
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            trend: { value: 2.5, period: "from last week" } // Dummy data
        },
        {
            title: "Products in Stock",
            value: stats.totalProducts.toLocaleString(),
            icon: Package,
            trend: { value: -1.8, period: "from yesterday" } // Dummy data
        }
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {overviewStats.map((stat, i) => (
                <motion.div
                    key={stat.title}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <StatCard {...stat} />
                </motion.div>
            ))}
        </div>
    );
};

export default SystemOverview;

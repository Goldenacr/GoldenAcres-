import React from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

const MenuItem = ({ to, icon: Icon, title, description }) => (
    <Link to={to} className="block group">
        <Card className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-muted p-3 rounded-lg">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-semibold text-card-foreground">{title}</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
        </Card>
    </Link>
);

const SettingsMenuPage = () => {
    return (
        <div className="space-y-4">
            <div className="md:hidden">
                 <h2 className="text-2xl font-bold tracking-tight mb-4">Settings</h2>
            </div>
            <MenuItem
                to="/settings/profile"
                icon={User}
                title="Profile"
                description="Manage your account settings and personal information."
            />
            <MenuItem
                to="/settings/password"
                icon={Lock}
                title="Password"
                description="Update your account's password."
            />
        </div>
    );
};

export default SettingsMenuPage;
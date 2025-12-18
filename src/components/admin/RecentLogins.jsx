
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const timeAgo = (date) => {
    if (!date) return 'never';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

const RecentLogins = ({ users }) => {
    const sortedUsers = [...users]
        .filter(u => u.last_sign_in_at)
        .sort((a, b) => new Date(b.last_sign_in_at) - new Date(a.last_sign_in_at))
        .slice(0, 5);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sortedUsers.length > 0 ? sortedUsers.map(user => (
                        <div key={user.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                                <AvatarFallback>{user.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{user.full_name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="ml-auto font-medium text-sm text-muted-foreground">
                                {timeAgo(user.last_sign_in_at)}
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground">No recent logins to display.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentLogins;

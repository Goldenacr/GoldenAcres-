import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Home, Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
        />
        <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
        />
        <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
        />
        <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
        />
        <path d="M1 1h22v22H1z" fill="none" />
    </svg>
);

const FloatingLabelInput = ({ id, label, type, value, onChange, disabled, showPassword, onTogglePassword }) => {
    return (
        <div className="relative floating-input">
            <Input
                id={id}
                type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                value={value}
                onChange={onChange}
                required
                className={`h-12 ${value ? 'has-value' : ''} ${type === 'password' ? 'pr-10' : ''}`}
                disabled={disabled}
            />
            <Label htmlFor={id}>{label}</Label>
            {type === 'password' && (
                <button
                    type="button"
                    onClick={onTogglePassword}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            )}
        </div>
    );
};

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await signIn(email, password);

        if (!error) {
             toast({
                title: "Login Successful!",
                description: "Welcome back!",
            });
            navigate('/');
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.message,
            });
        }
        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            toast({
                variant: "destructive",
                title: "Google Sign-In Failed",
                description: error.message,
            });
        } else {
            toast({
                title: "Login Successful!",
                description: "Welcome back!",
            });
            navigate('/');
        }
        setLoading(false);
    }

    return (
        <>
            <Helmet>
                <title>Login - Golden Acres</title>
                <meta name="description" content="Login to your Golden Acres account." />
            </Helmet>
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-transparent px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md p-8 space-y-6 bg-card/90 backdrop-blur-sm rounded-2xl shadow-2xl border"
                >
                    <div className="text-center flex justify-between items-center mb-4">
                        <div></div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
                        <Button asChild variant="outline" size="sm">
                            <Link to="/">
                                <Home className="h-4 w-4 mr-2" />
                                Home
                            </Link>
                        </Button>
                    </div>
                    <p className="mt-2 text-gray-600 text-center">Sign in to continue to Golden Acres.</p>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <FloatingLabelInput
                            id="email"
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                        <FloatingLabelInput
                            id="password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            showPassword={showPassword}
                            onTogglePassword={() => setShowPassword(!showPassword)}
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                        <GoogleIcon /> Sign In with Google
                    </Button>

                    <p className="text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </div>
        </>
    );
};

export default LoginPage;
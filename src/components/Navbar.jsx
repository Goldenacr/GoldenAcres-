import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingCart as ShoppingCartIcon, User, LogOut, ChevronDown, LayoutDashboard, Truck, Settings, Home, Info, ShoppingBag, Book, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';

const NavLink = memo(({ to, children }) => (
  <Link to={to} className="text-gray-700 hover:text-primary transition duration-300 relative group py-2">
    {children}
    <motion.span 
        layoutId={`underline-${children}`}
        className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"
    ></motion.span>
  </Link>
));

const DropdownMenu = memo(({ profile, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getDashboardLink = useCallback(() => {
    if (!profile) return '/login';
    if (profile.role === 'admin') return '/admin-dashboard';
    if (profile.role === 'farmer') return '/farmer-dashboard';
    return '/customer-dashboard';
  }, [profile]);

  const menuVariants = {
    open: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    closed: { opacity: 0, y: -10, scale: 0.95 }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="ghost" size="sm" className="flex items-center" onClick={() => setIsOpen(prev => !prev)}>
        <User className="w-4 h-4 mr-2" />
        {profile?.full_name || "Account"}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown className="w-4 h-4 ml-1"/></motion.div>
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border origin-top-right"
          >
            <div className="py-1">
              <Link onClick={() => setIsOpen(false)} to={getDashboardLink()} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
              </Link>
              <Link onClick={() => setIsOpen(false)} to="/my-orders" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Truck className="w-4 h-4 mr-2" /> My Orders
              </Link>
              <Link onClick={() => setIsOpen(false)} to="/settings" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </Link>
              <button onClick={() => { handleLogout(); setIsOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});


const MobileMenu = ({ isOpen, setIsOpen, user, profile, handleLogout }) => {
  const getDashboardLink = useCallback(() => {
    if (!profile) return '/login';
    if (profile.role === 'admin') return '/admin-dashboard';
    if (profile.role === 'farmer') return '/farmer-dashboard';
    return '/customer-dashboard';
  }, [profile]);

  const mobileLinkProps = { onClick: () => setIsOpen(false) };
  
  const menuVariants = {
    closed: { x: "100%", transition: { type: 'spring', stiffness: 400, damping: 40, when: "afterChildren" } },
    open: { x: 0, transition: { type: 'spring', stiffness: 400, damping: 40, staggerChildren: 0.07, delayChildren: 0.2 } },
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/about', icon: Info, label: 'About' },
    { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { to: '/logistics', icon: Truck, label: 'Logistics' },
    { to: '/blog', icon: Book, label: 'Blog' },
    { to: '/contact', icon: Phone, label: 'Contact' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={menuVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className="fixed inset-0 bg-white z-[100] md:hidden flex flex-col h-screen w-screen"
        >
            <div className="flex justify-between items-center p-4 border-b shrink-0">
                <Link to="/" onClick={() => setIsOpen(false)}>
                    <img src="https://horizons-cdn.hostinger.com/1ff2a2eb-9cef-439f-b1c4-73368cb28fdf/dee3e90e0fad3a78c5aad3fa165b27b3.jpg" alt="Golden Acres Logo" className="h-12 w-auto rounded-full" />
                </Link>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(false)}>
                    <X className="w-6 h-6 text-gray-700" />
                </motion.button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <motion.nav 
                  className="p-4"
                  variants={{ open: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } }, closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } } }}
                >
                  <ul className="space-y-2">
                    {navItems.map((item) => (
                      <motion.li
                        key={item.label}
                        variants={{ open: { y: 0, opacity: 1 }, closed: { y: 20, opacity: 0 } }}
                      >
                        <Link to={item.to} {...mobileLinkProps} className="flex items-center gap-4 p-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors">
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </motion.nav>

                <motion.div className="p-4 border-t mt-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  {user && profile ? (
                    <div className="space-y-3">
                        <Link to={getDashboardLink()} {...mobileLinkProps} className="flex items-center gap-4 p-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors">
                            <LayoutDashboard className="w-5 h-5" /> Dashboard
                        </Link>
                        <Link to="/settings" {...mobileLinkProps} className="flex items-center gap-4 p-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors">
                            <Settings className="w-5 h-5" /> Settings
                        </Link>
                        <button 
                            onClick={() => { handleLogout(); setIsOpen(false); }} 
                            className="w-full flex items-center gap-4 p-3 rounded-lg text-lg font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm mt-4"
                        >
                            <LogOut className="w-5 h-5" /> 
                            Sign Out
                        </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 mt-4">
                        <Link to="/login" {...mobileLinkProps} className="w-full">
                            <Button variant="outline" className="w-full py-6 text-lg">Login</Button>
                        </Link>
                        <Link to="/register" {...mobileLinkProps} className="w-full">
                             <Button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-6 text-lg">Sign Up</Button>
                        </Link>
                    </div>
                  )}
                </motion.div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { cartItems, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);
  
  const isDashboard = location.pathname.startsWith('/admin-dashboard');
  if (isDashboard) return null;

  return (
    <>
    <motion.nav 
      className="bg-white/80 shadow-md sticky top-0 z-40 backdrop-blur-md"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div whileHover={{ scale: 1.05, rotate: -5 }} whileTap={{scale: 0.95}}>
              <img src="https://horizons-cdn.hostinger.com/1ff2a2eb-9cef-439f-b1c4-73368cb28fdf/dee3e90e0fad3a78c5aad3fa165b27b3.jpg" alt="Golden Acres Logo" className="h-16 w-auto rounded-full" />
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center space-x-8 font-medium">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/marketplace">Marketplace</NavLink>
            <NavLink to="/logistics">Logistics</NavLink>
            <NavLink to="/blog">Blog</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              {user && profile ? (
                <DropdownMenu profile={profile} handleLogout={handleLogout} />
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
             <motion.button whileHover={{scale: 1.1}} whileTap={{scale: 0.9}} variant="ghost" size="icon" className="relative p-2 rounded-full" onClick={() => setIsCartOpen(true)}>
                <ShoppingCartIcon className="h-6 w-6" />
                <AnimatePresence>
                {totalItems > 0 && (
                    <motion.span 
                        initial={{scale: 0}}
                        animate={{scale: 1}}
                        exit={{scale: 0}}
                        transition={{type: 'spring', stiffness: 500, damping: 20}}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                        {totalItems}
                    </motion.span>
                )}
                </AnimatePresence>
            </motion.button>
             <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: -45 }}
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden text-gray-700 p-2"
                aria-label="Open menu"
            >
                <Menu className="w-6 h-6" />
            </motion.button>
          </div>

        </div>
      </div>
    </motion.nav>
    <MobileMenu isOpen={isOpen} setIsOpen={setIsOpen} user={user} profile={profile} handleLogout={handleLogout} />
    </>
  );
};

export default Navbar;
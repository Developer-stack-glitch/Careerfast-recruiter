'use client';
import { message } from "antd";
import { useEffect, useState, useLayoutEffect } from "react";
import { useNavigate } from "@/routing-shim";
import { motion } from "framer-motion";
import logo from "../images/careerfastlogofinal.png";
import { getImageUrl } from "../utils/getImageUrl";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(null); // null: checking, true: auth, false: unauth
    const [roleId, setRoleId] = useState(null);

    useLayoutEffect(() => {
        const checkAuth = () => {
            try {
                const stored = localStorage.getItem("loginDetails");
                const token = localStorage.getItem("AccessToken");
                
                // Extremely strict check for truthy values
                if (stored && stored !== "null" && stored !== "undefined" && token && token !== "null" && token !== "undefined") {
                    const loginDetails = JSON.parse(stored);
                    
                    if (loginDetails && typeof loginDetails === 'object' && loginDetails.role_id) {
                        const rid = Number(loginDetails.role_id);
                        
                        if (!allowedRoles || allowedRoles.map(Number).includes(rid)) {
                            setRoleId(rid);
                            setIsAuthenticated(true);
                            return;
                        }
                    }
                }
                
                // If any check fails
                setIsAuthenticated(false);
                setRoleId(null);
            } catch (error) {
                console.error("Auth check error:", error);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, [allowedRoles]);

    useEffect(() => {
        if (isAuthenticated === false) {
            if (!localStorage.getItem("loginDetails") || !localStorage.getItem("AccessToken")) {
                navigate("/login", { replace: true });
                message.warning("Please login to access this section.");
            } else if (allowedRoles && !allowedRoles.includes(roleId)) {
                navigate("/", { replace: true });
                message.error("Unauthorized access. This section is reserved for specific accounts only.");
            }
        }
    }, [isAuthenticated, roleId, navigate, allowedRoles]);

    // Show premium loader while checking
    if (isAuthenticated === null) {
        return (
            <div style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(255, 255, 255, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000,
                backdropFilter: 'blur(10px)'
            }}>
                <motion.div
                    initial={{ opacity: 0.3, scale: 0.95 }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1, 0.95] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{ textAlign: 'center' }}
                >
                    <img 
                        src={getImageUrl(logo)} 
                        alt="CareerFast Logo" 
                        style={{ width: 180, objectFit: 'contain' }} 
                    />
                </motion.div>
            </div>
        );
    }

    if (isAuthenticated === false) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;


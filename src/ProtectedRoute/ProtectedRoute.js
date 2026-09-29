'use client';
import { message } from "antd";
import { useEffect, useState, useLayoutEffect } from "react";
import { useNavigate } from "@/routing-shim";
import CommonLoader from "../Common/CommonLoader";

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
        return <CommonLoader fullScreen={true} text="Verifying Recruiter Access..." />;
    }

    if (isAuthenticated === false) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;


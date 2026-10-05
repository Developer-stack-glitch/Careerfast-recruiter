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
                if (typeof window !== "undefined") {
                    const urlParams = new URLSearchParams(window.location.search);
                    const incomingToken = urlParams.get("token") || urlParams.get("impersonate_token");
                    const incomingData = urlParams.get("data") || urlParams.get("impersonate_data");

                    if (incomingToken) {
                        localStorage.setItem("AccessToken", incomingToken);
                        document.cookie = `AccessToken=${incomingToken}; path=/; max-age=86400`;

                        if (incomingData) {
                            try {
                                const parsed = JSON.parse(decodeURIComponent(incomingData));
                                localStorage.setItem("loginDetails", JSON.stringify(parsed));
                                document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(parsed))}; path=/; max-age=86400`;
                            } catch (e) {
                                try {
                                    const parsed = JSON.parse(incomingData);
                                    localStorage.setItem("loginDetails", JSON.stringify(parsed));
                                    document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(parsed))}; path=/; max-age=86400`;
                                } catch (e2) {}
                            }
                        }

                        // Clean up URL query parameters without reloading
                        const cleanUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    }
                }

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
        } else if (isAuthenticated === true) {
            // Live session & suspension check
            const checkLiveSession = async () => {
                try {
                    const { verifySession } = await import("../ApiService/action");
                    await verifySession();
                } catch (err) {
                    // Axios interceptor will catch 403 suspension / 401 expiration and show modal
                }
            };

            checkLiveSession();
            const intervalId = setInterval(checkLiveSession, 12000); // Heartbeat check every 12 seconds
            return () => clearInterval(intervalId);
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


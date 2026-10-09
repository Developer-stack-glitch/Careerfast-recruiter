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

                        let parsed = null;
                        if (incomingData) {
                            try {
                                parsed = JSON.parse(decodeURIComponent(incomingData));
                            } catch (e) {
                                try {
                                    parsed = JSON.parse(incomingData);
                                } catch (e2) {}
                            }
                        }

                        if (!parsed) {
                            try {
                                const base64Url = incomingToken.split('.')[1];
                                if (base64Url) {
                                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                                    const jwtPayload = JSON.parse(jsonPayload);
                                    parsed = {
                                        id: jwtPayload.id,
                                        email: jwtPayload.email,
                                        role_id: jwtPayload.role_id || 3,
                                        role_name: 'recruiter',
                                        first_name: jwtPayload.first_name || 'Recruiter',
                                        is_email_verified: 1,
                                        impersonated_by_admin: true
                                    };
                                }
                            } catch (e) {}
                        }

                        if (parsed) {
                            const safeParsed = { ...parsed };
                            if (safeParsed.profile_image && (safeParsed.profile_image.startsWith('data:') || safeParsed.profile_image.length > 500)) {
                                delete safeParsed.profile_image;
                            }
                            safeParsed.is_email_verified = 1;
                            localStorage.setItem("loginDetails", JSON.stringify(safeParsed));
                            document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(safeParsed))}; path=/; max-age=86400`;
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


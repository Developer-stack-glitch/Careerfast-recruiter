'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { storeLoginStatus } from '../Redux/Slice';
import { isTokenExpired, ShowModal } from '../ApiService/action';

export default function ClientRouteHandler({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(state => state.loginstatus);
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (stored) {
        const loginDetails = JSON.parse(stored);
        setRoleId(loginDetails.role_id);
      }
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
    }

    const checkToken = () => {
      const AccessToken = localStorage.getItem("AccessToken");
      if (AccessToken && isTokenExpired(AccessToken)) {
        ShowModal();
        localStorage.removeItem("AccessToken");
      }
    };

    checkToken();
    const intervalId = setInterval(checkToken, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isCheckingMaintenance, setIsCheckingMaintenance] = useState(true);

  useEffect(() => {
    const fetchMaintenanceSettings = async () => {
      try {
        const { getSettings } = await import('../ApiService/action');
        const res = await getSettings();
        if (res?.data?.success) {
          const mode = res.data.data.find(s => s.settingKey === 'maintenance_mode');
          if (mode && (mode.settingValue === 'true' || mode.settingValue === true)) {
            setMaintenanceMode(true);
          }
        }
      } catch (error) {
        console.warn("Failed to check maintenance mode:", error?.message || error);
      } finally {
        setIsCheckingMaintenance(false);
      }
    };
    fetchMaintenanceSettings();
  }, []);

  useEffect(() => {
    // ... existing token effect ...
    const handleTokenExpire = () => {
      router.push("/login");
    };

    window.addEventListener("tokenExpireUpdated", handleTokenExpire);
    return () => {
      window.removeEventListener("tokenExpireUpdated", handleTokenExpire);
    };
  }, [router]);

  useEffect(() => {
    const AccessToken = localStorage.getItem("AccessToken");
    const pathSegments = pathname.split("/").filter(Boolean);
    const pathName = pathSegments[0] || "";

    if (AccessToken) {
      if (!isLoggedIn) dispatch(storeLoginStatus(true));

      let isRecruiter = false;
      let isVerified = false;
      try {
        const stored = localStorage.getItem("loginDetails");
        if (stored) {
          const loginDetails = JSON.parse(stored);
          isRecruiter = loginDetails?.role?.name === "RECRUITER" || loginDetails?.role_name === "RECRUITER" || Number(loginDetails?.role_id) === 3 || Number(loginDetails?.role_id) === 1;
          isVerified = !!loginDetails?.is_email_verified;
        }
      } catch (e) { }

      // If authenticated user visits login or register, redirect to overview
      if (pathName === "login" || pathName === "register") {
        router.replace("/overview");
        return;
      }

      if (isRecruiter) {
        // Create-profile page is removed; redirect any direct visits to recruiter overview
        if (pathname === "/create-profile" || pathname === "/create-hr-profile") {
          router.replace("/overview");
          return;
        }

        // Redirect old /recruiter/... bookmarks to the new root structure
        if (pathName === "recruiter") {
          const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
          const newPath = (pathname.replace(/^\/recruiter/, '') || '/overview') + search;
          router.replace(newPath);
          return;
        }

        // Allow them to navigate freely in their dedicated portal
        return;
      }

      // If token exists but is not recruiter/admin
      router.replace("/login");
    } else {
      if (isLoggedIn) dispatch(storeLoginStatus(false));
      const publicPaths = ["login", "register", "forgot-password", "reset-password"];
      if (!publicPaths.includes(pathName)) {
        router.replace("/login");
      }
    }
  }, [pathname, dispatch, isLoggedIn, searchParams, router]);

  if (isCheckingMaintenance) return null; // Avoid flicker

  const isExemptPath = pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/superadmin');
  if (maintenanceMode && !isExemptPath) {
    const Maintenance = require('../Components/Maintenance').default;
    return <Maintenance />;
  }

  return <>{children}</>;
}

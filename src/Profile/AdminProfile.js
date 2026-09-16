'use client';
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "@/routing-shim";
import { Layout, Menu, Progress, Avatar, Modal, Badge, Button } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import "../css/Profile.css";
import { FaUserPen } from "react-icons/fa6";
import { FaRegHeart } from "react-icons/fa";
import { FaListOl } from "react-icons/fa";
import { FcApproval } from "react-icons/fc";
import { FiEdit } from "react-icons/fi";
import WatchList from "./WatchList";
import RecentlyViewed from "./RecentlyViewed";
import MainProfile from "./MainProfile";
import Settings from "./Settings";
import "react-calendar-heatmap/dist/styles.css";
import ProSubscription from "./ProSubscription";
import BookMark from "./BookMark";
import AppliedJobs from "./AppliedJobs";
import AccountSettings from "./AccountSettings";
import {
  getUserProfile,
} from "../ApiService/action";
import { GrUserSettings } from "react-icons/gr";
import logo from "../images/careerfastlogofinal.png";

const { Sider } = Layout;

const siderStyle = {
  overflow: "auto",
  height: "100vh",
  position: "sticky",
  insetInlineStart: 0,
  top: 0,
  bottom: 0,
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

export default function UserProfile() {
  const { activeTab } = useParams();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [sideBar, setSideBar] = useState(activeTab || "mainprofile");
  const [loginUserId, setLoginUserId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [roleId, setRoleId] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const menuItems = [
    { key: "mainprofile", icon: <FaUserPen />, label: "Your profile" },
    { key: "wishlist", icon: <FaRegHeart />, label: "Wishlist" },
    { key: "applied", icon: <FaListOl />, label: "Applied Jobs" },

    {
      key: "accountsettings",
      icon: <GrUserSettings />,
      label: "Account Settings",
    },
    { key: "settings", icon: <SettingOutlined />, label: "Settings" },
    {
      key: "prosubscription",
      icon: <FcApproval />,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>Pro Subscription</span>
        </div>
      ),
    },
  ];

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (stored) {
        const loginDetails = JSON.parse(stored);

        // Let candidates (roleId === 2) and superadmin (roleId === 1) access this profile page.
        // Recruiters (roleId === 3) should be redirected or handled elsewhere, but for now we'll allow roleId 1 and 2.
        if (loginDetails.role_id === 3) {
          if (typeof window !== 'undefined') window.location.href = "/";
          return;
        }
        if (loginDetails.role_id === 1) {
          if (typeof window !== 'undefined') window.location.href = "/admin";
          return;
        }

        setLoginUserId(loginDetails.id);
        setRoleId(loginDetails.role_id);
        const storedImage = localStorage.getItem("profileImage");
        if (storedImage && storedImage !== "") {
          setAvatarUrl(storedImage);
        } else {
          setAvatarUrl(null);
        }
      } else {
        if (typeof window !== 'undefined') window.location.href = "/login";
      }
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
      if (typeof window !== 'undefined') window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    if (activeTab) {
      setSideBar(activeTab);
    } else {
      setSideBar("mainprofile");
    }
  }, [activeTab]);

  useEffect(() => {
    console.log("loginUserId updated", loginUserId);
    if (loginUserId !== null && loginUserId !== undefined) {
      getUserProfileData();
    }
  }, [loginUserId]);

  const getUserProfileData = async () => {
    const payload = {
      user_id: loginUserId,
    };

    try {
      const response = await getUserProfile(payload);
      console.log("getUserProfile", response);
      if (response?.data?.data) {
        const profile = response.data.data;
        const image = profile.profile_image || null;
        setAvatarUrl(image);
        setFname(profile.first_name || "");
        setEmail(profile.email || "");
        setLname(profile.last_name || "");
        localStorage.setItem("profileImage", image || "");
      }
    } catch (error) {
      console.log("getuserprofile errorddd", error);
    }
  };

  return (
    <Layout className="profile-layout">
      {/* Sidebar */}
      <Sider
        style={siderStyle}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={240}
        className="profile-sider"
        breakpoint="lg"
      >
        <div className="profile-card-sidebar">
          <div className="sidebar-logo-container" onClick={() => navigate("/")}>
            <img src={typeof logo === 'string' ? logo : logo?.src} alt="CareerFast Logo" className="sidebar-logo" />
          </div>
          <div className="avatar-wrapper">
            <Avatar
              size={84}
              src={avatarUrl}
              onClick={() => setIsImageModalOpen(true)}
              className="profile-avatar"
            />
            <div className="active-status-dot"></div>
          </div>
          <h3 className="profile-name">
            {fname} {lname}
          </h3>
          <p className="profile-email">{email}</p>
        </div>

        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={["1"]}
          items={menuItems}
          selectedKeys={[sideBar]}
          onClick={(e) => navigate(`/candidate-profile/${e.key}`)}
          className="profile-menu"
        />
      </Sider>

      <Layout style={{ background: "none" }} className="profile-content-layout">
        <div style={{ flex: 1, padding: "24px" }}>
          {sideBar === "mainprofile" ? (
            <MainProfile />
          ) : sideBar === "wishlist" ? (
            <WatchList />
          ) : sideBar === "bookmarked" ? (
            <BookMark />
          ) : sideBar === "viewed" ? (
            <RecentlyViewed />
          ) : sideBar === "settings" ? (
            <Settings />
          ) : sideBar === "accountsettings" ? (
            <AccountSettings />
          ) : sideBar === "prosubscription" ? (
            <ProSubscription />
          ) : sideBar === "applied" ? (
            <AppliedJobs />
          ) : (
            ""
          )}
        </div>

        {/* Modal for image preview */}
        <Modal
          open={isImageModalOpen}
          footer={null}
          onCancel={() => setIsImageModalOpen(false)}
          centered
        >
          {avatarUrl && (
            <img
              alt="Profile"
              src={avatarUrl}
              style={{
                width: "100%",
                height: "400px",
                objectFit: "contain",
                borderRadius: "10px",
              }}
            />
          )}
        </Modal>
      </Layout>
    </Layout>
  );
}

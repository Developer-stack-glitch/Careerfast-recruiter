'use client';
import React from "react";
import { Avatar } from "antd";

export default function Profile({ profileImage }) {
  return (
    <Avatar
      size={80}
      src={profileImage || "https://i.imgur.com/your-avatar.png"}
      className="profile-avatar"
    />
  );
}


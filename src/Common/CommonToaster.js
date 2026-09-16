'use client';
// src/toaster.js
import toast from "react-hot-toast";

export const CommonToaster = (message, type) => {
  toast.dismiss(); // This will dismiss all current toasts
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "info":
      toast(message, { icon: 'ℹ️' });
      break;
    case "warning":
      toast(message, { icon: '⚠️' });
      break;
    default:
      toast(message);
      break;
  }
};

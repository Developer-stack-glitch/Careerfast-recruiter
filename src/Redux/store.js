'use client';
import { configureStore } from "@reduxjs/toolkit";
import { loginStatusReducer } from "./Slice";

export const store = configureStore({
  devTools: true,
  reducer: {
    loginstatus: loginStatusReducer,
  },
});


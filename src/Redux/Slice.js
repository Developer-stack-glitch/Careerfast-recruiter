'use client';
import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const loginstatus = false;
const loginStatusSlice = createSlice({
  name: "loginstatus",
  initialState: loginstatus,
  reducers: {
    storeLoginStatus(state, action) {
      state = action.payload;
      return state;
    },
  },
});

//define slice
export const { storeLoginStatus } = loginStatusSlice.actions;

//create reducer
export const loginStatusReducer = loginStatusSlice.reducer;


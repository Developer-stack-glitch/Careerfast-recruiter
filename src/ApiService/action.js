'use client';
import axios from "axios";
import { Modal } from "antd";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

let isModalVisible = false;
let modalInstance = null;

api.interceptors.request.use(
  (config) => {
    const AccessToken = localStorage.getItem("AccessToken");

    if (AccessToken) {
      const expired = isTokenExpired(AccessToken);

      if (expired) {
        ShowModal();

        localStorage.removeItem("AccessToken");

        // ❌ Cancel request — do NOT continue
        return Promise.reject({
          response: {
            status: 401,
            data: { message: "TokenExpired" },
          },
        });
      }

      config.headers.Authorization = `Bearer ${AccessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("Interceptor caught error:", error?.response?.status);
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log("Triggering ShowModal from interceptor");
      ShowModal();
      localStorage.removeItem("AccessToken");
    }
    return Promise.reject(error);
  }
);

// TokenExpired
export const isTokenExpired = (token) => {
  if (!token) return true; // No token means it's "expired"

  try {
    // split the token into parts
    const payloadBase64 = token.split(".")[1];

    // decode the base64 payload
    const decodedPayload = JSON.parse(atob(payloadBase64));

    // get the current time in seconds
    const currentTime = Date.now() / 1000;

    // check if the token has expired
    return decodedPayload.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
};

// modal
export const ShowModal = () => {
  console.log("ShowModal called.");
  
  if (document.getElementById('session-expired-modal')) {
    return;
  }

  const modalHtml = `
    <div id="session-expired-modal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
        <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">Session Expired</h3>
        <p class="text-sm text-gray-500 mb-6">Your session has expired. Please log in again to continue.</p>
        <button id="session-login-btn" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
          Login
        </button>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = modalHtml;
  document.body.appendChild(div);

  document.getElementById('session-login-btn').addEventListener('click', () => {
    div.remove();
    handleSessionModal();
  });
};

const handleSessionModal = () => {
  const event = new Event("tokenExpireUpdated");
  window.dispatchEvent(event);
  if (modalInstance) {
    modalInstance.destroy(); // Manually close the modal
    modalInstance = null;
  }
  isModalVisible = false;
};

// getRoles

export const getRoles = async () => {
  try {
    const response = await api.get("/api/getRoles");
    return response;
  } catch (error) {
    throw error;
  }
};

export const login = async (payload) => {
  try {
    const response = await api.post("/api/login", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// getUsers

export const getUsers = async (payload) => {
  try {
    const response = await api.get("/api/getUsers", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};


export const googleLogin = async (data) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
      data
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const register = async (registerload) => {
  try {
    const response = await api.post("/api/createUser", registerload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getOrganizationType = async () => {
  try {
    const response = await api.get("/api/organization/type/get");
    return response;
  } catch (error) {
    throw error;
  }
};

export const getJobNature = async () => {
  try {
    const response = await api.get("/api/job/getJobNature");
    return response;
  } catch (error) {
    throw error;
  }
};

export const getDurationTypes = async () => {
  try {
    const response = await api.get("/api/job/durationTypes/get");
    return response;
  } catch (error) {
    throw error;
  }
};

export const getDuration = async (payload) => {
  try {
    const response = await api.get("/api/getDuration", { params: payload });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getWorkPlaceType = async () => {
  try {
    const response = await api.get("/api/job/workplace-type/get");
    return response;
  } catch (error) {
    throw error;
  }
};

export const getVenues = async () => {
  try {
    const response = await api.get("/api/venue/get");
    return response;
  } catch (error) {
    throw error;
  }
};

export const addVenue = async (payload) => {
  try {
    const response = await api.post("/api/venue/create", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getTeamMembers = async () => {
  try {
    const response = await api.get("/api/team-member/get");
    return response;
  } catch (error) {
    throw error;
  }
};

export const addTeamMember = async (payload) => {
  try {
    const response = await api.post("/api/team-member/create", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteTeamMember = async (id) => {
  try {
    const response = await api.delete(`/api/team-member/delete/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getWorkPlaceLocation = async () => {
  try {
    const response = await api.get("/api/job/workLocation/get");
    return response;
  } catch (error) {
    throw error;
  }
};

export const getBenifitsData = async () => {
  try {
    const response = await api.get("/api/getBenefits");
    return response;
  } catch (error) {
    throw error;
  }
};

export const getGenderData = async () => {
  try {
    const response = await api.get("/api/getGender");
    return response;
  } catch (error) {
    throw error;
  }
};

export const getEligibilityData = async () => {
  try {
    const response = await api.get("/api/getEligibility");
    return response;
  } catch (error) {
    throw error;
  }
};

export const getYears = async () => {
  try {
    const response = await api.get("/api/getYears");
    return response;
  } catch (error) {
    throw error;
  }
};

export const getSalaryData = async () => {
  try {
    const response = await api.get("/api/getSalaryType");
    return response;
  } catch (error) {
    throw error;
  }
};

export const getSkillsData = async () => {
  try {
    const response = await api.get("/api/getSkills");
    return response;
  } catch (error) {
    throw error;
  }
};

export const getJobCategoryData = async (payload) => {
  try {
    const response = await api.get("/api/getJobCategories", { params: payload });
    return response;
  } catch (error) {
    throw error;
  }
};

// job post (post api)

export const createJobPost = async (jobPostPayload) => {
  try {
    const response = await api.post("/api/jobPosting", jobPostPayload);
    return response;
  } catch (error) {
    throw error;
  }
};

// closing registration api

export const closeRegistration = async (token) => {
  try {
    const response = await api.put(
      "/api/registrationClose",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

// forgot pass

// Step 1: Send OTP
export const sendOtp = async (payload) => {
  try {
    const response = await api.post("/api/sendOTP", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// Step 2: Verify OTP
export const verifyOtp = async (payload) => {
  try {
    const response = await api.post("/api/verifyOTP", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// Step 3: Reset Password
export const forgotPassword = async (payload) => {
  try {
    const response = await api.put("/api/forgotPassword", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// insert profile

export const insertProfileData = async (payload) => {
  try {
    const response = await api.post("/api/insertProfile", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getHrProfileData = async (userId) => {
  try {
    const response = await api.get(`/api/getHrProfile/${userId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const insertHrProfileData = async (payload) => {
  try {
    const response = await api.post("/api/insertHrProfile", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// verify email

export const verifyEmail = async (payload) => {
  try {
    const response = await api.post("/api/VerifyEmail", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// getJobPostByUserId

export const getJobPostByUserId = async (payload) => {
  try {
    const response = await api.get("/api/getJobPostByUserId", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// deleteJobPost

export const deleteJobPost = async (payload) => {
  try {
    const response = await api.delete("/api/deleteJobPost", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const expireJobPost = async (payload) => {
  try {
    const response = await api.put("/api/registrationClose", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response;
  } catch (error) {
    console.error("❌ Error expiring job:", error);
    throw error;
  }
};

export const makeJobActive = async (payload) => {
  try {
    const response = await api.put("/api/makeJobActive", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response;
  } catch (error) {
    console.error("❌ Error making job active:", error);
    throw error;
  }
};

// getUserType

export const getUserTypeData = async () => {
  try {
    const response = await api.get("/api/getUserType");
    return response;
  } catch (error) {
    throw error;
  }
};

// updateResume

export const updateResume = async (payload) => {
  try {
    const response = await api.put("/api/updateResume", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// updateAbout

export const updateAbout = async (payload) => {
  try {
    const response = await api.put("/api/updateAbout", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// updateSkills

export const updateSkills = async (payload) => {
  try {
    const response = await api.put("/api/updateSkills", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// insertProjects

export const insertProjects = async (payload) => {
  try {
    const response = await api.post("/api/insertProjects", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// updateProject

export const updateProject = async (payload) => {
  try {
    const response = await api.put("/api/updateProject", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// deleteProject

export const deleteProject = async (payload) => {
  try {
    const response = await api.delete("/api/deleteProject", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// updateSocialLinks

export const updateSocialLinks = async (payload) => {
  try {
    const response = await api.put("/api/updateSocialLinks", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// updateBasicDetails

export const updateBasicDetails = async (payload) => {
  try {
    const response = await api.put("/api/updateBasicDetails", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// updateEducation

export const updateEducation = async (payload) => {
  try {
    const response = await api.put("/api/updateEducation", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// insertEducation

export const insertEducation = async (payload) => {
  try {
    const response = await api.post("/api/insertEducation", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// deleteEducation

export const deleteEducation = async (payload) => {
  try {
    const response = await api.delete("/api/deleteEducation", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// insertExperience

export const insertExperience = async (payload) => {
  try {
    const response = await api.post("/api/insertExperience", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// updateExperience

export const updateExperience = async (payload) => {
  try {
    const response = await api.put("/api/updateExperience", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// deleteExperience

export const deleteExperience = async (payload) => {
  try {
    const response = await api.delete("/api/deleteExperience", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// getUserProfile

export const getUserProfile = async (payload) => {
  try {
    const response = await api.get("/api/getUserProfile", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// getQualification

export const getQualification = async () => {
  try {
    const response = await api.get("/api/getQualification");
    return response;
  } catch (error) {
    throw error;
  }
};

// getCourses

export const getCourses = async () => {
  try {
    const response = await api.get("/api/getCourses");
    return response;
  } catch (error) {
    throw error;
  }
};

// getSpecialization

export const getSpecialization = async () => {
  try {
    const response = await api.get("/api/getSpecialization");
    return response;
  } catch (error) {
    throw error;
  }
};

// getColleges

export const getColleges = async () => {
  try {
    const response = await api.get("/api/getColleges");
    return response;
  } catch (error) {
    throw error;
  }
};

// getCourseType

export const getCourseType = async () => {
  try {
    const response = await api.get("/api/getCourseType");
    return response;
  } catch (error) {
    throw error;
  }
};

// getJobPosts

export const getJobPosts = async (payload) => {
  try {
    const response = await api.post("/api/getJobPosts", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// applyForJob

export const applyForJob = async (payload) => {
  try {
    const response = await api.post("/api/applyForJob", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// getJobAppliedCandidates

export const getJobAppliedCandidates = async (payload) => {
  try {
    const response = await api.get("/api/getJobAppliedCandidates", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// getAllAppliedCandidates

export const getAllAppliedCandidates = async (payload) => {
  try {
    const response = await api.get("/api/getAllAppliedCandidates", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// checkIsJobApplied

export const checkIsJobApplied = async (payload) => {
  try {
    const response = await api.get("/api/checkIsJobApplied", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// isProfileUpdated

export const isProfileUpdated = async (payload) => {
  try {
    const response = await api.get("/api/isProfileUpdated", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// saveJobPost

export const saveJobPost = async (payload) => {
  try {
    const response = await api.post("/api/saveJobPost", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// getBillingPlans

export const getBillingPlans = async (token) => {
  try {
    const response = await api.get("/api/getBillingPlans", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// updateBillingPlan

export const updateBillingPlan = async (payload, token) => {
  try {
    const response = await api.put("/api/updateBillingPlan", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// getSavedJobs

export const getSavedJobs = async (payload) => {
  try {
    const response = await api.get("/api/getSavedJobs", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// removeSavedJobs

export const removeSavedJobs = async (payload) => {
  try {
    const response = await api.delete("/api/removeSavedJobs", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// checkIsJobSaved

export const checkIsJobSaved = async (payload) => {
  try {
    const response = await api.get("/api/checkIsJobSaved", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// updateProfileImage

export const updateProfileImage = async (payload) => {
  try {
    const response = await api.put("/api/updateProfileImage", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// updateBanner

export const updateBanner = async (payload) => {
  try {
    const response = await api.put("/api/updateBanner", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// getUserAppliedJobs

export const getUserAppliedJobs = async (payload) => {
  try {
    const response = await api.get("/api/userAppliedJobs", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// searchByKeyword

export const searchByKeyword = async (payload) => {
  try {
    const response = await api.get("/api/searchByKeyword", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// updateJobBasicDetails

export const updateJobBasicDetails = async (payload) => {
  try {
    const response = await api.put("/api/updateJobBasicDetails", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// updateJobNature

export const updateJobNature = async (payload) => {
  try {
    const response = await api.put("/api/updateJobNature", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// updateEligibility

export const updateEligibility = async (payload) => {
  try {
    const response = await api.put("/api/updateEligibility", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// updateJobDescription

export const updateJobDescription = async (payload) => {
  try {
    const response = await api.put("/api/updateJobDescription", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// updateUserAppliedJobStatus

export const updateUserAppliedJobStatus = async (payload) => {
  try {
    const response = await api.put("/api/updateUserAppliedJobStatus", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// getUserJobPostStatus

export const getUserJobPostStatus = async (payload) => {
  try {
    const response = await api.get("/api/getUserJobPostStatus", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// changePassword

export const changePassword = async (payload) => {
  try {
    const response = await api.put("/api/changePassword", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// getAppliedCandidatesCount

export const getAppliedCandidatesCount = async (payload) => {
  try {
    const response = await api.get("/api/getAppliedCandidatesCount", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// StatsOfPost

export const StatsOfPost = async (payload) => {
  try {
    const response = await api.get("/api/StatsOfPost", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// getAllCandidateByRecruiter

export const getAllCandidateByRecruiter = async (payload) => {
  try {
    const response = await api.get("/api/getAllCandidateByRecruiter", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// dailyStreak

export const dailyStreak = async (payload) => {
  try {
    const response = await api.post("/api/dailyStreak", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// getDailyStreak

export const getDailyStreak = async (payload) => {
  try {
    const response = await api.get("/api/getDailyStreak", {
      params: payload,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// sendNotification (post notification)
export const sendNotification = async () => {
  try {
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/broadcast-notification`,
      {
        title: "New Job Post Created 🚀",
        body: "Check out the job post details and apply now!",
        link: "https://careerfast.in/",
        icon: "/favicon.png",
      }
    );
    return res.data;
  } catch (err) {
    console.error("❌ Error sending broadcast notification:", err);
    throw err;
  }
};


// subscribeTopic (FCM)
export const subscribeTopic = async (token) => {
  try {
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/subscribe-topic`,
      { token }
    );
    return res.data;
  } catch (err) {
    console.error("❌ Error subscribing to topic:", err);
    throw err;
  }
};

// recruiter notification + application save
export const userApplyJob = async (payload) => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/applyJob`,
      payload
    );
    return response;
  } catch (error) {
    console.error("❌ Error in applyJob:", error);
    throw error;
  }
};

// saveToken (store FCM token in backend)
export const saveToken = async (userId, token) => {
  try {
    const response = await api.post("/api/token/save-token", { userId, token });
    return response.data;
  } catch (error) {
    console.error("❌ Error saving token:", error);
    throw error;
  }
};


// ===================== EVENTS =====================

// Create Event
// ✅ Create Event (Base64 JSON)
export const createEvent = async (data) => {
  try {
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/events`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return res;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};


// Get All Events
export const getAllEvents = async () => {
  try {
    const response = await api.get("/api/events");
    return response;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

// Delete Event by ID
export const deleteEvent = async (id) => {
  try {
    const response = await api.delete(`/api/events/${id}`);
    return response;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};


// ===================== EVENT REGISTRATION =====================

// ✅ Register a user for an event
export const registerForEvent = async (payload) => {
  try {
    const response = await api.post("/api/event-registration/register", payload);
    return response;
  } catch (error) {
    console.error("❌ Error registering for event:", error);
    throw error;
  }
};

// ✅ Get all registered events for a specific user
export const getUserRegisteredEvents = async (userId) => {
  try {
    const response = await api.get(`/api/event-registration/user/${userId}`);
    return response;
  } catch (error) {
    console.error("❌ Error fetching user registered events:", error);
    throw error;
  }
};

// ✅ Check if a user is already registered for a specific event
export const checkIsRegistered = async (userId, eventId) => {
  try {
    const response = await api.get(`/api/event-registration/check`, {
      params: { userId, eventId },
    });
    return response;
  } catch (error) {
    console.error("❌ Error checking registration:", error);
    throw error;
  }
};


// ===================== WORKSHOPS =====================

// ✅ Create Workshop
export const createWorkshop = async (data) => {
  try {
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/workshops`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return res;
  } catch (error) {
    console.error("❌ Error creating workshop:", error);
    throw error;
  }
};

// ✅ Get All Workshops
export const getAllWorkshops = async () => {
  try {
    const response = await api.get("/api/workshops");
    return response;
  } catch (error) {
    console.error("❌ Error fetching workshops:", error);
    throw error;
  }
};

// ✅ Delete Workshop by ID
export const deleteWorkshop = async (id) => {
  try {
    const response = await api.delete(`/api/workshops/${id}`);
    return response;
  } catch (error) {
    console.error("❌ Error deleting workshop:", error);
    throw error;
  }
};


// ===================== WORKSHOP REGISTRATION =====================

// ✅ Register a user for a workshop
export const registerForWorkshop = async (payload) => {
  try {
    const response = await api.post("/api/workshop-registration/register", payload);
    return response;
  } catch (error) {
    console.error("❌ Error registering for workshop:", error);
    throw error;
  }
};

// ✅ Get all registered workshops for a specific user
export const getUserRegisteredWorkshops = async (userId) => {
  try {
    const response = await api.get(`/api/workshop-registration/user/${userId}`);
    return response;
  } catch (error) {
    console.error("❌ Error fetching user registered workshops:", error);
    throw error;
  }
};

// ✅ Check if a user is already registered for a specific workshop
export const checkIsRegisteredWorkshop = async (userId, workshopId) => {
  try {
    const response = await api.get(`/api/workshop-registration/check`, {
      params: { userId, workshopId },
    });
    return response;
  } catch (error) {
    console.error("❌ Error checking workshop registration:", error);
    throw error;
  }
};


// ===================== COURSES =====================

// ✅ Create Course (Base64)
export const createCourse = async (data) => {
  try {
    const res = await api.post("/api/courses", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error creating course:", error);
    throw error;
  }
};

// ✅ Get all Courses
export const getAllCourses = async (params) => {
  try {
    const response = await api.get("/api/courses", { params });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    throw error;
  }
};


// ===================== BLOGS =====================

// Add Blog
export const addBlog = async (data) => {
  try {
    const response = await api.post("/api/blogs/add", data);
    return response;
  } catch (error) {
    console.error("❌ Error adding blog:", error);
    throw error;
  }
};

// Update Blog
export const updateBlog = async (id, data) => {
  try {
    const response = await api.put(`/api/blogs/update/${id}`, data);
    return response;
  } catch (error) {
    console.error("❌ Error updating blog:", error);
    throw error;
  }
};

// Get All Blogs
export const getBlogs = async () => {
  try {
    const response = await api.get("/api/blogs/all-blogs");
    return response;
  } catch (error) {
    console.error("❌ Error fetching blogs:", error);
    throw error;
  }
};

// Get Single Blog
export const getBlogById = async (id) => {
  try {
    const response = await api.get(`/api/blogs/${id}`);
    return response;
  } catch (error) {
    console.error("❌ Error fetching blog:", error);
    throw error;
  }
};

// Delete Blog
export const deleteBlog = async (id, userId) => {
  try {
    const response = await api.delete(`/api/blogs/delete/${id}`, { data: { userId } });
    return response;
  } catch (error) {
    console.error("❌ Error deleting blog:", error);
    throw error;
  }
};

// Competition Registration
export const sendCompetitionRegistration = async (payload) => {
  try {
    const response = await api.post("/api/competitionRegistration", payload);
    return response;
  } catch (error) {
    console.error("❌ Error sending competition registration:", error);
    throw error;
  }
};

// Mentor Query
export const sendMentorQuery = async (payload) => {
  try {
    const response = await api.post("/api/mentorQuery", payload);
    return response;
  } catch (error) {
    console.error("❌ Error sending mentor query:", error);
    throw error;
  }
};

export const getHomePageStats = async () => {
  try {
    const response = await api.get("/api/getHomePageStats");
    return response;
  } catch (error) {
    console.error("❌ Error fetching home page stats:", error);
    throw error;
  }
};

export const getTrendingSearches = async () => {
  try {
    const response = await api.get("/api/getTrendingSearches");
    return response;
  } catch (error) {
    console.error("❌ Error fetching trending searches:", error);
    throw error;
  }
};

export const getUniqueCompanies = async () => {
  try {
    const response = await api.get("/api/getUniqueCompanies");
    return response;
  } catch (error) {
    console.error("❌ Error fetching unique companies:", error);
    throw error;
  }
};

export const getSuperAdminDashboardStats = async (timeFilter) => {
  try {
    const response = await api.get("/api/superadmin/dashboard-stats", {
      params: { timeFilter }
    });
    return response;
  } catch (error) {
    throw error;
  }
};
export const updateJobStatus = async (payload) => {
  try {
    const response = await api.post("/api/updateJobStatus", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

// HR Saved Candidates API
export const saveCandidateHR = async (payload) => {
  try {
    const response = await api.post("/api/job/saveCandidateHR", payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getSavedCandidatesHR = async () => {
  try {
    const response = await api.get("/api/job/getSavedCandidatesHR");
    return response;
  } catch (error) {
    throw error;
  }
};

export const removeSavedCandidateHR = async (candidate_id) => {
  try {
    const response = await api.delete("/api/job/removeSavedCandidateHR", {
      params: { candidate_id }
    });
    return response;
  } catch (error) {
    throw error;
  }
};


export const updateJobPosting = async (payload) => {
  try {
    const token = localStorage.getItem("AccessToken");
    if (!token) throw new Error("No AccessToken found");
    const response = await api.put("/api/updateJobPosting", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getPendingJobs = async (limit = 20, page = 1) => {
  try {
    const token = localStorage.getItem("AccessToken");
    if (!token) throw new Error("No AccessToken found");
    const response = await api.get("/api/getPendingJobs", {
      params: { limit, page },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const approveJobPost = async (id) => {
  try {
    const token = localStorage.getItem("AccessToken");
    if (!token) throw new Error("No AccessToken found");
    const response = await api.put(`/api/approveJob/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const approveAllPendingJobs = async () => {
  try {
    const token = localStorage.getItem("AccessToken");
    if (!token) throw new Error("No AccessToken found");
    const response = await api.put(`/api/approveAllJobs`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const rejectJobPost = async (id, reason) => {
  try {
    const token = localStorage.getItem("AccessToken");
    if (!token) throw new Error("No AccessToken found");
    const response = await api.put(`/api/rejectJob/${id}`, { reason }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getSettings = async () => {
  try {
    const response = await api.get("/api/settings/get");
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateSettings = async (payload) => {
  try {
    const token = localStorage.getItem("AccessToken");
    if (!token) throw new Error("No AccessToken found");
    const response = await api.put("/api/settings/update", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getIntegrations = async () => {
  try {
    const token = localStorage.getItem("AccessToken");
    if (!token) throw new Error("No AccessToken found");
    const response = await api.get("/api/integrations/get", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateIntegrations = async (payload) => {
  try {
    const token = localStorage.getItem("AccessToken");
    if (!token) throw new Error("No AccessToken found");
    const response = await api.put("/api/integrations/update", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateUserStatus = async (id, payload) => {
  try {
    const token = localStorage.getItem("AccessToken");
    if (!token) throw new Error("No AccessToken found");
    const response = await api.put(`/api/user/status/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const searchCandidatesAPI = async (payload) => {
  try {
    const response = await api.get("/api/candidates/search", { params: payload });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getCandidateFilterOptionsAPI = async () => {
  try {
    const response = await api.get("/api/candidates/filter-options");
    return response;
  } catch (error) {
    throw error;
  }
};

export const lookupCompaniesAPI = async (query = "") => {
  try {
    const response = await api.get("/api/candidates/companies-lookup", { params: { query } });
    return response;
  } catch (error) {
    throw error;
  }
};


export const getCandidateFoldersAPI = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/api/candidates/folders?${query}` : "/api/candidates/folders";
    const response = await api.get(url);
    return response;
  } catch (error) {
    throw error;
  }
};

export const createCandidateFolderAPI = async (payload) => {
  try {
    const body = typeof payload === "string" ? { name: payload } : payload;
    const response = await api.post("/api/candidates/folders", body);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateCandidateFolderAPI = async (folderId, payload) => {
  try {
    const response = await api.put(`/api/candidates/folders/${folderId}`, payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteCandidateFolderAPI = async (folderId) => {
  try {
    const response = await api.delete(`/api/candidates/folders/${folderId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getFolderCandidatesAPI = async (folderId, params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/api/candidates/folders/${folderId}/candidates?${query}` : `/api/candidates/folders/${folderId}/candidates`;
    const response = await api.get(url);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateFolderCandidateStageAPI = async (folderId, candidateId, stage) => {
  try {
    const response = await api.put(`/api/candidates/folders/${folderId}/candidates/stage`, { candidateId, stage });
    return response;
  } catch (error) {
    throw error;
  }
};

export const removeCandidateFromFolderAPI = async (folderId, candidateId) => {
  try {
    const response = await api.delete(`/api/candidates/folders/${folderId}/candidates/${candidateId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const addCandidatesToFolderAPI = async (folderIdentifier, candidateIds, stage = "prospect") => {
  try {
    const response = await api.post("/api/candidates/folders/add-candidates", { folderIdentifier, candidateIds, stage });
    return response;
  } catch (error) {
    throw error;
  }
};




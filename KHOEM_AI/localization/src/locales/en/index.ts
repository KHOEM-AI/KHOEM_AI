import type { TranslationTree } from "../../types/index.js";

// English = canonical source key schema.
const en: TranslationTree = {
  common: {
    save: "Save", cancel: "Cancel", close: "Close", open: "Open",
    confirm: "Confirm", delete: "Delete",
    items: { one: "{{count}} item", other: "{{count}} items" },
  },
  navigation: { home: "Home", settings: "Settings", profile: "Profile", dashboard: "Dashboard" },
  auth: { login: "Log in", logout: "Log out", register: "Register", forgotPassword: "Forgot password" },
  errors: {
    network: "Network error. Please check your connection.",
    notFound: "Not found", unauthorized: "Unauthorized",
    forbidden: "Forbidden", server: "Server error",
  },
  system: { loading: "Loading...", success: "Success", error: "Error" },
  welcome: { user: "Hello, {{name}}" },
  controlCenter: {
    killSwitch: "Kill Switch",
    systemStatus: "System status",
    killed: "KILLED",
    running: "RUNNING",
    kill: "Kill",
    resume: "Resume",
    execute: "Execute",
    reason: "Reason",
    created: "Created",
    expires: "Expires",
    permission: "permission",
    actor: "actor",
    time: "Time",
    approvalRequired: "Approval required",
    approvedAwaiting: "Approved (awaiting execution)",
  },
};
import app from "./app.js";
const merged: TranslationTree = { ...en, ...app };
export default merged;

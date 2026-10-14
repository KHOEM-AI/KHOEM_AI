import type { TranslationTree } from "../../types/index.js";

// Status: draft. Needs review by a native Khmer speaker before "verified".
const km: TranslationTree = {
  common: {
    save: "រក្សាទុក", cancel: "បោះបង់", close: "បិទ", open: "បើក",
    confirm: "បញ្ជាក់", delete: "លុប",
    items: { other: "{{count}} ធាតុ" },
  },
  navigation: { home: "ទំព័រដើម", settings: "ការកំណត់", profile: "ប្រវត្តិរូប", dashboard: "ផ្ទាំងគ្រប់គ្រង" },
  auth: { login: "ចូលគណនី", logout: "ចាកចេញ", register: "ចុះឈ្មោះ", forgotPassword: "ភ្លេចពាក្យសម្ងាត់" },
  errors: {
    network: "បញ្ហាបណ្ដាញ។ សូមពិនិត្យការតភ្ជាប់របស់អ្នក។",
    notFound: "រកមិនឃើញ", unauthorized: "មិនមានការអនុញ្ញាត",
    forbidden: "ហាមឃាត់", server: "កំហុសម៉ាស៊ីនមេ",
  },
  system: { loading: "កំពុងផ្ទុក...", success: "ជោគជ័យ", error: "កំហុស" },
  welcome: { user: "សួស្តី {{name}}" },
  controlCenter: {
    killSwitch: "កុងតាក់បញ្ឈប់បន្ទាន់",
    systemStatus: "ស្ថានភាពប្រព័ន្ធ",
    killed: "ត្រូវបានបញ្ឈប់",
    running: "កំពុងដំណើរការ",
    kill: "បញ្ឈប់",
    resume: "បន្ត",
    execute: "ប្រតិបត្តិ",
    reason: "មូលហេតុ",
    created: "បង្កើតនៅ",
    expires: "ផុតកំណត់",
    permission: "ការអនុញ្ញាត",
    actor: "អ្នកធ្វើ",
    time: "ពេលវេលា",
    approvalRequired: "ត្រូវការការអនុម័ត",
    approvedAwaiting: "បានអនុម័ត (រង់ចាំប្រតិបត្តិ)",
  },
};
import app from "./app.js";
const merged: TranslationTree = { ...km, ...app };
export default merged;

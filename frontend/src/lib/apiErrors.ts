export const ERROR_KEYS: Record<string, string> = {
  "This field is required.": "required",
  "This field may not be blank.": "required",
  "This field may not be null.": "required",
  "Enter a valid email address.": "invalidEmail",
  "Invalid email": "invalidEmail",
  "Enter a valid value.": "invalid",
  "A valid integer is required.": "invalid",
  "This password is too short. It must contain at least 8 characters.": "passwordShort",
  "This password is too common.": "passwordCommon",
  "This password is entirely numeric.": "passwordNumeric",
  "A user with that email already exists.": "emailExists",
  "A user is already registered with this email address.": "emailExists",
  "Unable to log in with provided credentials.": "invalidCredentials",
  "Invalid login credentials": "invalidCredentials",
  "No active account found with the given credentials": "invalidCredentials",
  "Too many failed attempts. Try again in 15 minutes.": "tooManyAttempts",
  "Authentication credentials were not provided.": "credentialsNotProvided",
  "Code expired or already used": "codeExpired",
  "Invalid code": "codeInvalid",
  "Invalid token": "invalidToken",
  "Invalid link": "invalidLink",
  "Link expired or invalid": "invalidLink",
  "Email is required": "emailRequired",
  "Email and code are required": "emailAndCodeRequired",
  "Refresh token is required": "refreshTokenRequired",
  "This service is not available": "serviceNotAvailable",
  "You cannot purchase your own service": "cannotPurchaseOwnService",
  "Plan not found": "planNotFound",
  "This plan is free": "planIsFree",
  "Currency code must be 3 letters": "currencyCodeLength",
  "Exchange rate must be positive": "exchangeRatePositive",
  "Invalid student account": "invalidStudentAccount",
  "This student is already linked to you": "studentAlreadyLinked",
  "file is required": "fileRequired",
  "Audio file is required": "fileRequired",
  "file must be CSV or XLSX": "fileFormatInvalid",
  "Student not found by the given code": "studentNotFound",
  "school_code and name are required": "schoolCodeAndNameRequired",
  "email is required": "emailRequired",
  "section not found": "sectionNotFound",
  "Google OAuth is not configured yet": "googleNotConfigured",
  "Not allowed to reply on this ticket": "replyNotAllowed",
  "subject and message are required": "subjectAndMessageRequired",
  "Message text is required": "messageTextRequired",
  "Text is required": "textRequired",
  "Incomplete data": "incompleteData",
  "Duplicate values": "duplicateValues",
  "This user may not be deleted.": "cannotDeleteUser"
};

export function extractApiError(err: any): string {
  const data = err?.response?.data ?? err?.data ?? err;
  if (!data) return "";
  if (typeof data === "string") return data;
  if (data.detail != null) {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.detail === "object") return extractApiError(data.detail);
  }
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  if (typeof data.non_field_errors === "string") return data.non_field_errors;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) return data.non_field_errors[0];
  for (const key of Object.keys(data)) {
    const v = data[key];
    if (Array.isArray(v) && v.length) {
      if (typeof v[0] === "string") return v[0];
      return extractApiError(v[0]);
    }
    if (typeof v === "string") return v;
  }
  return "";
}

export function apiErrorKey(msg: string): string | null {
  if (!msg) return null;
  return ERROR_KEYS[msg.trim()] ?? null;
}

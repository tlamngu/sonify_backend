import { sendValidationEmail } from "./utils/emailUtils.js";

sendValidationEmail({
  username: "Zeaky Nguyen",
  validateURL: "https://www.youtube.com/watch?v=cErgMJSgpv0",
  toEmail: "tlamngu@outlook.com"
})
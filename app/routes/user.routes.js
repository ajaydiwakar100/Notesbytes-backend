import { register, forgotPassword, loginPassword, changePassword, updateProfile, validateNif, validateEmail, phoneExists, sendOTP, verifiedOTP, changePhone, changeEmailRequest } from "../controllers/user/validator";
import multer, { memoryStorage } from "multer";
const storage = memoryStorage();
const upload = multer({storage : storage})

export default app => {
    const users = require("../controllers/user/user.controller.js");
    const Authenticate = require("../middleware/authenticate.js");
    const validate = require("../middleware/validate");
    var router = require("express").Router();
  
    // Create a new user
    router.post("/validate-phone", validate(register), users.create);
    router.post("/forgot-password", validate(forgotPassword), users.forgotPassword);
    router.post("/login-password", validate(loginPassword), users.loginPassword);
    router.post("/change-password",validate(changePassword) ,Authenticate, users.changePassword);
    router.post("/profile-update",validate(updateProfile) ,Authenticate, users.updateProfile);
    router.post("/validate-nif", validate(validateNif), Authenticate, users.validateNIF);
    router.post("/validate-email", validate(validateEmail), Authenticate, users.validateEmail);
    router.post("/phone-exists", validate(phoneExists), users.phoneExists);
    router.post("/send-otp", validate(sendOTP), users.sendOTP)
    router.post("/verified-otp", validate(verifiedOTP), users.verifiedOTP)    
    router.post("/upload-kyc", Authenticate, upload.any(), users.uploadKyc);
    router.post("/change-phone", Authenticate, validate(changePhone), users.changePhone);
    router.post("/check-phone-password", Authenticate, validate(changePhone), users.checkPhoneAndPassword);
    router.get("/get-profile", Authenticate, users.getProfile);
    router.post("/change-email-request", Authenticate, validate(changeEmailRequest), users.changeEmailRequest);
    //router.post("/do-change-email", Authenticate, validate(userSchemas.doChangeEmail), users.doChangeEmail);
    
    app.use("/api/user", router);
  };
  
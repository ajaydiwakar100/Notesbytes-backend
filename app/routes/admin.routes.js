const express = require("express");
const userSchemas = require("../controllers/admin/user/validation");
const subAdminsSchemas = require("../controllers/admin/subAdmins/validation");
const validationSchemas = require("../controllers/admin/rolesPermission/validation");
const AuthController = require("../controllers/admin/user/user.controller");
const moduleController = require("../controllers/admin/rolesPermission/modules.controller");
const permissionController = require("../controllers/admin/rolesPermission/permission.controller");
const rolesPermissionController = require("../controllers/admin/rolesPermission/rolesPermission.controller");
const getAllSettingsController = require("../controllers/admin/gobalSettings/gobalSettings.controller");
const subAdminsController = require("../controllers/admin/subAdmins/subAdmins.controller");
const endUserController = require("../controllers/admin/endusers/endUsers.controller");
const { endUserSchemas } = require("../controllers/admin/endusers/validation.js");
const documentController = require("../controllers/admin/document/document.controller");
const documentValidation = require("../controllers/admin/document/validation");
const testimonialController = require("../controllers/admin/testimonial/testimonal.controller");
const cmsController   = require("../controllers/admin/cms/cms.controller");
const { createEmailTemplate } = require("../controllers/admin/emailTemplates/emailTemplate.controller");
const blogController = require("../controllers/admin/blog/blog.controller");

const validate = require("../middleware/validate");
const Authenticate = require("../middleware/authenticate");
const userAuth = require("../middleware/userAuth");
const createUploader = require("../helpers/upload.helper.js");
const uploadDocument = createUploader("documents"); // folder name
const upload = require("../middleware/adminUplod.js");


module.exports = function(app) {
  const router = express.Router();

  // Auth routes
  router.post("/register", validate(userSchemas.register), AuthController.register);
  router.post("/login", validate(userSchemas.login), AuthController.login);
  router.post("/verify-otp", validate(userSchemas.verifyOtp), AuthController.verifyOtp);
  router.post("/forgot-password", validate(userSchemas.forgotPassword), AuthController.forgetPassword);
  router.post("/reset-password", validate(userSchemas.resetPassword), AuthController.resetPassword);



  // After Login
  router.get("/get-profile", Authenticate, AuthController.getProfile);
  router.post("/logout", Authenticate,  AuthController.logout);
  router.post("/change-password", validate(userSchemas.changePassword), Authenticate,  AuthController.changePassword);
  router.post("/update-profile", validate(userSchemas.updateProfile),  Authenticate, AuthController.updateProfile);
  router.get("/dashboard", Authenticate, AuthController.dashboard);

  // Sub admin
  router.get("/sub-admin/list",  Authenticate, subAdminsController.list);
  router.post("/sub-admin/create", validate(subAdminsSchemas.create), Authenticate,  subAdminsController.create);
  router.put("/sub-admin/change-status", Authenticate,  subAdminsController.updateStatus);
  router.post("/sub-admin/update/:id", validate(subAdminsSchemas.create), Authenticate,  subAdminsController.update);
  router.get("/sub-admin/view/:id", Authenticate,  subAdminsController.details);

  // Global Settings
  router.get("/gobal-settings/list",  Authenticate, getAllSettingsController.getSettings);
  router.post("/gobal-settings/create",  Authenticate, getAllSettingsController.saveSettings);
  router.post("/gobal-settings/delete",Authenticate, getAllSettingsController.deleteSetting);

  // Roles
  router.get("/roles/list", Authenticate,  rolesPermissionController.list);
  router.post("/roles/add", validate(validationSchemas.rolesSchemas.create),  Authenticate, rolesPermissionController.create);
  router.post("/roles/update", validate(validationSchemas.rolesSchemas.update), Authenticate,  rolesPermissionController.update);
  router.post("/roles/delete", validate(validationSchemas.rolesSchemas.delete), Authenticate,  rolesPermissionController.delete);
  router.get("/roles/view/:id", Authenticate,  rolesPermissionController.view);
  router.post("/roles/change-status", Authenticate,  rolesPermissionController.changeStatus);

  // Modules
  router.get("/module/list",  Authenticate, moduleController.list);
  router.post("/module/create", validate(validationSchemas.moduleSchemas.create), Authenticate,  moduleController.create);
  router.post("/module/update", validate(validationSchemas.moduleSchemas.update), Authenticate,  moduleController.update);
  router.post("/module/delete", validate(validationSchemas.moduleSchemas.delete), Authenticate,  moduleController.delete);
  router.get("/module/view/:id", Authenticate,  moduleController.view);

  // Permission
  router.get("/permission/list",  Authenticate, permissionController.list);
  router.post("/permission/create", validate(validationSchemas.permissionSchemas.create), Authenticate,  permissionController.create);
  router.post("/permission/update", validate(validationSchemas.permissionSchemas.create), Authenticate,  permissionController.update);
  router.post("/permission/delete", validate(validationSchemas.permissionSchemas.create),  Authenticate, permissionController.delete);
  router.get("/permission/view/:id", Authenticate, permissionController.view);
  
  // email template 
  router.post("/email-template/create", createEmailTemplate);
  
  
  // buyers/sellers
  router.get("/end-users/list",  Authenticate, endUserController.getList);
  router.post("/end-users/create", validate(endUserSchemas.create), endUserController.create);
  router.get("/verify-email/:token", endUserController.verifyEmail);
  router.put("/end-users/change-status", Authenticate,  endUserController.updateStatus);
  router.get("/end-users/view/:id", Authenticate,  endUserController.details);
  router.get("/end-users/view/:id/referrals", Authenticate, endUserController.referrals);
  router.get("/end-users/get-purchase-order", Authenticate, endUserController.getMyPurchaseOrders);
  router.get("/end-users/invoice",Authenticate,endUserController.generateInvoice);

  // Document 
  router.get("/document/list",  Authenticate, documentController.getList);
  router.put("/document/change-status", Authenticate,  documentController.updateStatus);
  router.get("/document/view/:id", Authenticate,  documentController.details);
  router.put("/document/approved-reject-status", Authenticate,  documentController.updateApprovalStatus);
  router.post("/document/delete", Authenticate, documentController.delete);

  // Testimonial
  router.post("/testimonial/create", Authenticate,testimonialController.create);
  router.get("/testimonial/list", Authenticate,testimonialController.list);
  router.post("/testimonial/status", Authenticate,testimonialController.updateStatus);
  router.post("/testimonial/delete", Authenticate, testimonialController.delete);

  // Blogs
  router.post("/blog/create", Authenticate, upload.single("image"), blogController.createOrUpdate);
  router.post("/blog/update:id",upload.single("image"), blogController.createOrUpdate);
  router.get("/blog/list", Authenticate,blogController.list);
  router.post("/blog/status", Authenticate, blogController.updateStatus);
  router.post("/blog/delete", Authenticate, blogController.delete);
  router.get("/blog/view/:id", Authenticate,  blogController.detail);


  // (open apis ) 
  router.get("/home/list", cmsController.getHomePage);
  router.get("/document/detail/:slug",  documentController.detailsBySlug);
  router.get("/document/getNotes", documentController.getListByFilter);
  router.get("/document/subjects", documentController.getUniqueSubjects);
  router.get("/document/exams", documentController.getUniqueExams);
  router.get("/document/languages", documentController.getUniqueLanguages);
  router.get("/settings/list",  getAllSettingsController.getSettings);
  router.get("/document/getDetail/:id", documentController.detailsById);
  router.get("/about-us/list", cmsController.getAboutUsPage);
  router.get("/sell-notes/list", cmsController.getSellNotesPage);
  router.get("/terms/list", cmsController.getTermsPage);
  router.get("/privacy-policy/list", cmsController.getPrivacy);
  router.get("/refund/list", cmsController.getRefund);
  router.get("/get-all-settings/list", cmsController.getSetting);
  router.get("/get-all-blog-list",blogController.getAllPublishBlog);
  router.get("/get-blog-detail/:slug",blogController.getPublishedBlogDetail);
  



  // auth api
  router.post("/end-user/register",validate(endUserSchemas.create),endUserController.create);
  router.post("/end-user/login",validate(endUserSchemas.login),endUserController.login);
  router.get("/end-user/me", userAuth, endUserController.getMe);
  router.get("/end-user/getNotes", userAuth, documentController.getUploadDocumentByUser);
  router.post("/end-user/logout", userAuth, endUserController.logout);
  router.post("/end-user/update-profile",userAuth, endUserController.updateProfile)
  router.post("/end-user/forgot-password", endUserController.forgotPassword);
  router.post("/end-user/reset-password", endUserController.resetPassword);
  
  // notes api
  router.post("/end-user/document/create",userAuth,uploadDocument.fields([{ name: "file", maxCount: 1 },{ name: "sampleFile", maxCount: 1 },{ name: "docImage", maxCount: 1 }]),validate(documentValidation.create),documentController.create);
  router.get("/end-user/document/details/:slug", userAuth, documentController.detailsBySlug);
  router.post("/end-user/document/update/:slug",userAuth, uploadDocument.fields([{ name: "file", maxCount: 1 },{ name: "sampleFile", maxCount: 1 },{ name: "docImage", maxCount: 1 }]),documentController.updateBySlug);
  router.delete("/end-user/document/delete/:slug", userAuth, documentController.deleteDocumentBySlug);
  router.post("/end-user/document/publish/:slug",userAuth,documentController.updatePublishStatus);
  router.get("/end-user/document/get-purchase-notes", userAuth, documentController.getPurchasedNotes);
  
  // wish list api
  router.get("/end-user/wishlist", userAuth, documentController.getWishlist);
  router.post("/end-user/wishlist/add", userAuth, documentController.addToWishlist);
  router.post("/end-user/wishlist/remove", userAuth, documentController.removeFromWishlist);
  
  // cart api
  router.get("/end-user/cart", userAuth, documentController.getCart);
  router.post("/end-user/cart/add", userAuth, documentController.addToCart);
  router.post("/end-user/cart/remove", userAuth, documentController.removeFromCart);

  // Checkout 
  router.post ("/end-user/checkout", userAuth, documentController.createOrder);
  router.post("/end-user/verify-payment", userAuth, documentController.verifyPayment);
  router.get("/end-user/get-revenue", userAuth, documentController.getSellerRevenue);
  router.get("/end-user/get-dashboard", userAuth, documentController.getSellerDashboard);


  // Razorpay 
  router.post("/razorpay/create-fund-account",userAuth, documentController.createOrUpdateRazorpayAccount);

  // Review and Rating
  router.post("/end-user/review", userAuth, documentController.addOrUpdateReview);
  router.get("/reviews/:productId",documentController.getReviewsByProduct);
  //router.get("/review/:productId", userAuth, documentController.getMyReview);

  app.use("/api/admin", router);
};

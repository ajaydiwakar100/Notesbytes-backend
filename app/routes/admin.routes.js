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

const validate = require("../middleware/validate");
const Authenticate = require("../middleware/authenticate");

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

  // Sub admin
  router.get("/sub-admin/list",  Authenticate, subAdminsController.list);
  router.post("/sub-admin/create", validate(subAdminsSchemas.create), Authenticate,  subAdminsController.create);
  router.post("/sub-admin/update/:id", validate(subAdminsSchemas.create), Authenticate,  subAdminsController.update);
  router.get("/sub-admin/view/:id", Authenticate,  subAdminsController.details);

  // Global Settings
  router.get("/gobal-settings/get-gobal-settings-list",  Authenticate, getAllSettingsController.getAllSettings);

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

  app.use("/api/admin", router);
};

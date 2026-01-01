const {Role,Permission, Module} = require("../../../models/index.js");
const AppHelpers = require("../../../helpers/index");
const mongoose = require("mongoose");


const Controller = {

  handleError: (res, err, msg = "Internal server error") => {
    AppHelpers.ErrorLogger(msg, err);
    const retData = AppHelpers.Utils.responseObject();
    retData.status = "error";
    retData.code = 500;
    retData.httpCode = 500;
    retData.msg = err?.message || msg;
    return AppHelpers.Utils.cRes(res, retData);
  },

  create: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    const { _id, name, description, status, permissionId } = req.body;

    try {
      const validPermissionIds = (permissionId || []).map(id => new mongoose.Types.ObjectId(id));

      let role;

      if (_id) {
        // Update existing role
        role = await Role.findByIdAndUpdate(
          _id,
          {
            $set: {
              name,
              description: description ?? null,
              status: typeof status !== "undefined" ? status : true,
              permissionId: validPermissionIds,
            }
          },
          { new: true } // return updated document
        );
        retData.msg = AppHelpers.ResponseMessages.ROLE_UPDATED;
      } else {
        // Create new role
        role = await Role.create({
          name,
          description: description ?? null,
          status: typeof status !== "undefined" ? status : true,
          permissionId: validPermissionIds,
        });
        retData.msg = AppHelpers.ResponseMessages.ROLE_CREATED;
      }

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.data = role;
      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in createOrUpdateRole");
    }
  },
  
  list: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      // Fetch all roles
      const roles = await Role.find().sort({ createdAt: -1 }).lean();

      // Fetch all permissions
      const permissions = await Permission.find().lean();

      // Fetch all modules
      const modules = await Module.find().lean();

      // Map modules by id for fast lookup
      const moduleMap = {};
      modules.forEach((mod) => {
        moduleMap[String(mod._id)] = mod.name;
      });

      // Map permissions by module
      const rolesWithModules = roles.map((role) => {
        const modulesWithPermissions = {};
        // Initialize all modules with empty arrays
        modules.forEach((mod) => {
          modulesWithPermissions[mod.name] = [];
        });

        // Loop through role's permission IDs
        role.permissionId.forEach((permId) => {
          // Find the permission object
          const perm = permissions.find((p) => String(p._id) === String(permId));
          if (perm) {
            const moduleName = moduleMap[String(perm.module)];
            if (moduleName) {
              modulesWithPermissions[moduleName].push({
                id: perm._id,
                name: perm.name,
              });
            }
          }
        });

        return {
          ...role,
          permissionsByModule: modulesWithPermissions,
        };
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = rolesWithModules.length
        ? AppHelpers.ResponseMessages.RECORDS_FOUND
        : AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
      retData.data = rolesWithModules;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in listRoles");
    }
  },

  view: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    const { id } = req.params;

    try {
      const role = await Role.findById(id);

      if (!role) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.ROLE_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.RECORDS_FOUND;
      retData.data = role;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in viewRole");
    }
  },

  update: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    const { id, name, description, status } = req.body;

    try {
      const existingRole = await Role.findById(id);
      if (!existingRole) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updatedRole = await Role.findByIdAndUpdate(
        id,
        {
          name: name ?? existingRole.name,
          description: description ?? existingRole.description,
          status: typeof status !== "undefined" ? status : existingRole.status,
        },
        { new: true }
      );

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.ROLE_UPDATED;
      retData.data = updatedRole;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in updateRole");
    }
  },

  delete: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    const { roleId } = req.params;

    try {
      const existingRole = await Role.findById(roleId);
      if (!existingRole) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.ROLE_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      await Role.findByIdAndDelete(roleId);

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.ROLE_DELETED;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in deleteRole");
    }
  },

  changeStatus: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    const { id, status } = req.body;

    try {
      if (!id || typeof status === "undefined") {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.REQUIRED_PARAM_MISSING;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const existingRole = await Role.findById(id);
      if (!existingRole) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updatedRole = await Role.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.ROLE_UPDATED;
      retData.data = updatedRole;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in changeStatus");
    }
  },

};

module.exports = Controller;

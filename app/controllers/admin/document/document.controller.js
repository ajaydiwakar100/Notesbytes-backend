const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Document,User } = require("../../../models/index.js");
const AppHelpers = require("../../../helpers/index.js");
const documentSchemas = require("../document/validation.js")

const Controller = {

    // ERROR HANDLER
    handleError: (res, err, msg = "Internal server error") => {
        AppHelpers.ErrorLogger(msg, err);
        const retData = AppHelpers.Utils.responseObject();
        retData.status = "error";
        retData.code = 500;
        retData.httpCode = 500;
        retData.msg = err?.message || msg;
        return AppHelpers.Utils.cRes(res, retData);
    },

    // --------------------------------------------------------
    // CREATE DOCUMENT
    // --------------------------------------------------------
    create: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // -------------------------------------
            // VALIDATE FORM FIELDS (ONLY req.body)
            // -------------------------------------
            const { error } = documentSchemas.create.validate(req.body);
            if (error) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = error.details[0].message;
                return AppHelpers.Utils.cRes(res, retData);
            }

            const {
                name,
                type,
                prize,
                notes,
                uploadedBy,
                approvalStatus,
                status
            } = req.body;

            // -------------------------------------
            // CHECK FILE UPLOAD (req.file)
            // -------------------------------------
            if (!req.file) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = AppHelpers.ResponseMessages.DOCUMENT_FILE_REQUIRED;
                return AppHelpers.Utils.cRes(res, retData);
            }

            // FILE DETAILS
            const filePath = `uploads/documents/${req.file.filename}`;
            const fileSize = req.file.size;
            const fileMimeType = req.file.mimetype;

            // -------------------------------------
            // CHECK UPLOADER USER EXISTS
            // -------------------------------------
            const uploaderUser = await User.findById(uploadedBy);
            if (!uploaderUser) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
                return AppHelpers.Utils.cRes(res, retData);
            }

            // -------------------------------------
            // CREATE DOCUMENT ENTRY
            // -------------------------------------
            const newDocument = await Document.create({
                name,
                type,
                prize,
                notes,
                uploadedBy,
                filePath,
                fileSize,
                fileMimeType,
                approvalStatus: approvalStatus ?? "pending",
                status: status ?? 1,
                noOfDownloads: 0,
                rating: 0
            });

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = AppHelpers.ResponseMessages.DOCUMENT_UPLOADED_SUCCESSFULLY;
            retData.data = newDocument;

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in create document");
        }
    },


    // --------------------------------------------------------
    // LIST USERS + PROFILE PIC PATH
    // --------------------------------------------------------
    getList: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            let { userId, page = 1, limit = 10 } = req.query;

            page = parseInt(page);
            limit = parseInt(limit);

            let filter = {};

            // ---------------------------------------------
            // APPLY USER FILTER ONLY IF userId IS PASSED
            // ---------------------------------------------
            if (userId) {
                filter.uploadedBy = userId;
            }

            // ---------------------------------------------
            // FETCH DATA
            // ---------------------------------------------
            const total = await Document.countDocuments(filter);

            const documents = await Document.find(filter)
                .populate("uploadedBy", "name email")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            // Attach URL with domain
            documents.forEach(doc => {
                if (doc.filePath && !doc.filePath.includes("http")) {
                    doc.filePath = `${process.env.BASE_URL}/${doc.filePath}`;
                }
            });

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = documents.length ? "Records found" : "No records found";

            retData.data = {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                documents
            };

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in document getList");
        }
    },

   
    // --------------------------------------------------------
    // DOCUMENT DETAILS WITH FULL FILE PATH + UPLOADER INFO
    // --------------------------------------------------------
    details: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { id } = req.params;

            // Validate ID
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Invalid ID";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Fetch document
            const document = await Document.findById(id)
            .populate("uploadedBy", "name email phone userType") 
            .lean();

            if (!document) {
                retData.status = "error";
                retData.code = 404;
                retData.httpCode = 404;
                retData.msg = "Document not found";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Add full file path
            if (document.filePath && !document.filePath.includes("http")) {
                document.filePath = `${process.env.BASE_URL}/${document.filePath}`;
            }

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = AppHelpers.ResponseMessages.RECORDS_FOUND;
            retData.data = document;

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in document details");
        }
    },
  
    // --------------------------------------------------------
    // UPDATE DOCUMENT STATUS ONLY (active/inactive)
    // --------------------------------------------------------
    updateStatus: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { id, status } = req.body;

            // Validate ID
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = AppHelpers.ResponseMessages.INVALID_ID;
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Validate status (0 or 1)
            if (![0, 1].includes(Number(status))) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Invalid status value";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Update document status
            const updatedDocument = await Document.findByIdAndUpdate(
                id,
                { status, updatedAt: new Date() },
                { new: true }
            );

            if (!updatedDocument) {
                retData.status = "error";
                retData.code = 404;
                retData.httpCode = 404;
                retData.msg = "Document not found";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Success response
            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Document status updated successfully";
            retData.data = updatedDocument;

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in document updateStatus");
        }
    },

    // --------------------------------------------------------
    // UPDATE DOCUMENT APPROVAL STATUS (approve / reject)
    // --------------------------------------------------------
    updateApprovalStatus: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { id, approvalStatus, reason } = req.body;

            // -------------------------
            // Validate ID
            // -------------------------
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = AppHelpers.ResponseMessages.INVALID_ID;
                return AppHelpers.Utils.cRes(res, retData);
            }

            // -------------------------
            // Validate approvalStatus
            // -------------------------
            const allowed = ["approved", "rejected"];
            if (!approvalStatus || !allowed.includes(approvalStatus)) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "approvalStatus must be 'approved' or 'rejected'";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // -------------------------
            // If rejected → reason required
            // -------------------------
            // if (approvalStatus === "rejected") {
            //     retData.status = "error";
            //     retData.code = 400;
            //     retData.httpCode = 400;
            //     retData.msg = "Rejection reason is required";
            //     return AppHelpers.Utils.cRes(res, retData);
            // }

            // Build update object
            const updateObj = {
                approvalStatus,
                updatedAt: new Date()
            };

            if (approvalStatus === "approved") {
                updateObj.approvedAt = new Date();
                updateObj.rejectedReason = null;
                updateObj.rejectedAt = null;
            } else {
                updateObj.rejectedReason = reason;
                updateObj.rejectedAt = new Date();
                updateObj.approvedAt = null;
            }

            const doc = await Document.findByIdAndUpdate(id, updateObj, { new: true });

            if (!doc) {
                retData.status = "error";
                retData.code = 404;
                retData.httpCode = 404;
                retData.msg = "Document not found";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Success Response
            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Document status updated successfully";
            retData.data = doc;

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in updateApprovalStatus");
        }
    },

    // --------------------------------------------------------
    // DELETE DOCUMENT
    // --------------------------------------------------------
    delete: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { id } = req.body;

            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = AppHelpers.ResponseMessages.INVALID_ID;
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Check document exists
            const document = await Document.findById(id);

            if (!document) {
                retData.status = "error";
                retData.code = 404;
                retData.httpCode = 404;
                retData.msg = "Document not found";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Optional: remove file from server
            if (document.filePath) {
                const fs = require("fs");
                const path = require("path");
                const filePath = path.join(
                    __dirname,
                    "../../..",
                    document.filePath.replace(process.env.BASE_URL, "")
                );

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            // Remove DB entry
            await Document.findByIdAndDelete(id);

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Document deleted successfully";
            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in delete Document");
        }
    },

};

module.exports = Controller;

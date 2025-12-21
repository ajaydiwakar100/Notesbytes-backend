const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Document,User } = require("../../../models/index.js");
const AppHelpers = require("../../../helpers/index.js");
const documentSchemas = require("../document/validation.js");
const slugify = require("slugify");

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
    // CREATE DOCUMENT / NOTES
    // --------------------------------------------------------
    create: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // -------------------------------------
            // VALIDATE FORM FIELDS
            // -------------------------------------
            const { error } = documentSchemas.create.validate(req.body);
            if (error) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = error.details[0].message;
                return AppHelpers.Utils.cRes(res, retData);
            }
            const uploadedBy = req.user.id;
            const {
                title,
                description,
                price,
                author,
                subject,
                exam,
                language,
                pages,
                format,
                topics,
                highlights,
                approvalStatus,
                status,
                isFeature,
                shortDescription,
                originalPrice,
                publishStatus
            } = req.body;

            // -------------------------------------
            // FILE VALIDATION
            // -------------------------------------
            if (!req.files?.file?.length) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = AppHelpers.ResponseMessages.DOCUMENT_FILE_REQUIRED;
                return AppHelpers.Utils.cRes(res, retData);
            }

            if (!req.files?.sampleFile?.length) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Sample document is required";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // -------------------------------------
            // ORIGINAL DOCUMENT
            // -------------------------------------
            const originalFile = req.files.file[0];
            const filePath = originalFile.path.replace(/\\/g, "/");
            const fileSize = originalFile.size;
            const fileMimeType = originalFile.mimetype;

            // -------------------------------------
            // SAMPLE DOCUMENT
            // -------------------------------------
            const sampleFile = req.files.sampleFile[0];
            const sampleFilePath = sampleFile.path.replace(/\\/g, "/");

            // -------------------------------------
            // THUMBNAIL (OPTIONAL)
            // -------------------------------------
            let docImagePath = "";
            if (req.files.docImage?.length) {
                docImagePath = req.files.docImage[0].path.replace(/\\/g, "/");
            }

            // -------------------------------------
            // CHECK USER
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
            // UNIQUE SLUG
            // -------------------------------------
            let baseSlug = slugify(title, { lower: true, strict: true });
            let slug = baseSlug;
            let count = 1;

            while (await Document.findOne({ slug })) {
                slug = `${baseSlug}-${count++}`;
            }

            // -------------------------------------
            // CREATE DOCUMENT
            // -------------------------------------
            const newDocument = await Document.create({
                title,
                description,
                slug,
                price,
                author,
                subject,
                exam,
                language,
                pages,
                format,
                topics: Array.isArray(topics) ? topics : [],
                highlights: Array.isArray(highlights) ? highlights : [],
                uploadedBy: uploadedBy,
                filePath,
                sampleFile: sampleFilePath,
                fileSize,
                fileMimeType,
                docImage: docImagePath,
                approvalStatus: approvalStatus ?? "pending",
                status: status ?? 1,
                publishStatus: publishStatus ?? 0,
                isFeature: isFeature ?? false,
                noOfDownloads: 0,
                rating: 0,
                reviewsCount: 0,
                shortDescription,
                originalPrice,
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

    // --------------------------------------------------------
    // DOCUMENT DETAILS BY SLUG WITH FULL FILE PATH + UPLOADER INFO
    // --------------------------------------------------------
    detailsBySlug: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();
        
        try {
            const { slug } = req.params;

            if (!slug) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Slug is required";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Fetch document by slug
            const document = await Document.findOne({ slug })
                .populate("uploadedBy", "name email phone userType")
                .lean();

            if (!document) {
                retData.status = "error";
                retData.code = 404;
                retData.httpCode = 404;
                retData.msg = "Document not found";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // // Add full file path
            // if (document.filePath && !document.filePath.includes("http")) {
            //     document.filePath = `${process.env.BASE_URL}/${document.filePath}`;
            // }

            if (document.docImage && !document.docImage.includes("http")) {
                document.docImage = `${process.env.BASE_URL}/${document.docImage}`;
            }

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = AppHelpers.ResponseMessages.RECORDS_FOUND;
            retData.data = document;

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in document details by slug");
        }
    },

    // --------------------------------------------------------
    // GET DOCUMENT LIST
    // --------------------------------------------------------

    getListByFilter: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { subjects, exams, price, rating, search, sort } = req.query;

            let filters = {};
            let sortQuery = { createdAt: -1 }; // default: newest

            // SUBJECT FILTER
            if (subjects) {
            filters.subject = { $in: subjects.split(",") };
            }

            // EXAM FILTER
            if (exams) {
            filters.exam = { $in: exams.split(",") };
            }

            // PRICE FILTER
            if (price) {
            if (price === "under200") filters.price = { $lt: 200 };
            if (price === "200-400") filters.price = { $gte: 200, $lte: 400 };
            if (price === "above400") filters.price = { $gt: 400 };
            }

            // RATING FILTER
            if (rating) {
            filters.rating = { $gte: Number(rating) };
            }

            // SEARCH
            if (search) {
            filters.title = { $regex: search, $options: "i" };
            }

            // SORT
            if (sort === "price-low") sortQuery = { price: 1 };
            if (sort === "price-high") sortQuery = { price: -1 };
            if (sort === "rating") sortQuery = { rating: -1 };
            if (sort === "newest") sortQuery = { createdAt: -1 };

            const documents = await Document.find(filters)
            .populate("uploadedBy", "name email")
            .sort(sortQuery)
            .lean();

            const baseUrl = process.env.BASE_URL;
            documents.forEach(doc => {
            if (doc.docImage && !doc.docImage.startsWith("http")) {
                doc.docImage = `${baseUrl}/${doc.docImage}`;
            }
            });

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.data = documents;
            retData.msg = "Records found";

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in document list");
        }
    },

    // --------------------------------------------------------
    // GET ALL UNIQUE SUBJECTS
    // --------------------------------------------------------
    getUniqueSubjects: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // Use Mongoose distinct to get unique values of 'subject'
            const subjects = await Document.distinct("subject");

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = AppHelpers.ResponseMessages.RECORDS_FOUND;
            retData.data = subjects;

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in fetching unique subjects");
        }
    },

    // --------------------------------------------------------
    // GET ALL UNIQUE EXAMS
    // --------------------------------------------------------
    getUniqueExams: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // Use Mongoose distinct to get unique values of 'exam'
            const exams = await Document.distinct("exam");

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = AppHelpers.ResponseMessages.RECORDS_FOUND;
            retData.data = exams;

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in fetching unique exams");
        }
    },

    getUploadDocumentByUser: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { subjects, exams, price, rating, search, sort } = req.query;

            let filters = {
                uploadedBy: req.user.id, // ✅ ONLY logged-in user's docs
            };

            let sortQuery = { createdAt: -1 };

            // SUBJECT FILTER
            if (subjects) {
                filters.subject = { $in: subjects.split(",") };
            }

            // EXAM FILTER
            if (exams) {
                filters.exam = { $in: exams.split(",") };
            }

            // PRICE FILTER
            if (price) {
            if (price === "under200") filters.price = { $lt: 200 };
            if (price === "200-400") filters.price = { $gte: 200, $lte: 400 };
            if (price === "above400") filters.price = { $gt: 400 };
            }

            // RATING FILTER
            if (rating) {
                filters.rating = { $gte: Number(rating) };
            }

            // SEARCH
            if (search) {
                filters.title = { $regex: search, $options: "i" };
            }

            // SORT
            if (sort === "price-low") sortQuery = { price: 1 };
            if (sort === "price-high") sortQuery = { price: -1 };
            if (sort === "rating") sortQuery = { rating: -1 };
            if (sort === "newest") sortQuery = { createdAt: -1 };

            const documents = await Document.find(filters)
            .populate("uploadedBy", "name email")
            .sort(sortQuery)
            .lean();


            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.data = documents;
            retData.msg = "Records found";

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in document list");
        }
    }
};

module.exports = Controller;

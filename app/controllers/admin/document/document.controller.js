const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Document,User, Wishlist, Cart, Invoice, PaymentLog, PurchaseOrder, EmailTemplate} = require("../../../models/index.js");
const AppHelpers = require("../../../helpers/index.js");
const documentSchemas = require("../document/validation.js");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const {renderTemplate} = require('../../../helpers/renderTemplate.helper');
const {sendEmail} = require('../../../helpers/email.helper.js');

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

    buildOrderItemsHTML: (items) => {
        let rows = "";

        items.forEach(item => {
            const p = item; // IMPORTANT

            rows += `
            <tr>
                <td>${p.title}</td>
                <td>${p.shortDescription || "-"}</td>
                <td>₹${p.price}</td>
                <td>${p.author || "-"}</td>
                <td>${p.subject || "-"}</td>
                <td>${p.exam || "-"}</td>
                <td>${p.language || "-"}</td>
                <td>${p.pages || "-"}</td>
                <td>${p.format || "-"}</td>
                <td>
                <a href="${process.env.BASE_URL}/${p.filePath}" target="_blank">
                    Download
                </a>
                </td>
            </tr>`;
        });

        return rows;
    },

    normalizeUploadPath: (fullPath) => {
        if (!fullPath) return "";
        const normalized = fullPath.replace(/\\/g, "/");
        const uploadsIndex = normalized.indexOf("uploads/");
        return uploadsIndex !== -1? normalized.substring(uploadsIndex): "";
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
            const filePath = originalFile ? Controller.normalizeUploadPath(originalFile.path): null;
            const fileSize =  originalFile?.size || 0;
            const fileMimeType = originalFile?.mimetype || null;

            // -------------------------------------
            // SAMPLE DOCUMENT
            // -------------------------------------
            const sampleFile = req.files.sampleFile[0];
            const sampleFilePath = sampleFile ? Controller.normalizeUploadPath(sampleFile.path): null;

            // -------------------------------------
            // THUMBNAIL (OPTIONAL)
            // -------------------------------------
            let docImagePath = "";
            if (req.files?.docImage?.length) {
                docImagePath = Controller.normalizeUploadPath(req.files.docImage[0].path);
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

            // Add full file path
            if (document.filePath && !document.filePath.includes("http") && req.user) {
                document.filePath = `${process.env.BASE_URL}/${document.filePath}`;
            }else{
                document.filePath = null;
            }

            if (document.docImage && !document.docImage.includes("http")) {
                document.docImage = `${process.env.BASE_URL}/${document.docImage}`;
            }

            if (document.sampleFile && !document.sampleFile.includes("http")) {
                document.sampleFile = `${process.env.BASE_URL}/${document.sampleFile}`;
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

            // Fetch documents
            const documents = await Document.find(filters)
                .populate("uploadedBy", "name email")
                .sort(sortQuery)
                .lean();

            // Add full file path
            const fullUrl = (file) => file && !file.includes("http") ? `${process.env.BASE_URL}/${file}` : file;

            const updatedDocuments = documents.map((doc) => ({
                ...doc,
                filePath: fullUrl(doc.filePath),
                docImage: fullUrl(doc.docImage),
                sampleFile: fullUrl(doc.sampleFile),
            }));

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.data = updatedDocuments;
            retData.msg = "Records found";

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in document list");
        }
    },


    // --------------------------------------------------------
    // UPDATE DOCUMENT / NOTES BY SLUG
    // --------------------------------------------------------
    updateBySlug: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();
        console.log(req.body);
        try {
            const { slug } = req.params; // Get slug from URL
            if (!slug) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Slug is required";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // -------------------------
            // FIND DOCUMENT
            // -------------------------
            const document = await Document.findOne({ slug });
            if (!document) {
                retData.status = "error";
                retData.code = 404;
                retData.httpCode = 404;
                retData.msg = "Document not found";
                return AppHelpers.Utils.cRes(res, retData);
            }

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
                isFeature,
                shortDescription,
                originalPrice,
                publishStatus,
                status
            } = req.body;

            
            // -------------------------    
            // UPDATE BASIC FIELDS
            // -------------------------
            document.title = title ?? document.title;
            document.description = description ?? document.description;
            document.shortDescription = shortDescription ?? document.shortDescription;
            document.price = price ?? document.price;
            document.originalPrice = originalPrice ?? document.originalPrice;
            document.author = author ?? document.author;
            document.subject = subject ?? document.subject;
            document.exam = exam ?? document.exam;
            document.language = language ?? document.language;
            document.pages = pages ?? document.pages;
            document.format = format ?? document.format;
            document.publishStatus = publishStatus ?? document.publishStatus;
            document.status = status ?? document.status;
            document.isFeature = isFeature ?? document.isFeature;

            // -------------------------
            // TOPICS & HIGHLIGHTS
            // -------------------------
            if (Array.isArray(topics)) document.topics = topics;
            if (Array.isArray(highlights)) document.highlights = highlights;

            // -------------------------
            // FILE UPDATES (OPTIONAL)
            // -------------------------
            if (req.files?.file?.length) {
                const originalFile = req.files.file[0];
                document.filePath = await Controller.normalizeUploadPath(originalFile.path);
                document.fileSize = originalFile.size;
                document.fileMimeType = originalFile.mimetype;
            }

            if (req.files?.sampleFile?.length) {
                const sampleFile = req.files.sampleFile[0];
                document.sampleFile = await Controller.normalizeUploadPath(sampleFile.path);
            }

            if (req.files?.docImage?.length) {
                document.docImage = await Controller.normalizeUploadPath(req.files.docImage[0].path);
            }

            // -------------------------
            // SLUG (ONLY IF TITLE CHANGED)
            // -------------------------
            if (title && title !== document.title) {
                let baseSlug = slugify(title, { lower: true, strict: true });
                let newSlug = baseSlug;
                let count = 1;

                while (await Document.findOne({ slug: newSlug, _id: { $ne: document._id } })) {
                    newSlug = `${baseSlug}-${count++}`;
                }
                document.slug = newSlug;
            }

            document.updatedAt = new Date();
            await document.save();

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Document updated successfully";
            retData.data = document;

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in update document by slug");
        }
    },

    // --------------------------------------------------------
    // DELETE DOCUMENT / NOTES BY SLUG
    // --------------------------------------------------------
    deleteDocumentBySlug: async (req, res) => {
        try {
            const { slug } = req.params;

            if (!slug) {
                return res.status(400).json({ msg: "Slug is required" });
            }

            const document = await Document.findOne({ slug });
            if (!document) return res.status(404).json({ msg: "Document not found" });

            // ----------------------
            // Delete files + folder
            // ----------------------
            const files = [document.filePath, document.sampleFile, document.docImage];

            files.forEach((filePath) => {
            if (!filePath) return;

            const absolutePath = path.join(__dirname, "../../..", filePath.replace(process.env.BASE_URL, ""));
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath); // delete file
            }
            });

            // Remove folder if empty
            const foldersToCheck = [
                path.dirname(path.join(__dirname, "../../..", document.filePath || "")),
                path.dirname(path.join(__dirname, "../../..", document.sampleFile || "")),
                path.dirname(path.join(__dirname, "../../..", document.docImage || "")),
            ];

            foldersToCheck.forEach((folder) => {
            if (folder && fs.existsSync(folder) && fs.readdirSync(folder).length === 0) {
                fs.rmdirSync(folder, { recursive: true });
            }
            });

            // Delete DB record
            await Document.deleteOne({ _id: document._id });

            res.status(200).json({ msg: "Document deleted successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Internal server error" });
        }
    },

    // --------------------------------------------------------
    // UPDATE DOCUMENT PUBLISH STATUS
    // --------------------------------------------------------
    updatePublishStatus: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { slug } = req.params;
            const { publishStatus } = req.body; // 0 or 1

            if (!slug) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Slug is required";
                return AppHelpers.Utils.cRes(res, retData);
            }

            if (![0, 1].includes(Number(publishStatus))) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Invalid publish status value";
                return AppHelpers.Utils.cRes(res, retData);
            }

            const document = await Document.findOne({ slug });
            if (!document) {
                retData.status = "error";
                retData.code = 404;
                retData.httpCode = 404;
                retData.msg = "Document not found";
                return AppHelpers.Utils.cRes(res, retData);
            }

            document.publishStatus = Number(publishStatus);
            document.updatedAt = new Date();

            await document.save();

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = `Document ${ publishStatus === 1 ? "published" : "unpublished"} successfully`;
            retData.data = document;

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in update publish status");
        }
    },

    // --------------------------------------------------------
    // ADD TO WISHLIST
    // --------------------------------------------------------
    addToWishlist: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { documentId } = req.body; // document/product id

            if (!documentId) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Document ID is required";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Check if document exists
            const document = await Document.findById(documentId);
            if (!document) {
                retData.status = "error";
                retData.code = 404;
                retData.httpCode = 404;
                retData.msg = "Document not found";
                return AppHelpers.Utils.cRes(res, retData);
            }

            let wishlist = await Wishlist.findOne({ user: req.user.id });

            if (!wishlist) {
                wishlist = new Wishlist({ user: req.user.id, items: [] });
            }

            // Check if already in wishlist
            const exists = wishlist.items.find(
                (item) => item.product.toString() === documentId
            );

            if (exists) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 200;
                retData.msg = "Document already in wishlist";
                return AppHelpers.Utils.cRes(res, retData);
            }

            wishlist.items.push({ product: documentId });
            await wishlist.save();

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Document added to wishlist";
            retData.data = wishlist;

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in add to wishlist");
        }
    },

    // --------------------------------------------------------
    // ADD TO CART
    // --------------------------------------------------------
    addToCart: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { documentId, quantity } = req.body;

            if (!documentId) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Document ID is required";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Check if document exists
            const document = await Document.findById(documentId);
            if (!document) {
                retData.status = "error";
                retData.code = 404;
                retData.httpCode = 404;
                retData.msg = "Document not found";
                return AppHelpers.Utils.cRes(res, retData);
            }

            let cart = await Cart.findOne({ user: req.user.id });

            if (!cart) {
                cart = new Cart({ user: req.user.id, items: [] });
            }

            const existingItem = cart.items.find(
                (item) => item.product.toString() === documentId
            );

            if (existingItem) {
                existingItem.quantity += quantity || 1; // increment quantity
            } else {
                cart.items.push({ product: documentId, quantity: quantity || 1 });
            }

            await cart.save();

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Document added to cart";
            retData.data = cart;

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in add to cart");
        }
    },

    // --------------------------------------------------------
    // GET USER WISHLIST
    // --------------------------------------------------------
    getWishlist: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const wishlist = await Wishlist.findOne({ user: req.user.id })
            .populate({
                path: "items.product",
                select: "_id title subject slug price originalPrice rating noOfDownloads docImage author",
            })
            .lean();

            if (!wishlist || wishlist.items.length === 0) {
                retData.status = "success";
                retData.code = 200;
                retData.httpCode = 200;
                retData.msg = "Wishlist is empty";
                retData.data = [];
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Map to selected fields + full image path
            const items = wishlist.items.map(item => ({
                _id: item.product._id,
                title: item.product.title,
                subject: item.product.subject,
                slug: item.product.slug,
                price: item.product.price,
                originalPrice: item.product.originalPrice,
                rating: item.product.rating,
                noOfDownloads: item.product.noOfDownloads,
                author:item.product.author,
                thumbnailUrl: item.product.docImage
                ? `${process.env.BASE_URL || ""}/${item.product.docImage}`
                : "/placeholder.svg",
            }));

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Wishlist fetched successfully";
            retData.data = items;

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in get wishlist");
        }
    },


    // --------------------------------------------------------
    // GET USER CART
    // --------------------------------------------------------
    getCart: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const cart = await Cart.findOne({ user: req.user.id })
                .populate({
                    path: "items.product",
                    select: "_id title subject slug price originalPrice rating noOfDownloads docImage author",
                })
                .lean();

            if (!cart || cart.items.length === 0) {
                retData.status = "success";
                retData.code = 200;
                retData.httpCode = 200;
                retData.msg = "Cart is empty";
                retData.data = [];
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Map to selected fields + full image path
            const items = cart.items.map(item => ({
                _id: item.product._id,
                title: item.product.title,
                subject: item.product.subject,
                slug: item.product.slug,
                price: item.product.price,
                originalPrice: item.product.originalPrice,
                rating: item.product.rating,
                noOfDownloads: item.product.noOfDownloads,
                author: item.product.author,
                thumbnailUrl: item.product.docImage
                    ? `${process.env.BASE_URL || ""}/${item.product.docImage}`
                    : "/placeholder.svg",
            }));

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Cart fetched successfully";
            retData.data = items;

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in get cart");
        }
    },
    

    // --------------------------------------------------------
    // REMOVE ITEM FROM WISHLIST
    // --------------------------------------------------------
    removeFromWishlist: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { documentId } = req.body;
            if (!documentId) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Document ID is required";
                retData.data = null;
                return AppHelpers.Utils.cRes(res, retData);
            }

            const wishlist = await Wishlist.findOne({ user: req.user.id });

            if (!wishlist) {
                retData.status = "success";
                retData.code = 200;
                retData.httpCode = 200;
                retData.msg = "wishlist is empty";
                retData.data = [];
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Remove item from wishlist
            wishlist.items = wishlist.items.filter(
                item => item.product.toString() !== documentId
            );

            await wishlist.save();

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Item removed from wishlist";

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in remove from wishlist");
        }
    },

    // --------------------------------------------------------
    // REMOVE ITEM FROM CART
    // --------------------------------------------------------
    removeFromCart: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { documentId } = req.body;
            if (!documentId) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Document ID is required";
                retData.data = null;
                return AppHelpers.Utils.cRes(res, retData);
            }

            const cart = await Cart.findOne({ user: req.user.id });

            if (!cart || cart.items.length === 0) {
                retData.status = "success";
                retData.code = 200;
                retData.httpCode = 200;
                retData.msg = "Cart is empty";
                retData.data = [];
                return AppHelpers.Utils.cRes(res, retData);
            }

            // Remove item from cart
            cart.items = cart.items.filter(
                item => item.product.toString() !== documentId
            );

            await cart.save();

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Item removed from cart";

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in remove from cart");
        }
    },

    // --------------------------------------------------------
    // GET DOUCMENT BY ID
    // --------------------------------------------------------
    detailsById: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { id } = req.params;
    
            if (!id) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Document Id is required";
                return AppHelpers.Utils.cRes(res, retData);
            }

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

            // Only logged-in users get filePath
            if (req.user && document.filePath && !document.filePath.startsWith("http")) {
            document.filePath = `${process.env.BASE_URL}/${document.filePath}`;
            } else {
            document.filePath = null;
            }

            if (document.docImage && !document.docImage.startsWith("http")) {
            document.docImage = `${process.env.BASE_URL}/${document.docImage}`;
            }

            if (document.sampleFile && !document.sampleFile.startsWith("http")) {
            document.sampleFile = `${process.env.BASE_URL}/${document.sampleFile}`;
            }

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Record found";
            retData.data = document;

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in document details by id");
        }
    },

    // --------------------------------------------------------
    // CREATE ORDER ON RAZORPAY
    // --------------------------------------------------------
    createOrder: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { amount, currency, checkoutType } = req.body;
            const userId = req.user.id;

            if (!amount) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Amount is required";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // 1️⃣ Fetch cart snapshot
            const cartItems = await Cart.findOne({ user: userId })
            .populate({
                path: "items.product",
                select: "title price docImage slug", // optional fields
            });

            if (cartItems.items.length === 0) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Cart is empty";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // 2️⃣ Init Razorpay
            let razorpay;
            if (checkoutType === 1) {
                razorpay = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET,
                });
            } else {
                retData.status = "error";
                retData.msg = "Invalid checkout type";
                return AppHelpers.Utils.cRes(res, retData);
            }

            // 3️⃣ Create Razorpay Order
            const options = {
                amount: Math.round(amount * 100), // paise
                currency,
                receipt: `razorpay_receipt_${Date.now()}`,
            };

            const order = await razorpay.orders.create(options);

            // 4️⃣ Create Purchase Order (IMPORTANT)
            const purchaseOrder = await PurchaseOrder.create({
                userId,
                razorpayOrderId: order.id,
                amount,
                currency,
                status: "CREATED",
                items: cartItems.items.map(item => ({
                    productId: item.product._id,
                    title: item.product.title,
                    price: item.product.price,
                    quantity: item.quantity,
                })),
            });

            // 5️⃣ Create Invoice
            const invoice = await Invoice.create({
                userId,
                gateway: "razorpay",
                orderId: order.id,
                invoiceNumber: "INV-" + Date.now(),
                amount,
                currency,
                receipt: order.receipt,
                status: "PENDING",
            });

            // 6️⃣ Payment Log
            await PaymentLog.create({
                invoiceId: invoice._id,
                userId,
                gateway: "razorpay",
                orderId: order.id,
                eventType: "order_created",
                amount,
                currency,
                status: "PENDING",
                logData: order,
            });

            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Order created successfully!";
            retData.data = order;

            return AppHelpers.Utils.cRes(res, retData);

        } catch (error) {
            console.error("Create order error:", error);
            retData.status = "error";
            retData.msg = "Order creation failed";
            retData.data = [{ details: error.message }];
            return AppHelpers.Utils.cRes(res, retData);
        }
    },


    // --------------------------------------------------------
    // VERIFIED THE PAYMENT ON RAZORPAY
    // --------------------------------------------------------
    verifyPayment: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

            if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
                retData.status = "error";
                retData.code = 400;
                retData.httpCode = 400;
                retData.msg = "Payment details are required";
                return AppHelpers.Utils.cRes(res, retData);
            }

            /* ----------------------------------------------------
            1️⃣ VERIFY RAZORPAY SIGNATURE
            ---------------------------------------------------- */
            const secretKey = process.env.RAZORPAY_KEY_SECRET;
            const body = `${razorpay_order_id}|${razorpay_payment_id}`;

            const expectedSignature = crypto
            .createHmac("sha256", secretKey)
            .update(body)
            .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                retData.status = "error";
                retData.code = 403;
                retData.httpCode = 403;
                retData.msg = "Invalid payment signature";
                return AppHelpers.Utils.cRes(res, retData);
            }

            /* ----------------------------------------------------
            2️⃣ UPDATE INVOICE
            ---------------------------------------------------- */
            const invoice = await Invoice.findOneAndUpdate(
            { orderId: razorpay_order_id },
            {
                paymentId: razorpay_payment_id,
                status: "SUCCESS",
            },
            { new: true }
            );

            if (!invoice) {
                retData.status = "error";
                retData.code = 404;
                retData.httpCode = 404;
                retData.msg = "Invoice not found";
                return AppHelpers.Utils.cRes(res, retData);
            }

            /* ----------------------------------------------------
            3️⃣ CREATE PAYMENT LOG
            ---------------------------------------------------- */
            await PaymentLog.create({
                invoiceId: invoice._id,
                userId: invoice.userId,
                gateway: "razorpay",
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                eventType: "payment_success",
                status: "SUCCESS",
                amount: invoice.amount,
                logData: req.body,
            });

            /* ----------------------------------------------------
            4️⃣ UPDATE PURCHASE ORDER (THIS WAS THE BUG)
            ---------------------------------------------------- */
            const purchaseOrder = await PurchaseOrder.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            { status: "PAID" },
            { new: true }
            )
            .populate("userId", "name email")
            .populate(
                "items.productId",
                "title shortDescription price author subject exam language pages format filePath"
            );

            if (!purchaseOrder) {
                retData.status = "error";
                retData.msg = "Purchase order not found";
                return AppHelpers.Utils.cRes(res, retData);
            }

            /* ----------------------------------------------------
            5️⃣ CLEAR CART
            ---------------------------------------------------- */
            await Cart.findOneAndUpdate(
            { user: purchaseOrder.userId._id },
            { $set: { items: [] } }
            );

            /* ----------------------------------------------------
            6️⃣ SEND ORDER CONFIRMATION EMAIL
            ---------------------------------------------------- */
            const template = await EmailTemplate.findOne({
                key: "ORDER_CONFIRMATION",
                isActive: true,
            });

            if (template) {
            
                const parsedItems = purchaseOrder.items.map(item => ({
                    productId: item.productId._id,
                    title: item.productId.title,
                    shortDescription: item.productId.shortDescription,
                    price: item.productId.price,
                    author: item.productId.author,
                    subject: item.productId.subject,
                    exam: item.productId.exam,
                    language: item.productId.language,
                    pages: item.productId.pages,
                    format: item.productId.format,
                    filePath: item.productId.filePath,
                    quantity: item.quantity,
                }));

                const itemsHTML = Controller.buildOrderItemsHTML(parsedItems);

                const emailBody = template.body
                    .replace("{{name}}", purchaseOrder.userId.name)
                    .replace("{{orderId}}", purchaseOrder._id.toString())
                    .replace("{{amount}}", purchaseOrder.amount)
                    .replace("{{items}}", itemsHTML);

                const emailSubject = template.subject.replace(
                    "{{orderId}}",
                    purchaseOrder._id.toString()
                );

                console.log(emailBody);
                await sendEmail({
                    to: purchaseOrder.userId.email,
                    subject: emailSubject,
                    html: emailBody.replace(/\n/g, "<br/>"),
                });
            }

                /* ----------------------------------------------------
                7️⃣ RESPONSE
                ---------------------------------------------------- */
                retData.status = "success";
                retData.code = 200;
                retData.httpCode = 200;
                retData.msg = "Payment verified successfully!";
                retData.data = {
                    invoice,
                    purchaseOrderId: purchaseOrder._id,
                };

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            console.error("Payment verification error:", err);
            retData.status = "error";
            retData.code = 500;
            retData.httpCode = 500;
            retData.msg = "Payment verification failed";
            retData.data = { details: err.message };
            return AppHelpers.Utils.cRes(res, retData);
        }
    },

    // --------------------------------------------------------
    // GET PURCHASED NOTES (MY PURCHASES)
    // --------------------------------------------------------
    getPurchasedNotes: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            const userId = req.user.id;

            const orders = await PurchaseOrder.find({
                userId,
                status: "PAID",
            })
            .populate({
                path: "items.productId",
                select: "title price subject exam filePath updatedAt slug",
            })
            .sort({ created_at: -1 });


            if (!orders.length) {
                retData.status = "success";
                retData.code = 200;
                retData.msg = "No purchased notes found";
                retData.data = [];
                return AppHelpers.Utils.cRes(res, retData);
            }

            // 🔥 Flatten notes (important for frontend)
            const purchasedNotes = [];

            orders.forEach(order => {
                order.items.forEach(item => {
                    if (item) {
                        console.log(item);
                        purchasedNotes.push({
                            orderId: order._id,
                            purchaseDate: order.created_at,
                            razorpayOrderId: order.razorpayOrderId,
                            amountPaid: order.amount,
                            productId: item.productId._id,
                            title: item.productId.title,
                            price: item.productId.price,
                            subject: item.productId.subject,
                            filePath: process.env.BASE_URL+"/"+item.productId.filePath,
                            updateAt: item.productId.updatedAt,
                            slug: item.productId.slug
                        });
                    }
                });
            });

           

            retData.status = "success";
            retData.code = 200;
            retData.msg = "Purchased notes fetched successfully";
            retData.data = purchasedNotes;

            return AppHelpers.Utils.cRes(res, retData);

        } catch (error) {
            console.error("Get purchased notes error:", error);
            retData.status = "error";
            retData.code = 500;
            retData.msg = "Failed to fetch purchased notes";
            retData.data = { details: error.message };
            return AppHelpers.Utils.cRes(res, retData);
        }
    },


};

module.exports = Controller;

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Document,User, Testimonial } = require("../../../models/index.js");
const AppHelpers = require("../../../helpers/index.js");

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
    // HOME PAGE API
    // --------------------------------------------------------
    getHomePage: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // -------------------------------
            // Hero Section
            // -------------------------------
            const heroSection = {
                title: "Study Smarter with Quality Notes",
                subtitle: "Buy verified notes or sell yours. India's largest marketplace for educational content."
            };

            // -------------------------------
            // Featured Documents
            // -------------------------------
            const limit = 3; // number of featured documents to fetch
            const featuredDocs = await Document.find({
                status: 1,
                approvalStatus: "approved",
                isFeature: true
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

            // Add full file path for documents
            featuredDocs.forEach(doc => {
                if (doc.filePath && !doc.filePath.includes("http")) {
                    doc.filePath = `${process.env.BASE_URL}/${doc.filePath}`;
                }
                if (doc.docImage && !doc.docImage.includes("http")) {
                    doc.docImage = `${process.env.BASE_URL}/${doc.docImage}`;
                }
            });
            
            const featuredNotes = featuredDocs.map(doc => ({
                id: doc._id,
                title: doc.title,
                subject: doc.subject,
                description:doc.shortDescription,
                exam: doc.exam,
                price: `₹${doc.price}`,
                rating: doc.rating || 0,
                reviews: doc.reviewsCount,
                image: doc.docImage,
                slug:doc.slug
            }));

            const featuredSection = {
                title: "Featured Notes",
                subtitle: "Handpicked quality notes from top sellers",
                documents: featuredNotes
            };

            const testimonials = await Testimonial.find({ status: 1 })
            .select("name role content rating")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

            const testimonialSection = {
                title: "What Our Users Say",
                testimonials
            };

            // --------------------------------
            // STEPS SECTION
            // --------------------------------
            const stepsSection = {
                title: "How It Works",
                steps: [
                    {
                        icon: "Search",
                        title: "Search Notes",
                        description: "Browse through thousands of quality notes by subject, exam, or topic"
                    },
                    {
                        icon: "CheckCircle",
                        title: "Purchase Securely",
                        description: "Safe and secure payment gateway with instant access to your notes"
                    },
                    {
                        icon: "BookOpen",
                        title: "Start Learning",
                        description: "Download and study at your own pace with quality verified content"
                    }
                ]
            };

            // --------------------------------
            // BENEFITS SECTION
            // --------------------------------
            const benefitsSection = {
                title: "Why Choose Us",
                benefits: [
                    {
                        icon: "Award",
                        title: "Verified Content",
                        description: "All notes are reviewed for quality and accuracy"
                    },
                    {
                        icon: "Users",
                        title: "Community Driven",
                        description: "Learn from toppers and experienced educators"
                    },
                    {
                        icon: "TrendingUp",
                        title: "Earn While Learning",
                        description: "Upload your notes and earn passive income"
                    }
                ]
            };


            // -------------------------------
            // Response
            // -------------------------------
            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Record found";
            retData.data = {
                heroSection,
                featuredSection,
                stepsSection,
                benefitsSection,
                testimonialSection
            };

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in getHomePage");
        }
    },

    
};
module.exports = Controller;
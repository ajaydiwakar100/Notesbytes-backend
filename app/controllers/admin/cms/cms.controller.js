const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Document,User, Testimonial, GlobalSetting } = require("../../../models/index.js");
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
            // --------------------------------
            // GLOBAL SETTINGS (HOME CONTENT)
            // --------------------------------
            const globalSetting = await GlobalSetting.findOne({
                key: "home_page_content",
            }).lean();

            let homeContent = {};

            if (globalSetting?.value) {
                homeContent = JSON.parse(globalSetting.value);
            }

            // -------------------------------
            // HERO SECTION
            // -------------------------------
            const heroSection = {
                title: homeContent.heroTitle || "",
                subtitle: homeContent.heroSubtitle || "",
                status: homeContent.status ?? true,
            };

            // -------------------------------
            // FEATURED DOCUMENTS
            // -------------------------------
            const limit = 3;

            const featuredDocs = await Document.find({
                status: 1,
                approvalStatus: "approved",
                isFeature: true,
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

            featuredDocs.forEach((doc) => {
            if (doc.filePath && !doc.filePath.startsWith("http")) {
                doc.filePath = `${process.env.BASE_URL}/${doc.filePath}`;
            }
            if (doc.docImage && !doc.docImage.startsWith("http")) {
                doc.docImage = `${process.env.BASE_URL}/${doc.docImage}`;
            }
            });

            const featuredSection = {
            title: homeContent.featuredTitle || "Featured Notes",
            subtitle: homeContent.featuredSubtitle || "",
            documents: featuredDocs.map((doc) => ({
                id: doc._id,
                title: doc.title,
                author:doc.author,
                subject: doc.subject,
                description: doc.shortDescription,
                exam: doc.exam,
                price: doc.price,
                finalPrice: doc.finalPrice ? doc.finalPrice: null,
                rating: doc.rating || 0,
                reviews: doc.reviewsCount || 0,
                image: doc.docImage,
                slug: doc.slug,

            })),
            };

            // -------------------------------
            // TESTIMONIALS
            // -------------------------------
            const testimonials = await Testimonial.find({ status: 1 })
            .select("name role content rating")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

            const testimonialSection = {
                title: homeContent.testimonialTitle,
                testimonials,
            };

            // -------------------------------
            // STEPS SECTION
            // -------------------------------
            const stepsSection = {
                title: homeContent.stepsTitle ,
                steps: homeContent.steps || [],
            };

            // -------------------------------
            // BENEFITS SECTION
            // -------------------------------
            const benefitsSection = {
                title: homeContent.benefitsTitle ,
                benefits: homeContent.benefits || [],
            };

            // -------------------------------
            // RESPONSE
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
                testimonialSection,
            };

            return AppHelpers.Utils.cRes(res, retData);
        } catch (err) {
            return Controller.handleError(res, err, "ERROR in getHomePage");
        }
    },

    // --------------------------------------------------------
    // ABOUTS PAGE API
    // --------------------------------------------------------
    getAboutUsPage: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // --------------------------------
            // GLOBAL SETTINGS (ABOUT US)
            // --------------------------------
            const globalSetting = await GlobalSetting.findOne({
            key: "about_us_content",
            }).lean();

            let aboutContent = {};

            if (globalSetting?.value) {
            aboutContent = JSON.parse(globalSetting.value);
            }

            // --------------------------------
            // HERO SECTION
            // --------------------------------
            const heroSection = {
            title: aboutContent.heroTitle || "",
            description: aboutContent.heroDescription || "",
            };

            // --------------------------------
            // STORY SECTION
            // --------------------------------
            const storySection = {
            title: aboutContent.storyTitle || "",
            description: aboutContent.storyDescription || "",
            };

            // --------------------------------
            // VISION SECTION
            // --------------------------------
            const visionSection = {
            icon: aboutContent.visionIcon || "",
            title: aboutContent.visionTitle || "",
            description: aboutContent.visionDescription || "",
            };

            // --------------------------------
            // MISSION SECTION
            // --------------------------------
            const missionSection = {
            icon: aboutContent.missionIcon || "",
            title: aboutContent.missionTitle || "",
            description: aboutContent.missionDescription || "",
            };

            // --------------------------------
            // STATS SECTION
            // --------------------------------
            const statsSection = [
            {
                icon: aboutContent.happyStudentsIcon,
                title: aboutContent.happyStudentsTitle,
            },
            {
                icon: aboutContent.activeSellersIcon,
                title: aboutContent.activeSellersTitle,
            },
            {
                icon: aboutContent.qualityNotesIcon,
                title: aboutContent.qualityNotesTitle,
            },
            {
                icon: aboutContent.paidToSellersIcon,
                title: aboutContent.paidToSellersTitle,
            },
            ];

            // --------------------------------
            // VALUES SECTION
            // --------------------------------
            const valuesSection = {
            title: aboutContent.communityTitle || "",
            description: aboutContent.communityDescription || "",
            values: aboutContent.values || [],
            };

            // --------------------------------
            // JOURNEY SECTION
            // --------------------------------
            const journeySection = {
            journey: aboutContent.journey || [],
            };

            // --------------------------------
            // RESPONSE
            // --------------------------------
            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Record found";
            retData.data = {
            heroSection,
            storySection,
            visionSection,
            missionSection,
            statsSection,
            valuesSection,
            journeySection,
            };

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in getAboutUsPage");
        }
    },

    // --------------------------------------------------------
    // ABOUTS PAGE API
    // --------------------------------------------------------
    getAboutUsPage: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // --------------------------------
            // GLOBAL SETTINGS (ABOUT US)
            // --------------------------------
            const globalSetting = await GlobalSetting.findOne({
            key: "about_us_content",
            }).lean();

            let aboutContent = {};

            if (globalSetting?.value) {
            aboutContent = JSON.parse(globalSetting.value);
            }

            // --------------------------------
            // HERO SECTION
            // --------------------------------
            const heroSection = {
            title: aboutContent.heroTitle || "",
            description: aboutContent.heroDescription || "",
            };

            // --------------------------------
            // STORY SECTION
            // --------------------------------
            const storySection = {
            title: aboutContent.storyTitle || "",
            description: aboutContent.storyDescription || "",
            };

            // --------------------------------
            // VISION SECTION
            // --------------------------------
            const visionSection = {
            icon: aboutContent.visionIcon || "",
            title: aboutContent.visionTitle || "",
            description: aboutContent.visionDescription || "",
            };

            // --------------------------------
            // MISSION SECTION
            // --------------------------------
            const missionSection = {
            icon: aboutContent.missionIcon || "",
            title: aboutContent.missionTitle || "",
            description: aboutContent.missionDescription || "",
            };

            // --------------------------------
            // STATS SECTION
            // --------------------------------
            const statsSection = [
            {
                icon: aboutContent.happyStudentsIcon,
                title: aboutContent.happyStudentsTitle,
            },
            {
                icon: aboutContent.activeSellersIcon,
                title: aboutContent.activeSellersTitle,
            },
            {
                icon: aboutContent.qualityNotesIcon,
                title: aboutContent.qualityNotesTitle,
            },
            {
                icon: aboutContent.paidToSellersIcon,
                title: aboutContent.paidToSellersTitle,
            },
            ];

            // --------------------------------
            // VALUES SECTION
            // --------------------------------
            const valuesSection = {
            title: aboutContent.communityTitle || "",
            description: aboutContent.communityDescription || "",
            values: aboutContent.values || [],
            };

            // --------------------------------
            // JOURNEY SECTION
            // --------------------------------
            const journeySection = {
            journey: aboutContent.journey || [],
            };

            // --------------------------------
            // RESPONSE
            // --------------------------------
            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Record found";
            retData.data = {
                heroSection,
                storySection,
                visionSection,
                missionSection,
                statsSection,
                valuesSection,
                journeySection,
            };

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in getAboutUsPage");
        }
    },

    // --------------------------------------------------------
    // SELL NOTES PAGE API
    // --------------------------------------------------------
    getSellNotesPage: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // --------------------------------
            // GLOBAL SETTINGS (SELL NOTES)
            // --------------------------------
            const globalSetting = await GlobalSetting.findOne({
            key: "sell_notes_content",
            }).lean();

            let sellContent = {};

            if (globalSetting?.value) {
            sellContent = JSON.parse(globalSetting.value);
            }

            // --------------------------------
            // HERO SECTION
            // --------------------------------
            const heroSection = {
            title: sellContent.heroTitle || "",
            description: sellContent.heroDescription || "",
            };

            // --------------------------------
            // STATS SECTION
            // --------------------------------
            const statsSection = [
            {
                icon: sellContent.activeSellersIcon || "",
                title: sellContent.activeSellersTitle || "",
            },
            {
                icon: sellContent.paidToSellersIcon || "",
                title: sellContent.paidToSellersTitle || "",
            },
            {
                icon: sellContent.commissionRateIcon || "",
                title: sellContent.commissionRateTitle || "",
            },
            ];

            // --------------------------------
            // SELLING STEPS SECTION
            // --------------------------------
            const sellingStepsSection = {
            title: "How Selling Works",
            steps: sellContent.sellingSteps || [],
            };

            // --------------------------------
            // WHY SELL SECTION
            // --------------------------------
            const whySellSection = {
            title: "Why Sell on NotesByte",
            items: sellContent.whySell || [],
            };

            // --------------------------------
            // RESPONSE
            // --------------------------------
            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Record found";
            retData.data = {
            heroSection,
            statsSection,
            sellingStepsSection,
            whySellSection,
            };

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in getSellNotesPage");
        }
    },

    // --------------------------------------------------------
    // TERMS & CONDITIONS PAGE API
    // --------------------------------------------------------
    getTermsPage: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // --------------------------------
            // GLOBAL SETTINGS (TERMS CONTENT)
            // --------------------------------
            const globalSetting = await GlobalSetting.findOne({
            key: "terms_conditions_content",
            }).lean();

            let termsContent = {};

            if (globalSetting?.value) {
            termsContent = JSON.parse(globalSetting.value);
            }

            // --------------------------------
            // HERO SECTION
            // --------------------------------
            const heroSection = {
            title: termsContent.heroTitle || "Terms & Conditions",
            description: termsContent.heroDescription || "",
            lastUpdated: termsContent.lastUpdated || "",
            };

            // --------------------------------
            // INTRO SECTION
            // --------------------------------
            const introSection = {
            text: termsContent.introText || "",
            };

            // --------------------------------
            // RESPONSIBILITIES SECTION
            // --------------------------------
            const responsibilitiesSection = {
            title: termsContent.responsibilitiesTitle || "",
            description: termsContent.responsibilitiesDescription || "",
            };

            // --------------------------------
            // PAYMENT SECTION
            // --------------------------------
            const paymentSection = {
            title: termsContent.paymentTitle || "",
            description: termsContent.paymentDescription || "",
            };

            // --------------------------------
            // TERMINATION SECTION
            // --------------------------------
            const terminationSection = {
            title: termsContent.terminationTitle || "",
            description: termsContent.terminationDescription || "",
            };

            // --------------------------------
            // LEGAL SECTION
            // --------------------------------
            const legalSection = {
            liabilityDescription: termsContent.liabilityDescription || "",
            governingLawDescription: termsContent.governingLawDescription || "",
            };

            // --------------------------------
            // TERMS LIST
            // --------------------------------
            const termsList = termsContent.termsList || [];

            // --------------------------------
            // CONTACT SECTION
            // --------------------------------
            const contactSection = {
            email: termsContent.contactEmail || "",
            phone: termsContent.contactPhone || "",
            };

            // --------------------------------
            // RESPONSE
            // --------------------------------
            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Record found";
            retData.data = {
            heroSection,
            introSection,
            responsibilitiesSection,
            paymentSection,
            terminationSection,
            legalSection,
            termsList,
            contactSection,
            };

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in getTermsPage");
        }
    },

    // --------------------------------------------------------
    // PRIVACY POLICY PAGE API
    // --------------------------------------------------------
    getPrivacy:async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // --------------------------------
            // GLOBAL SETTINGS (PRIVACY CONTENT)
            // --------------------------------
            const globalSetting = await GlobalSetting.findOne({
            key: "privacy_policy_content",
            }).lean();

            let privacyContent = {};

            if (globalSetting?.value) {
            privacyContent = JSON.parse(globalSetting.value);
            }

            // --------------------------------
            // INFORMATION COLLECTION SECTION
            // --------------------------------
            const informationCollectSection = {
            title: privacyContent.informationCollectTitle || "",
            description: privacyContent.informationCollectDescription || "",
            };

            // --------------------------------
            // USAGE SECTION
            // --------------------------------
            const usageSection = {
            title: privacyContent.usageTitle || "",
            description: privacyContent.usageDescription || "",
            };

            // --------------------------------
            // COOKIES SECTION
            // --------------------------------
            const cookiesSection = {
            title: privacyContent.cookiesTitle || "",
            description: privacyContent.cookiesDescription || "",
            };

            // --------------------------------
            // DATA SECURITY SECTION
            // --------------------------------
            const dataSecuritySection = {
            description: privacyContent.dataSecurityDescription || "",
            };

            // --------------------------------
            // THIRD PARTY SECTION
            // --------------------------------
            const thirdPartySection = {
            description: privacyContent.thirdPartyDescription || "",
            };

            // --------------------------------
            // USER RIGHTS SECTION
            // --------------------------------
            const userRightsSection = {
            description: privacyContent.userRightsDescription || "",
            };

            // --------------------------------
            // PRIVACY SECTIONS (INTRO ETC.)
            // --------------------------------
            const privacySections = privacyContent.privacySections || [];

            // --------------------------------
            // CONTACT SECTION
            // --------------------------------
            const contactSection = {
            email: privacyContent.contactEmail || "",
            phone: privacyContent.contactPhone || "",
            };

            // --------------------------------
            // RESPONSE
            // --------------------------------
            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Record found";
            retData.data = {
            privacySections,
            informationCollectSection,
            usageSection,
            cookiesSection,
            dataSecuritySection,
            thirdPartySection,
            userRightsSection,
            contactSection,
            };

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in getPrivacyPolicyPage");
        }
    },

     // --------------------------------------------------------
    // REFUND POLICY PAGE API
    // --------------------------------------------------------
    getRefund:async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // --------------------------------
            // GLOBAL SETTINGS (REFUND POLICY)
            // --------------------------------
            const globalSetting = await GlobalSetting.findOne({
            key: "refund_cancellation_policy_content",
            }).lean();

            let refundContent = {};

            if (globalSetting?.value) {
            refundContent = JSON.parse(globalSetting.value);
            }

            // --------------------------------
            // PROCESSING TIME SECTION
            // --------------------------------
            const processingTimeSection = {
            description: refundContent.processingTimeDescription || "",
            };

            // --------------------------------
            // NON-REFUNDABLE SECTION
            // --------------------------------
            const nonRefundableSection = {
            description: refundContent.nonRefundableDescription || "",
            };

            // --------------------------------
            // REFUND ELIGIBILITY
            // --------------------------------
            const refundEligibilitySection = refundContent.refundEligibility || [];

            // --------------------------------
            // CANCELLATION POLICY
            // --------------------------------
            const cancellationPolicySection = refundContent.cancellationPolicy || [];

            // --------------------------------
            // REFUND PROCESS
            // --------------------------------
            const refundProcessSection = refundContent.refundProcess || [];

            // --------------------------------
            // POLICY SECTIONS (EXTRA DETAILS)
            // --------------------------------
            const policySections = refundContent.policySections || [];

            // --------------------------------
            // CONTACT SECTION
            // --------------------------------
            const contactSection = {
            email: refundContent.contactEmail || "",
            phone: refundContent.contactPhone || "",
            };

            // --------------------------------
            // RESPONSE
            // --------------------------------
            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Record found";
            retData.data = {
            processingTimeSection,
            nonRefundableSection,
            refundEligibilitySection,
            cancellationPolicySection,
            refundProcessSection,
            policySections,
            contactSection,
            };

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in getRefundPolicyPage");
        }
    },
    

   // --------------------------------------------------------
    // GLOBAL SETTINGS API
    // --------------------------------------------------------
    getSetting: async (req, res) => {
        const retData = AppHelpers.Utils.responseObject();

        try {
            // --------------------------------
            // GLOBAL SETTINGS
            // --------------------------------
            const globalSetting = await GlobalSetting.findOne({
            key: "global_settings_content",
            }).lean();

            let settings = {};

            if (globalSetting?.value) {
            settings = JSON.parse(globalSetting.value);
            }

            // --------------------------------
            // APP BASIC INFO
            // --------------------------------
            const appSection = {
            name: settings.appName || "",
            logo: settings.appLogo || "",
            footerText: settings.footerText || "",
            commission: settings.commission || "0",
            };

            // --------------------------------
            // CONTACT INFO
            // --------------------------------
            const contactSection = {
            email: settings.email || "",
            phone: settings.phone || "",
            };

            // --------------------------------
            // SOCIAL LINKS
            // --------------------------------
            const socialLinks = settings.socialLinks || [];

            // --------------------------------
            // FILTER / MASTER DATA
            // --------------------------------
            const masterData = {
            subjects: settings.subjects || [],
            exams: settings.exams || [],
            notesLanguages: settings.notesLanguages || [],
            };

            // --------------------------------
            // RESPONSE
            // --------------------------------
            retData.status = "success";
            retData.code = 200;
            retData.httpCode = 200;
            retData.msg = "Settings loaded successfully";
            retData.data = {
            appSection,
            contactSection,
            socialLinks,
            masterData,
            };

            return AppHelpers.Utils.cRes(res, retData);

        } catch (err) {
            return Controller.handleError(res, err, "ERROR in getSetting");
        }
    },
    
};
module.exports = Controller;
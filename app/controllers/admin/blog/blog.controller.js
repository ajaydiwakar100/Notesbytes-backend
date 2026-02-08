const mongoose = require("mongoose");
const {Blog} = require("../../../models/index");
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


  createOrUpdate: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params; // 👈 if present → update
      const {
        title,
        category,
        author,
        content,
        tags,
        readTime,
        status
      } = req.body;

      if (!title) {
        retData.status = "error";
        retData.httpCode = 400;
        retData.msg = "Title is required 1";
        return AppHelpers.Utils.cRes(res, retData);
      }

      /* -------------------------------
        Slug generator
      --------------------------------*/
      const createSlug = (text) =>
        text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[\s\W-]+/g, "-")
          .replace(/^-+|-+$/g, "");

      let slug = createSlug(title);

      // Ensure unique slug (ignore current blog when updating)
      let slugQuery = { slug };
      if (id) slugQuery._id = { $ne: id };

      let slugExists = await Blog.findOne(slugQuery);
      let counter = 1;

      while (slugExists) {
        slug = `${createSlug(title)}-${counter}`;
        slugQuery.slug = slug;
        slugExists = await Blog.findOne(slugQuery);
        counter++;
      }

      /* -------------------------------
        Image handling (multer)
      --------------------------------*/
      let imagePath;
      if (req.file) {
        imagePath = `/uploads/admin/blogs/${req.file.filename}`;
      }

      /* -------------------------------
        UPDATE
      --------------------------------*/
      if (id) {
        const blog = await Blog.findById(id);

        if (!blog) {
          retData.status = "error";
          retData.httpCode = 404;
          retData.msg = "Blog not found";
          return AppHelpers.Utils.cRes(res, retData);
        }

        blog.title = title;
        blog.slug = slug;
        blog.category = category;
        blog.author = author;
        blog.content = content;
        blog.tags = tags;
        blog.readTime = readTime;
        blog.status = status;
        

        // update image only if new image uploaded
        if (imagePath) {
          blog.image = imagePath;
        }

        await blog.save();

        retData.status = "success";
        retData.httpCode = 200;
        retData.msg = "Blog updated successfully";
        retData.data = blog;

        return AppHelpers.Utils.cRes(res, retData);
      }

      /* -------------------------------
        CREATE
      --------------------------------*/
      const blog = await Blog.create({
        title,
        slug,
        category,
        author,
        content,
        image: imagePath || null,
        tags,
        readTime,
        status
      });

      retData.status = "success";
      retData.httpCode = 200;
      retData.msg = "Blog created successfully";
      retData.data = blog;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  },


  // LIST BLOGS (Admin)
  list: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const blogs = await Blog.find()
        .sort({ createdAt: -1 });

      retData.status = "success";
      retData.httpCode = 200;
      retData.data = blogs;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  },

  // GET SINGLE BLOG (Admin)
  detail: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        retData.status = "error";
        retData.httpCode = 400;
        retData.msg = "Invalid Blog ID";
        return AppHelpers.Utils.cRes(res, retData);
      }

      const blog = await Blog.findById(id).lean();

      if (!blog) {
        retData.status = "error";
        retData.httpCode = 404;
        retData.msg = "Blog not found";
        return AppHelpers.Utils.cRes(res, retData);
      }

      // ✅ Convert image path to full URL
      const fullUrl = (file) =>
        file && !file.startsWith("http")
          ? `${process.env.BASE_URL}${file}`
          : file;

      blog.image = fullUrl(blog.image);

      retData.status = "success";
      retData.httpCode = 200;
      retData.data = blog;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  },


  // UPDATE BLOG
  update: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const { id, ...payload } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        retData.status = "error";
        retData.httpCode = 400;
        retData.msg = "Invalid Blog ID";
        return AppHelpers.Utils.cRes(res, retData);
      }

      const blog = await Blog.findByIdAndUpdate(
        id,
        payload,
        { new: true }
      );

      retData.status = "success";
      retData.httpCode = 200;
      retData.msg = "Blog updated successfully";
      retData.data = blog;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  },

  // UPDATE STATUS (Draft / Published)
  updateStatus: async (req, res) => {
    console.log("DD");
    const retData = AppHelpers.Utils.responseObject();
    try {
      const { id, status } = req.body;

      const blog = await Blog.findByIdAndUpdate(
        id,
        {
          status,
          publishedAt: status === "published" ? new Date() : null
        },
        { new: true }
      );

      retData.status = "success";
      retData.httpCode = 200;
      retData.data = blog;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  },

  // DELETE BLOG
  delete: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const { id } = req.body;

      await Blog.findByIdAndDelete(id);

      retData.status = "success";
      retData.httpCode = 200;
      retData.msg = "Blog deleted successfully";

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  },

  // LIST BLOGS (Published)
  getAllPublishBlog: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const blogs = await Blog.find({ status: "published" })
        .sort({ createdAt: -1 })
        .lean(); 

      const BASE_URL = process.env.BASE_URL;

      const data = blogs.map(blog => ({
        ...blog,
        image: blog.image
          ? `${BASE_URL}${blog.image}`
          : null
      }));

      retData.status = "success";
      retData.httpCode = 200;
      retData.data = data;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  },

  getPublishedBlogDetail: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { slug } = req.params;

      const blog = await Blog.findOne({
        slug,
        status: "published", // ✅ only published blogs
      }).lean();

      if (!blog) {
        retData.status = "error";
        retData.httpCode = 404;
        retData.msg = "Blog not found";
        return AppHelpers.Utils.cRes(res, retData);
      }

      // ✅ full image URL
      blog.image = blog.image
        ? `${process.env.BASE_URL}${blog.image}`
        : null;

      retData.status = "success";
      retData.httpCode = 200;
      retData.data = blog;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  },


};

module.exports = Controller;

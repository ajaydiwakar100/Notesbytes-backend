const mongoose = require("mongoose");
const {Testimonial} = require("../../../models/index");
const AppHelpers = require("../../../helpers/index.js");

const Controller = {

  // CREATE
  create: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const { name, role, content, rating } = req.body;

      const testimonial = await Testimonial.create({
        name,
        role,
        content,
        rating
      });

      retData.status = "success";
      retData.httpCode = 200;
      retData.msg = "Testimonial added successfully";
      retData.data = testimonial;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  },

  // LIST (Admin)
  list: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const testimonials = await Testimonial.find()
        .sort({ createdAt: -1 });

      retData.status = "success";
      retData.httpCode = 200;
      retData.data = testimonials;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  },

  // UPDATE STATUS
  updateStatus: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const { id, status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        retData.status = "error";
        retData.httpCode = 400;
        retData.msg = "Invalid ID";
        return AppHelpers.Utils.cRes(res, retData);
      }

      const testimonial = await Testimonial.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      retData.status = "success";
      retData.httpCode = 200;
      retData.data = testimonial;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  },

  // DELETE
  delete: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const { id } = req.body;

      await Testimonial.findByIdAndDelete(id);

      retData.status = "success";
      retData.httpCode = 200;
      retData.msg = "Testimonial deleted";

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return AppHelpers.Utils.cRes(res, Controller.handleError(res, err));
    }
  }
};

module.exports = Controller;

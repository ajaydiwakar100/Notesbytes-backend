const crypto = require('crypto');
const mongoose = require('mongoose');
const _ = require('lodash'); // Assuming you were using lodash in your original code

const Utils = {
  responseObject: function () {
    return {
      status: "success",      // "success" or "error"
      code: 200,              // HTTP code
      msg: "",                // Message string
      data: null,             // Payload
    };
  },

  cRes: function (res, data) {
    const code = data.code || (data.status === "success" ? 200 : 400);
    const httpCode = data.httpCode || code;
    return res.status(httpCode).json({
      status: data.status,
      code: code,
      msg: data.msg || "",
      data: data.data || null
    });
  },

  genHashToken: async function (bytes) {
    try {
      return await crypto.randomBytes(bytes).toString('hex');
    } catch (err) {
      console.log("Error in Utils helper genHashToken ", err);
      return null;
    }
  },

  genRandomToken: async function () {
    return await this.genHashToken(32);
  },

  genRandomNumber: function (digits) {
    digits = digits || 6;
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return _.random(min, max);
  },

  isValidEmail: function (email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },

  clone: function (obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  ObjectId: function (id) {
    return new mongoose.Types.ObjectId(id);
  },

  isValidObjectIdString: function (id) {
    return mongoose.isValidObjectId(id);
  },

  isValidUserRole: function (role) {
    return _.indexOf(['TUT', 'STU'], role) !== -1;
  },

  sortArrObj: function (obj, key, method) {
    obj.sort(function (a, b) {
      const nameA = _.get(a, key).toUpperCase();
      const nameB = _.get(b, key).toUpperCase();
      if (method === 'DESC') {
        if (nameA > nameB) return -1;
        if (nameA < nameB) return 1;
      } else {
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
      }
      return 0;
    });
    return obj;
  },

  mask: function (str) {
    if (!_.isString(str)) str = str.toString();
    const maskVal = 'X';
    if (str && str.length > 4) {
      str = `${maskVal.repeat(str.length - 4)}${str.substr(-4)}`;
    }
    return str;
  },

  roundNumber: function (val, dec = 2) {
    const mp = Math.pow(10, dec);
    return Math.round(val * mp) / mp;
  },

  getObjectToBlank: function (_obj) {
    _obj.s3Url = process.env.S3_URL;
    _obj.isPasswordSet = (_obj.password != null ? 1 : 0);
    _obj.password = undefined;
    _obj.country_code = _obj.country_code || "";
    _obj.first_name = _obj.first_name || "";
    _obj.last_name = _obj.last_name || "";
    _obj.email = _obj.email || "";
    _obj.nif = _obj.nif || "";
    _obj.patent_number = _obj.patent_number || "";
    _obj.dob = _obj.dob || "";
    _obj.addressDetails = _obj.addressDetails || {};
    _obj.is_admin_verified = _obj.is_admin_verified || "";
    _obj.user_type = _obj.user_type || "";
    _obj.kycFileNames = (_obj.kycFileNames && _obj.kycFileNames.length !== 0) ? _obj.kycFileNames : [];
    _obj.is_kyc_approved = _obj.is_kyc_approved || 1;
    return _obj;
  },

  getExtension: function (filename) {
    return filename.split('.').pop();
  }
};

module.exports = Utils;

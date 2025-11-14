module.exports = app => {
  const globalsettings = require("../controllers/globalsetting.controller.js");

  var router = require("express").Router();

  // Create a new Tutorial
  router.post("/", globalsettings.create);

  // Retrieve all Tutorials
  router.get("/", globalsettings.findAll);

  // Retrieve all published Tutorials
  // router.get("/published", tutorials.findAllPublished);

  // Retrieve a single Tutorial with id
  //router.get("/:id", tutorials.findOne);

  // Update a Tutorial with id
  router.put("/:id", globalsettings.update);

  // Delete a Tutorial with id
  //router.delete("/:id", tutorials.delete);

  // Create a new Tutorial
  //router.delete("/", tutorials.deleteAll);

  app.use("/api/globalsettings", router);
};

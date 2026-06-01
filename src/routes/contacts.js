const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

// Should ideally use auth middleware, but we will keep it simple
router.get("/", contactController.getContacts);
router.post("/", contactController.createContact);
router.post("/import", contactController.importContactsFromExcel);
router.put("/:id", contactController.editContact);
router.delete("/:id", contactController.deleteContact);

module.exports = router;

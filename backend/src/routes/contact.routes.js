const router = require("express").Router();
const contact = require("../controllers/contact.controller");

router.post("/", contact.submitContact);

module.exports = router;

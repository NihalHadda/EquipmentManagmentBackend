const router = require("express").Router();
const roleCtrl = require("../controllers/roleController");
const { protect, authorizeRole } = require("../middleware/authMiddleware");

// ta3mel test 3la token ken l user connecte wale
//autorizeRole: ta3mel test 3la role mta3ou l user 3andou permission mta3 l manage role wale ken ma3andouch matekhdmch
router.get("/", protect, authorizeRole("manage_roles"), roleCtrl.getRoles);
router.post("/", protect, authorizeRole("manage_roles"), roleCtrl.createRole);
router.put("/:id", protect, authorizeRole("manage_roles"), roleCtrl.updateRole);
router.delete("/:id", protect, authorizeRole("manage_roles"), roleCtrl.deleteRole);

module.exports = router;
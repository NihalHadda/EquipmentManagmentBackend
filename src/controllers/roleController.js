const Role = require("../models/role");

exports.createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const existing = await Role.findOne({ name });
    if (existing) return res.status(400).json({ message: "Role exists" });

    const role = await Role.create({ name, permissions });
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(role);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: "Role deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

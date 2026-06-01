const Contact = require("../models/Contact");
const xlsx = require("xlsx");
const path = require("path");

const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.findAll();
    res.json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createContact = async (req, res) => {
  try {
    let { name, mobileNo } = req.body;
    if (!name || !mobileNo) {
      return res.status(400).json({ success: false, error: "Name and Mobile No are required" });
    }
    
    // Ensure mobileNo is string and normalize
    mobileNo = String(mobileNo).trim().replace(/\s+/g, "");
    
    // basic check to prevent duplicates
    const existing = await Contact.findOne({ where: { mobileNo } });
    if (existing) {
      return res.status(400).json({ success: false, error: "Contact with this mobile number already exists." });
    }

    const contact = await Contact.create({ name, mobileNo });
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Contact.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }
    res.json({ success: true, message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const editContact = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, mobileNo } = req.body;
    
    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    if (mobileNo) {
      mobileNo = String(mobileNo).trim().replace(/\s+/g, "");
      const existing = await Contact.findOne({ where: { mobileNo } });
      if (existing && existing.id !== parseInt(id)) {
        return res.status(400).json({ success: false, error: "Contact with this mobile number already exists." });
      }
      contact.mobileNo = mobileNo;
    }

    if (name) contact.name = name;
    
    await contact.save();
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const importContactsFromExcel = async (req, res) => {
  try {
    // Read from the file in public
    const filePath = path.join(__dirname, "../../../my-react-app/public/PARENT MOBILE NO.xlsx");
    const workbook = xlsx.readFile(filePath);
    const sheet_name_list = workbook.SheetNames;
    const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    let importedCount = 0;
    
    for (const row of xlData) {
      const name = row["PARENT NAME"];
      const mobileNo = row["MOBILE NO"];
      
      if (name && mobileNo) {
        const noStr = String(mobileNo).trim();
        // Skip existing
        const existing = await Contact.findOne({ where: { mobileNo: noStr } });
        if (!existing) {
          await Contact.create({ name, mobileNo: noStr });
          importedCount++;
        }
      }
    }

    res.json({ success: true, message: `Successfully imported ${importedCount} contacts.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getContacts,
  createContact,
  deleteContact,
  editContact,
  importContactsFromExcel,
};

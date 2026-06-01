const { Sequelize } = require("sequelize");
const { connectDB } = require("./src/config/db");
const Query = require("./src/models/Query");
const Contact = require("./src/models/Contact");

const fixNames = async () => {
  await connectDB();
  const queries = await Query.findAll();
  let updatedCount = 0;
  for (const q of queries) {
    let searchNumber = q.from;
    if (searchNumber.startsWith("91") && searchNumber.length === 12) {
      searchNumber = searchNumber.substring(2);
    }
    let contact = await Contact.findOne({ where: { mobileNo: searchNumber } });
    if (!contact) {
      contact = await Contact.findOne({ where: { mobileNo: q.from } });
    }
    
    if (contact && q.name !== contact.name) {
      q.name = contact.name;
      await q.save();
      updatedCount++;
      console.log(`Updated query ${q.from} name to ${contact.name}`);
    }
  }
  console.log(`Finished updating ${updatedCount} queries.`);
  process.exit(0);
};

fixNames();

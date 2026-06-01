const { connectDB } = require("./src/config/db");
const Contact = require("./src/models/Contact");
const Query = require("./src/models/Query");

async function fix() {
  await connectDB();
  
  // 1. Clean spaces in Contacts
  const contacts = await Contact.findAll();
  for (let c of contacts) {
    if (c.mobileNo.includes(" ")) {
      const cleaned = c.mobileNo.replace(/\s+/g, "");
      c.mobileNo = cleaned;
      await c.save();
      console.log(`Cleaned contact ${c.name} -> ${cleaned}`);
    }
  }
  
  // 2. Synchronize all Queries with the updated Contacts
  const allContacts = await Contact.findAll();
  const queries = await Query.findAll();
  for (let q of queries) {
    let cleanFrom = q.from.replace(/\s+/g, ""); // incoming number
    let searchNumber = cleanFrom;
    if (searchNumber.startsWith("91") && searchNumber.length === 12) {
      searchNumber = searchNumber.substring(2);
    }
    const match = allContacts.find(c => {
      const cNum = c.mobileNo.replace(/\s+/g, "");
      return cNum === searchNumber || cNum === cleanFrom;
    });
    if (match && q.name !== match.name) {
      q.name = match.name;
      await q.save();
      console.log(`Updated query ${q.from} to name ${match.name}`);
    }
  }
  
  console.log("Done");
  process.exit(0);
}
fix();

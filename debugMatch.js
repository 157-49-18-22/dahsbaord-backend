const { connectDB } = require("./src/config/db");
const Contact = require("./src/models/Contact");
const Query = require("./src/models/Query");

async function debug() {
  await connectDB();
  
  // Simulate exact webhook logic for 919625613008
  const from = "919625613008";
  const cleanFrom = from.replace(/\s+/g, "");
  let searchNumber = cleanFrom;
  if (searchNumber.startsWith("91") && searchNumber.length === 12) {
    searchNumber = searchNumber.substring(2);
  }
  
  console.log(`\n--- Webhook Simulation ---`);
  console.log(`from:         ${from}`);
  console.log(`cleanFrom:    ${cleanFrom}`);
  console.log(`searchNumber: ${searchNumber}`);
  
  const contactList = await Contact.findAll();
  console.log(`\n--- All Contacts in DB ---`);
  contactList.forEach(c => {
    const cNum = c.mobileNo.replace(/\s+/g, "");
    const matchA = cNum === searchNumber;
    const matchB = cNum === cleanFrom;
    console.log(`  ${c.name} -> "${c.mobileNo}" | matchBy10digit: ${matchA} | matchBy12digit: ${matchB}`);
  });
  
  const match = contactList.find(c => {
    const cNum = c.mobileNo.replace(/\s+/g, "");
    return cNum === searchNumber || cNum === cleanFrom;
  });
  console.log(`\nMatch found: ${match ? match.name + " (" + match.mobileNo + ")" : "NONE"}`);
  
  // Check current query in DB
  const q = await Query.findOne({ where: { from: "919625613008" } });
  console.log(`\nQuery in DB: name="${q?.name}", status="${q?.status}"`);
  
  process.exit(0);
}
debug();

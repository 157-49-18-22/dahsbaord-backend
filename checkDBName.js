const { connectDB } = require("./src/config/db");
const Query = require("./src/models/Query");

async function check() {
  await connectDB();
  const q = await Query.findOne({ where: { from: '919625613008' } });
  console.log("Query Name is:", q ? q.name : "Not found");
  process.exit(0);
}
check();

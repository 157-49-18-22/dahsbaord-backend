const xlsx = require('xlsx');
const filePath = '../my-react-app/public/PARENT MOBILE NO.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

let noMobile = [];
let duplicates = [];
let uniqueSet = new Set();
let validCount = 0;

xlData.forEach((row, i) => {
  const rowNum = i + 2; // +1 for 0-index, +1 for header
  const name = row["PARENT NAME"];
  const mobile = row["MOBILE NO"];
  
  if (!mobile) {
    noMobile.push({ row: rowNum, name, mobile });
  } else {
    const noStr = String(mobile).trim();
    if (uniqueSet.has(noStr)) {
      duplicates.push({ row: rowNum, name, mobile: noStr });
    } else {
      uniqueSet.add(noStr);
      validCount++;
    }
  }
});

console.log(`Total Rows (excluding header): ${xlData.length}`);
console.log(`Missing Mobile Numbers: ${noMobile.length}`);
console.log(`Duplicate Mobile Numbers: ${duplicates.length}`);
console.log(`Valid Unique Inserted: ${validCount}`);
console.log(`Total: ${noMobile.length + duplicates.length + validCount}`);

console.log("\n--- Missing Mobile Details ---");
console.table(noMobile);

console.log("\n--- Duplicate Details ---");
console.table(duplicates);

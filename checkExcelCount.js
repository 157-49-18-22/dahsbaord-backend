const xlsx = require('xlsx');
const filePath = '../my-react-app/public/PARENT MOBILE NO.xlsx';
const workbook = xlsx.readFile(filePath);

console.log("Sheet Names:", workbook.SheetNames);

let totalRows = 0;
let validRows = 0;
let uniqueNumbers = new Set();

workbook.SheetNames.forEach(sheetName => {
  const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  console.log(`Sheet "${sheetName}" has ${xlData.length} rows.`);
  totalRows += xlData.length;
  
  xlData.forEach(row => {
    // try different variations of column names
    const name = row["PARENT NAME"] || row["Parent Name"] || row["Name"] || Object.values(row)[0];
    const mobileNo = row["MOBILE NO"] || row["Mobile No"] || row["Mobile"] || Object.values(row)[1];
    
    if (name && mobileNo) {
      validRows++;
      uniqueNumbers.add(String(mobileNo).trim());
    }
  });
});

console.log(`Total Rows Parsed: ${totalRows}`);
console.log(`Total rows with name and mobile: ${validRows}`);
console.log(`Total unique mobile numbers: ${uniqueNumbers.size}`);

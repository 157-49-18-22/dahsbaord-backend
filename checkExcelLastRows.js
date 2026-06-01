const xlsx = require('xlsx');
const filePath = '../my-react-app/public/PARENT MOBILE NO.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
console.log(`Length: ${xlData.length}`);
console.log(xlData.slice(xlData.length - 10)); // see the last 10 rows

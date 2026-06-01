const xlsx = require('xlsx');
const workbook = xlsx.readFile('../my-react-app/public/PARENT MOBILE NO.xlsx');
const sheet_name_list = workbook.SheetNames;
const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
console.log(xlData.slice(0, 5));

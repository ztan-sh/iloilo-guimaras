import { strToU8, zipSync } from "fflate";
import { monthTitle } from "./adminUtils";

const xmlEscape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
const columnName = index => {
    let value = index + 1;
    let name = "";
    while (value) {
        const remainder = (value - 1) % 26;
        name = String.fromCharCode(65 + remainder) + name;
        value = Math.floor((value - 1) / 26);
    }
    return name;
};

const cellXml = (value, reference) => typeof value === "number"
    ? `<c r="${reference}"><v>${Number.isFinite(value) ? value : 0}</v></c>`
    : `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;

export function downloadMonthlyTicketExcel(month, report) {
    const table = [
        ["GuimarasGo monthly ticket sales"],
        ["Month", monthTitle(month)],
        ["Passenger tickets sold", report.tickets],
        ["Paid bookings", report.bookings],
        ["Revenue (PHP)", Number(report.revenue.toFixed(2))],
        [],
        ["Date", "Day", "Tickets sold", "Cumulative tickets", "Paid bookings", "Revenue (PHP)"],
        ...report.rows.map(row => [row.date, row.label, row.tickets, row.cumulativeTickets, row.bookings, Number(row.revenue.toFixed(2))])
    ];
    const lastCell = `${columnName(Math.max(...table.map(row => row.length)) - 1)}${table.length}`;
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastCell}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols><col min="1" max="1" width="15" customWidth="1"/><col min="2" max="2" width="14" customWidth="1"/><col min="3" max="6" width="22" customWidth="1"/></cols><sheetData>${table.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, colIndex) => cellXml(value, `${columnName(colIndex)}${rowIndex + 1}`)).join("")}</row>`).join("")}</sheetData></worksheet>`;
    const files = {
        "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
        "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
        "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape(monthTitle(month))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
        "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
        "xl/worksheets/sheet1.xml": sheet
    };
    const content = zipSync(Object.fromEntries(Object.entries(files).map(([path, value]) => [path, strToU8(value)])), { level: 6 });
    const url = URL.createObjectURL(new Blob([content], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `GuimarasGo-${month}-tickets.xlsx`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

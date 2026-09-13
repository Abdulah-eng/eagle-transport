import Papa from "papaparse";
import * as xlsx from "xlsx";

/**
 * Traversa CSV/Excel Integration Layer
 * Traversa has no API, so all routing data must be imported/exported via CSV.
 */

// Format based on provided StudentUploads_Template.xlsx
export interface TraversaStudentExport {
  "Student ID": string;
  "First Name": string;
  "Last Name": string;
  "School Name": string;
  "Grade": string;
  "Gender": string;
  "Release Student": string; // Y/N
  "Return Student to School": string; // Y/N
  "Parent Name": string;
  "Parent Phone 1": string;
  "Parent Phone 2": string;
  "Address Line 1": string;
  "Address Line 2": string;
  "City": string;
  "State": string;
  "ZIP Code": string;
  "Email 1": string;
  "Email 2": string;
  "AM Rider": string; // Y/N
  "PM Rider": string; // Y/N
  "Medical Notes": string;
}

export interface TraversaRoutingImport {
  studentIdExt: string;
  routeId: string;
  stopId: string;
  stopSequence: number;
  amPickUpTime?: string;
  pmDropOffTime?: string;
  // Other mapped fields depending on Traversa export format
}

export const traversaService = {
  /**
   * Generates a CSV string matching the Traversa StudentUploads_Template
   */
  generateExportCsv(students: TraversaStudentExport[]): string {
    return Papa.unparse(students, {
      header: true,
      skipEmptyLines: true,
    });
  },

  /**
   * Parses an uploaded CSV or XLSX file containing completed routing assignments from Traversa
   */
  parseRoutingImport(fileBuffer: Buffer, fileName: string): TraversaRoutingImport[] {
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    
    if (isExcel) {
      const workbook = xlsx.read(fileBuffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      // Map JSON to TraversaRoutingImport (this requires actual knowledge of the Traversa export format)
      // Here we assume a direct mapping for demonstration
      return data.map((row: any) => ({
        studentIdExt: String(row["Student ID"] || ""),
        routeId: String(row["Route ID"] || ""),
        stopId: String(row["Stop ID"] || ""),
        stopSequence: Number(row["Sequence"] || 0),
        amPickUpTime: row["AM Time"],
        pmDropOffTime: row["PM Time"],
      }));
    } else {
      // Parse CSV
      const csvString = fileBuffer.toString("utf-8");
      const result = Papa.parse(csvString, { header: true, skipEmptyLines: true });
      
      return result.data.map((row: any) => ({
        studentIdExt: String(row["Student ID"] || ""),
        routeId: String(row["Route ID"] || ""),
        stopId: String(row["Stop ID"] || ""),
        stopSequence: Number(row["Sequence"] || 0),
        amPickUpTime: row["AM Time"],
        pmDropOffTime: row["PM Time"],
      }));
    }
  }
};

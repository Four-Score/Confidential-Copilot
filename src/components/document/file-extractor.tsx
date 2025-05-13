import { unzipSync } from "fflate";
import mammoth from "mammoth";
import XLSX from "xlsx";

export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const fileType = file.name.split('.').pop()?.toLowerCase() || '';
  
  try {
    switch (fileType) {
      case 'txt':
        return new TextDecoder().decode(buffer);
      
      case 'docx':
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        return result.value;
      
      case 'xlsx':
      case 'xls':
        const workbook = XLSX.read(buffer, { type: 'array' });
        const worksheets: string[] = [];
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const csvData = XLSX.utils.sheet_to_csv(worksheet);
          worksheets.push(`Sheet: ${sheetName}\n${csvData}`);
        });
        
        return worksheets.join('\n\n');
      
      case 'csv':
        const csvText = new TextDecoder().decode(buffer);

        return JSON.stringify(csvText, null, 2);
      
      case 'zip':
        try {
          const unzipped = unzipSync(new Uint8Array(buffer));
          const textContents: string[] = [];
          
          for (const [filename, content] of Object.entries(unzipped)) {
            if (filename.endsWith('.txt')) {
              textContents.push(`File: ${filename}\n${new TextDecoder().decode(content)}`);
            }
          }
          
          return textContents.join('\n\n') || "No text files found in this ZIP archive";
        } catch (err) {
          return "Could not extract contents from ZIP file.";
        }
      
      default:
        return `File type '${fileType}' is not supported for text extraction.`;
    }
  } catch (error) {
    console.error(`Error extracting text from ${file.name}:`, error);
    return `Error extracting text from ${file.name}: ${error instanceof Error ? error.message : String(error)}`;
  }
}
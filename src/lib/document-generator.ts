// src/lib/document-generator.ts
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Initialize the Groq LLM with higher token limit and temperature for more creative output
export const initGroqModel = (apiKey: string) => {
  return new ChatGroq({
    apiKey,
    model: "llama-3.3-70b-versatile", 
    temperature: 0.8, // Slightly higher temperature for more creative and varied output
    maxTokens: 8000, // Divide and Conquer outline
  });
};

const structurePromptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an AI document planner that creates comprehensive, professional outlines and structures for documents.
Your task is to generate a well-organized document structure that can be divided into two equal halves for separate content generation.
Create a detailed outline with clear sections, headers, and subheaders suitable for markdown formatting.
Focus on creating a structure that will support long-form, nuanced content with plenty of depth.`
  ],
  [
    "user",
    `Please create a detailed document structure and outline using the following specifications:

TEMPLATE: {templateName}

PURPOSE: {templatePurpose}

ADDITIONAL DETAILS: {details}

REFERENCED DOCUMENTS:
{referencedDocuments}

Your response should include:
1. An overview of the entire document structure with all major sections and subsections
2. A clear division point where the document can be split into two halves of similar complexity
3. Specific instructions for PART 1 (first half) content generation, emphasizing depth and detail
4. Specific instructions for PART 2 (second half) content generation, emphasizing depth and detail

Format your response with the following structure:
===DOCUMENT_STRUCTURE===
[Complete outline with all sections]
===DIVISION_POINT===
[Specify exactly where to divide the document]
===PART1_INSTRUCTIONS===
[Instructions for generating the first half with long, nuanced paragraphs]
===PART2_INSTRUCTIONS===
[Instructions for generating the second half with long, nuanced paragraphs]`
  ]
]);

const part1PromptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an AI document writer that creates exceptionally thorough and nuanced content for the first half of a document.
Your task is to generate in-depth, well-researched content following the provided structure and instructions.
Format your output in professional markdown that includes proper headings, formatting, and structure.
Make your content substantially longer and more detailed than typical documents:
- Each paragraph should be 4-6 sentences long with varied sentence structures
- Include specific details, examples, and insights that demonstrate deep understanding
- Tailor all content precisely to the document's title and description
- Use appropriate terminology and concepts for the domain
- Include relevant subheadings to break up long sections`
  ],
  [
    "user",
    `Please create the FIRST HALF of a document using the following specifications:

TEMPLATE: {templateName}

PURPOSE: {templatePurpose}

DOCUMENT STRUCTURE:
{documentStructure}

SPECIFIC INSTRUCTIONS FOR FIRST HALF:
{part1Instructions}

REFERENCED DOCUMENTS:
{referencedDocuments}

ADDITIONAL DETAILS: {details}

Generate comprehensive, professional content for the first half of the document only.
Format the result in clean, semantic markdown with appropriate headings using # syntax.
Include all sections and subsections specified in the document structure up to the division point.
Make your content substantially longer than usual - each section should have multiple detailed paragraphs.
Focus on depth, nuance, and specificity throughout the document.`
  ]
]);
const part2PromptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an AI document writer that creates exceptionally thorough and nuanced content for the second half of a document.
Your task is to generate in-depth, well-researched content following the provided structure and instructions.
Format your output in professional markdown that includes proper headings, formatting, and structure.
Make your content substantially longer and more detailed than typical documents:
- Each paragraph should be 4-6 sentences long with varied sentence structures
- Include specific details, examples, and insights that demonstrate deep understanding
- Tailor all content precisely to the document's title and description
- Use appropriate terminology and concepts for the domain
- Include relevant subheadings to break up long sections`
  ],
  [
    "user",
    `Please create the SECOND HALF of a document using the following specifications:

TEMPLATE: {templateName}

PURPOSE: {templatePurpose}

DOCUMENT STRUCTURE:
{documentStructure}

FIRST HALF SUMMARY:
{firstHalfSummary}

SPECIFIC INSTRUCTIONS FOR SECOND HALF:
{part2Instructions}

REFERENCED DOCUMENTS:
{referencedDocuments}

ADDITIONAL DETAILS: {details}

Generate comprehensive, professional content for the second half of the document only.
Format the result in clean, semantic markdown with appropriate headings using # syntax.
Include all sections and subsections specified in the document structure after the division point.
Make sure your content flows naturally from the first half summary provided.
Make your content substantially longer than usual - each section should have multiple detailed paragraphs.
Focus on depth, nuance, and specificity throughout the document.`
  ]
]);

// Function to parse the structure response
function parseStructureResponse(structureResponse: string) {
  const documentStructureMatch = structureResponse.match(/===DOCUMENT_STRUCTURE===\s*([\s\S]*?)(?:===|$)/);
  const divisionPointMatch = structureResponse.match(/===DIVISION_POINT===\s*([\s\S]*?)(?:===|$)/);
  const part1InstructionsMatch = structureResponse.match(/===PART1_INSTRUCTIONS===\s*([\s\S]*?)(?:===|$)/);
  const part2InstructionsMatch = structureResponse.match(/===PART2_INSTRUCTIONS===\s*([\s\S]*?)(?:===|$)/);

  return {
    documentStructure: documentStructureMatch?.[1]?.trim() || "",
    divisionPoint: divisionPointMatch?.[1]?.trim() || "",
    part1Instructions: part1InstructionsMatch?.[1]?.trim() || "",
    part2Instructions: part2InstructionsMatch?.[1]?.trim() || ""
  };
}

// Updated to provide a markdown summary instead of HTML
function generateFirstHalfSummary(firstHalfContent: string): string {
  // Extract main headings and first paragraph under each
  const headings = firstHalfContent.match(/#{1,3}\s+.*$/gm) || [];
  const firstFewHeadings = headings.slice(0, 5).join('\n\n');
  
  return `## First Half Summary

${firstFewHeadings}

*... (first half continues with additional detailed content) ...*`;
}

// Main function updated to generate markdown instead of HTML
export async function generateDocumentContent({
  templateName,
  templatePurpose,
  details,
  referencedDocuments,
  apiKey
}: {
  templateName: string;
  templatePurpose: string;
  details: string;
  referencedDocuments: string;
  apiKey: string;
}) {
  try {
    if (!apiKey) {
      throw new Error("Groq API key is required");
    }

    console.log("1. Creating document structure...");
    const model = initGroqModel(apiKey);
    const outputParser = new StringOutputParser();
    const structureChain = structurePromptTemplate.pipe(model).pipe(outputParser);
    const structureResult = await structureChain.invoke({
      templateName,
      templatePurpose,
      details,
      referencedDocuments,
    });

    // Parse the structure response
    const structureParts = parseStructureResponse(structureResult);
    console.log("Document structure created with division point at:", structureParts.divisionPoint);

    console.log("2. Generating first half of document...");
    const part1Chain = part1PromptTemplate.pipe(model).pipe(outputParser);
    const part1Result = await part1Chain.invoke({
      templateName,
      templatePurpose,
      documentStructure: structureParts.documentStructure,
      part1Instructions: structureParts.part1Instructions,
      referencedDocuments,
      details,
    });

    const firstHalfSummary = generateFirstHalfSummary(part1Result);

    console.log("3. Generating second half of document...");
    const part2Chain = part2PromptTemplate.pipe(model).pipe(outputParser);
    const part2Result = await part2Chain.invoke({
      templateName,
      templatePurpose,
      documentStructure: structureParts.documentStructure,
      firstHalfSummary,
      part2Instructions: structureParts.part2Instructions,
      referencedDocuments,
      details,
    });

    const combinedDocument = `# ${templateName}

${part1Result}

${part2Result}`;

    return combinedDocument;
  } catch (error) {
    console.error("Error generating document content:", error);
    throw error;
  }
}
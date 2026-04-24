# PDF Document Cleaner

A tool that removes student markings and handwriting from PDF documents while preserving original printed content using Google Cloud Vertex AI.

## Prerequisites

- Node.js >=14.0.0 (18+ recommended)
- pnpm

## Google Cloud Vertex AI Setup

Before using this tool, follow the "Before you begin" steps from the official documentation:

https://docs.cloud.google.com/nodejs/docs/reference/vertexai/latest

Key steps include:
- Create or select a Google Cloud project
- Enable billing for your project
- Enable the Vertex AI API
- Install and initialize the gcloud CLI
- Create authentication credentials: `gcloud auth application-default login`

## Local Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` and add your Google Cloud project ID and location:
   ```
   GOOGLE_CLOUD_PROJECT=your-project-id-here
   GOOGLE_CLOUD_LOCATION=us-central1
   ```

## Usage

Clean a PDF document:

```bash
pnpm start <input-pdf>
```

Specify custom output directory:

```bash
pnpm start <input-pdf> -o <output-directory>
```

## What It Does

1. Converts PDF pages to JPEG images
2. Uses Gemini AI to intelligently remove student markings while preserving all original printed content
3. Stitches the cleaned images back into a new PDF

## Output

- Original images saved in the output directory
- Edited images (suffixed with `_edited`) showing the cleaned version
- Final cleaned PDF saved as `output_cleaned.pdf` in the same directory as the input file

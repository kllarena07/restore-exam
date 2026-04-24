const { VertexAI } = require('@google-cloud/vertexai');
const fs = require('fs-extra');
const path = require('path');

class ImageEditor {
  constructor() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }

    this.vertexAI = new VertexAI({ project: projectId, location: location });
    this.model = 'gemini-2.5-flash-image';
    this.prompt = `You are a document cleaning specialist. Remove all student markings while preserving all original printed content using these SPECIFIC visual criteria:

PRESERVE - Keep ANY content that:
- Uses the SAME font style and size as question text, instructions, or other printed content on this document
- Is properly aligned with the document's printed layout structure
- Is clearly part of the original document design (boxes, lines, labels, answer choice options)
- Appears in the consistent visual style of the document's printed text

REMOVE - Eliminate ALL content that:
- Has IRREGULAR placement, rotation, or alignment (not matching the document's printed grid)
- Clearly FILLS IN blank spaces, circles, bubbles, or answer lines
- Appears to be ADDED CONTENT filling empty answer areas
- Is handwritten text, numbers, or markings with irregular thickness or placement
- Includes circles, checkmarks, Xs, underlines, or drawings around items
- Are multiple choice selections (filled bubbles, checked boxes)

DECISION RULES:
1. Check font consistency first: Same font as printed questions → PRESERVE
2. Check alignment: Irregular placement/rotation → REMOVE
3. Check fill boundaries: Content filling blank areas → REMOVE
4. Default to PRESERVING anything that looks like it was part of the original printed document

The goal: Return a clean document with all original printed content intact, but with all student additions removed. When in doubt, preserve content that matches the document's visual style.`;
  }

  async editImage(imagePath, maxRetries = 3) {
    try {
      if (!await fs.pathExists(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const generativeModel = this.vertexAI.getGenerativeModel({
        model: this.model
      });

      const request = {
        contents: [{
          role: 'user',
          parts: [
            { text: this.prompt },
            { inline_data: { data: base64Image, mimeType: 'image/jpeg' } }
          ]
        }]
      };

      let result, response;
      let retryCount = 0;
      
      while (retryCount <= maxRetries) {
        try {
          result = await generativeModel.generateContent(request);
          response = result.response;
          break;
        } catch (error) {
          if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
            if (retryCount < maxRetries) {
              const backoffTime = Math.pow(2, retryCount) * 10000;
              console.log(`⏳ Rate limited, retrying in ${backoffTime / 1000}s (attempt ${retryCount + 1}/${maxRetries + 1})...`);
              await new Promise(resolve => setTimeout(resolve, backoffTime));
              retryCount++;
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }

      if (!response.candidates || response.candidates.length === 0) {
        console.error(`❌ No candidates returned from Vertex AI for ${imagePath}`);
        console.error('Response:', JSON.stringify(response, null, 2));
        throw new Error('No candidates returned from Gemini API');
      }

      console.log(`✓ Vertex AI response received for ${imagePath} (${response.candidates.length} candidate(s))`);

      const editedContent = response.candidates[0].content;

      if (!editedContent.parts || editedContent.parts.length === 0) {
        console.error(`❌ No parts in candidate content for ${imagePath}`);
        console.error('Content:', JSON.stringify(editedContent, null, 2));
        throw new Error('No parts in candidate content from Gemini API');
      }

      console.log(`✓ Found ${editedContent.parts.length} part(s) in response`);

      const editedImageData = editedContent.parts.find(part => part.inlineData);

      if (!editedImageData) {
        console.error(`❌ No inline image data found for ${imagePath}`);
        console.error('Available parts:', editedContent.parts.map((part, i) => ({
          index: i,
          type: Object.keys(part).join(', ')
        })));

        const textPart = editedContent.parts.find(part => part.text);
        if (textPart) {
          console.error('Text response received:', textPart.text.substring(0, 200) + (textPart.text.length > 200 ? '...' : ''));
        }

        throw new Error('No edited image data returned from Gemini API');
      }

      console.log(`✓ Image data found (${editedImageData.inlineData.mimeType})`);

      const editedBuffer = Buffer.from(editedImageData.inlineData.data, 'base64');
      const outputPath = this.getEditedImagePath(imagePath);
      await fs.writeFile(outputPath, editedBuffer);

      console.log(`✓ Edited image saved to ${outputPath}`);

      return {
        success: true,
        path: outputPath
      };
    } catch (error) {
      if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
        console.error(`⚠️ Rate limited for ${imagePath} (max retries exceeded): ${error.message}`);
      } else if (error.message.includes('No candidates returned') || error.message.includes('No edited image data')) {
        console.error(`⚠️ Parsing failed for ${imagePath}: ${error.message}`);
      } else {
        console.error(`❌ Unexpected error for ${imagePath}: ${error.message}`);
      }

      return {
        success: false,
        path: imagePath,
        error: error.message
      };
    }
  }

  async editAllImages(imagePaths) {
    const results = [];
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      
      console.log(`\n🖼️  Processing image ${i + 1}/${imagePaths.length}: ${imagePath}`);
      
      const result = await this.editImage(imagePath);
      results.push({
        ...result,
        originalPath: imagePath
      });

      if (i < imagePaths.length - 1) {
        const delay = 10000;
        console.log(`⏳ Waiting ${delay / 1000}s before next image to avoid rate limiting...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return results;
  }

  getEditedImagePath(originalPath) {
    const parsedPath = path.parse(originalPath);
    return path.join(
      parsedPath.dir,
      `${parsedPath.name}_edited${parsedPath.ext}`
    );
  }
}

module.exports = ImageEditor;

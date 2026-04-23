const { convert: imageToPdf, sizes } = require('image-to-pdf');
const path = require('path');
const fs = require('fs-extra');

class PDFStitcher {
  constructor() {
  }

  async stitchImagesToPDF(imagePaths, outputPath) {
    try {
      if (!imagePaths || imagePaths.length === 0) {
        throw new Error('No images provided for stitching');
      }

      await this.validateImages(imagePaths);
      const sortedPaths = this.sortImages(imagePaths);

      await fs.ensureDir(path.dirname(outputPath));

      return new Promise((resolve, reject) => {
        const pdfStream = imageToPdf(sortedPaths, sizes.A4);
        const writeStream = fs.createWriteStream(outputPath);

        pdfStream.on('error', (err) => {
          writeStream.end();
          reject(err);
        });

        writeStream.on('error', (err) => {
          pdfStream.destroy();
          reject(err);
        });

        writeStream.on('finish', () => {
          resolve({
            success: true,
            path: outputPath,
            totalPages: sortedPaths.length
          });
        });

        pdfStream.pipe(writeStream);
      });
    } catch (error) {
      return {
        success: false,
        path: outputPath,
        error: error.message
      };
    }
  }

  async validateImages(imagePaths) {
    const missingImages = [];
    
    for (const imagePath of imagePaths) {
      if (!await fs.pathExists(imagePath)) {
        missingImages.push(imagePath);
      }
    }

    if (missingImages.length > 0) {
      throw new Error(`Missing images: ${missingImages.join(', ')}`);
    }
  }

  sortImages(imagePaths) {
    return imagePaths.sort((a, b) => {
      const matchA = a.match(/untitled\.(\d+)_edited\.jpeg$/);
      const matchB = b.match(/untitled\.(\d+)_edited\.jpeg$/);

      if (!matchA || !matchB) {
        return a.localeCompare(b);
      }

      const numA = parseInt(matchA[1]);
      const numB = parseInt(matchB[1]);

      return numA - numB;
    });
  }
}

module.exports = PDFStitcher;

const { fromPath } = require('pdf2pic');
const path = require('path');
const fs = require('fs-extra');

class PDFConverter {
  constructor(pdfPath, options) {
    this.pdfPath = pdfPath;
    this.options = options;
    this.converter = null;
  }

  initialize() {
    const pdf2picOptions = {
      density: this.options.dpi,
      quality: this.options.quality,
      format: 'jpeg',
      savePath: this.options.outputDir,
      preserveAspectRatio: this.options.preserveAspect
    };

    this.converter = fromPath(this.pdfPath, pdf2picOptions);
    return this.converter;
  }

  async convertAllPages() {
    try {
      await this.converter.bulk(-1, {
        responseType: 'image',
        saveFilename: 'page'
      });

      const files = await fs.readdir(this.options.outputDir);
      const jpegFiles = files
        .filter(f => f.match(/untitled\.\d+\.jpeg$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/untitled\.(\d+)\.jpeg$/)[1]);
          const numB = parseInt(b.match(/untitled\.(\d+)\.jpeg$/)[1]);
          return numA - numB;
        });

      return jpegFiles.map((file, index) => ({
        success: true,
        page: index + 1,
        path: path.join(this.options.outputDir, file)
      }));
    } catch (error) {
      throw new Error(`Batch conversion failed: ${error.message}`);
    }
  }
}

module.exports = PDFConverter;

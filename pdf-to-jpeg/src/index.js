require('dotenv').config();
const { createCLI } = require('./cli');
const {
  validatePDF,
  ensureOutputDir
} = require('./validator');
const PDFConverter = require('./converter');
const Logger = require('./logger');
const ImageEditor = require('./imageEditor');

async function main(args) {
  const logger = new Logger();
  const startTime = Date.now();

  try {
    const program = createCLI();
    program.parse(args.slice(2), { from: 'user' });

    const options = program.opts();
    const [inputPDF] = program.args;

    logger.info(`Starting PDF to JPEG conversion...`);

    const pdfPath = await validatePDF(inputPDF);
    const outputDir = await ensureOutputDir(options.output);

    logger.info(`Input PDF: ${pdfPath}`);
    logger.info(`Output directory: ${outputDir}`);

    const converterOptions = {
      outputDir,
      quality: 70,
      dpi: 150,
      preserveAspect: true
    };

    const converter = new PDFConverter(pdfPath, converterOptions);
    converter.initialize();

    logger.info(`Converting all pages...`);
    const results = await converter.convertAllPages();
    const totalPages = results.length;

    const stats = {
      total: totalPages,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      failedPages: results.filter(r => !r.success).map(r => r.page)
    };

    if (stats.failed > 0) {
      logger.warning(`${stats.failed} page(s) failed to convert`);
      results.filter(r => !r.success).forEach(r => {
        logger.error(`Page ${r.page}: ${r.error}`);
      });
    }

    logger.info(`Editing converted images with Gemini...`);
    const imageEditor = new ImageEditor();
    const imagePaths = results.filter(r => r.success).map(r => r.path);

    let editResults = [];
    if (imagePaths.length > 0) {
      editResults = await imageEditor.editAllImages(imagePaths);
    }

    const editStats = {
      total: imagePaths.length,
      successful: editResults.filter(r => r.success).length,
      failed: editResults.filter(r => !r.success).length,
      failedImages: editResults.filter(r => !r.success).map(r => r.originalPath)
    };

    if (editStats.failed > 0) {
      logger.warning(`${editStats.failed} image(s) failed to edit`);
      editResults.filter(r => !r.success).forEach(r => {
        logger.error(`Image edit failed: ${r.path} - ${r.error}`);
      });
    }

    logger.stopProgress();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.printSummary(stats, outputDir, duration, editStats);

    if (stats.failed === stats.total && stats.total > 0) {
      logger.error('All pages failed to convert. Check dependencies.');
      process.exit(1);
    }

    process.exit(0);

  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
}

module.exports = main;

if (require.main === module) {
  main(process.argv).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

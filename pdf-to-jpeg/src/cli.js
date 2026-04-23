const { Command } = require('commander');

function createCLI() {
  const program = new Command();

  program
    .name('pdf-to-jpeg')
    .description('Convert PDF pages to JPEG images')
    .version('1.0.0')
    .argument('<input-pdf>', 'Path to the PDF file to convert')
    .option('-o, --output <dir>', 'Output directory (default: ./output)', './output');

  return program;
}

module.exports = { createCLI };

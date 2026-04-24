const fs = require('fs-extra');
const path = require('path');

async function validatePDF(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);

    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`PDF file not found: ${resolvedPath}`);
    }

    const stats = await fs.stat(resolvedPath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${resolvedPath}`);
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    if (ext !== '.pdf') {
      throw new Error(`File must be a PDF: ${resolvedPath}`);
    }

    return resolvedPath;
  } catch (error) {
    throw error;
  }
}

async function ensureOutputDir(outputDir) {
  const resolvedPath = path.resolve(outputDir);
  await fs.ensureDir(resolvedPath);
  return resolvedPath;
}

module.exports = {
  validatePDF,
  ensureOutputDir
};

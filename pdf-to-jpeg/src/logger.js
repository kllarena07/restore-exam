const chalk = require('chalk');
const cliProgress = require('cli-progress');

class Logger {
  constructor() {
    this.progressBar = null;
  }

  info(message) {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message) {
    console.log(chalk.green('✓'), message);
  }

  error(message) {
    console.error(chalk.red('✗'), message);
  }

  warning(message) {
    console.log(chalk.yellow('⚠'), message);
  }

  createProgressBar(total) {
    this.progressBar = new cliProgress.SingleBar({
      format: chalk.cyan('{bar}') + ' {percentage}% | {value}/{total} pages',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true
    });

    this.progressBar.start(total, 0);
  }

  updateProgress(value) {
    if (this.progressBar) {
      this.progressBar.update(value);
    }
  }

  stopProgress() {
    if (this.progressBar) {
      this.progressBar.stop();
      this.progressBar = null;
    }
  }

  printSummary(stats, outputDir, duration, editStats = null) {
    console.log('\n' + chalk.bold('═══════════════════════════════════════'));
    console.log(chalk.bold('  Conversion Summary'));
    console.log(chalk.bold('═══════════════════════════════════════'));

    console.log(`${chalk.cyan('📁 Output Directory:')} ${outputDir}`);
    console.log(`${chalk.cyan('📄 Total Pages:')} ${stats.total}`);
    console.log(`${chalk.green('✓ Conversion Successful:')} ${stats.successful}`);

    if (stats.failed > 0) {
      console.log(`${chalk.red('✗ Conversion Failed:')} ${stats.failed}`);
      console.log(chalk.red('Failed pages:'), stats.failedPages.join(', '));
    }

    if (editStats) {
      console.log('\n' + chalk.bold('  Image Editing Summary'));
      console.log(chalk.bold('───────────────────────────────────────'));
      console.log(`${chalk.cyan('🎨 Total Images Edited:')} ${editStats.total}`);
      console.log(`${chalk.green('✓ Editing Successful:')} ${editStats.successful}`);

      if (editStats.failed > 0) {
        console.log(`${chalk.red('✗ Editing Failed:')} ${editStats.failed}`);
      }
    }

    console.log(`\n${chalk.cyan('⏱️  Duration:')} ${duration}s`);
    console.log(chalk.bold('═══════════════════════════════════════\n'));
  }
}

module.exports = Logger;

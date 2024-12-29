const winston = require('winston');
const path = require('path');

class PhaseTracker {
  constructor() {
    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(__dirname, '../../logs/phase-progress.log')
        })
      ]
    });
  }

  logPhaseProgress(phaseId, feature, status, details = {}) {
    this.logger.info('Phase Progress Update', {
      phaseId,
      feature,
      status,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  logError(phaseId, feature, error) {
    this.logger.error('Phase Error', {
      phaseId,
      feature,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  async getPhaseProgress(phaseId) {
    // Implementation for retrieving phase progress from logs
    // This could be extended to use a database in the future
    return {
      phaseId,
      status: 'tracking',
      timestamp: new Date().toISOString()
    };
  }
}

const phaseTracker = new PhaseTracker();

module.exports = {
  logPhaseProgress: (phaseId, feature, status, details) => 
    phaseTracker.logPhaseProgress(phaseId, feature, status, details),
  logPhaseError: (phaseId, feature, error) => 
    phaseTracker.logError(phaseId, feature, error),
  getPhaseProgress: (phaseId) => 
    phaseTracker.getPhaseProgress(phaseId)
}; 
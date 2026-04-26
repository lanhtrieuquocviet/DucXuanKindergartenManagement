/**
 * Academic Year Service Hub
 * File này gom tất cả các sub-services lại để dễ quản lý và đảm bảo tính tương thích ngược.
 */

const queryService = require('./academicYear/queryService');
const wizardService = require('./academicYear/wizardService');
const lifecycleService = require('./academicYear/lifecycleService');

module.exports = {
  // Query
  getCurrentAcademicYear: queryService.getCurrentAcademicYear,
  listAcademicYears: queryService.listAcademicYears,
  getAcademicYearHistory: queryService.getAcademicYearHistory,
  getClassesByAcademicYear: queryService.getClassesByAcademicYear,
  getStudentsByAcademicYear: queryService.getStudentsByAcademicYear,

  // Wizard & Setup
  setupNewAcademicYearWizard: wizardService.setupNewAcademicYearWizard,
  getWizardCloneData: wizardService.getWizardCloneData,
  getSmartSuggestions: wizardService.getSmartSuggestions,
  expressSetupNewAcademicYear: wizardService.expressSetupNewAcademicYear,

  // Lifecycle
  createAcademicYear: lifecycleService.createAcademicYear,
  patchCurrentTimetableSeason: lifecycleService.patchCurrentTimetableSeason,
  finishAcademicYear: lifecycleService.finishAcademicYear,
  updateAcademicYear: lifecycleService.updateAcademicYear,
  publishAcademicYear: lifecycleService.publishAcademicYear,
};

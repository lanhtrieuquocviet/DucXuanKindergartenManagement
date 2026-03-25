const express = require("express");
const router = express.Router();
const healthController = require("../controller/healthController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

/**
 * Get all health check records
 * SchoolNurse role only
 */
router.get(
  "/records",
  authenticate,
  authorizeRoles("SchoolNurse", "SchoolAdmin"),
  healthController.getHealthCheckRecords
);

/**
 * Get health statistics
 */
router.get(
  "/statistics",
  authenticate,
  authorizeRoles("SchoolNurse", "SchoolAdmin"),
  healthController.getHealthStatistics
);

/**
 * Get a specific health check record
 */
router.get(
  "/record/:id",
  authenticate,
  authorizeRoles("SchoolNurse", "SchoolAdmin"),
  healthController.getHealthCheckById
);

/**
 * Get all health records for a specific student
 */
router.get(
  "/student/:studentId",
  authenticate,
  authorizeRoles("SchoolNurse", "SchoolAdmin"),
  healthController.getStudentHealthHistory
);

/**
 * Create a new health check record
 */
router.post(
  "/record",
  authenticate,
  authorizeRoles("SchoolNurse", "SchoolAdmin"),
  healthController.createHealthCheck
);

/**
 * Update a health check record
 */
router.put(
  "/record/:id",
  authenticate,
  authorizeRoles("SchoolNurse", "SchoolAdmin"),
  healthController.updateHealthCheck
);

/**
 * Delete a health check record
 */
router.delete(
  "/record/:id",
  authenticate,
  authorizeRoles("SchoolNurse", "SchoolAdmin"),
  healthController.deleteHealthCheck
);

/**
 * Export health records for reporting
 */
router.get(
  "/export/records",
  authenticate,
  authorizeRoles("SchoolNurse", "SchoolAdmin"),
  healthController.exportHealthRecords
);

module.exports = router;

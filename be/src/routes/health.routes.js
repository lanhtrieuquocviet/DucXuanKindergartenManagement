const express = require("express");
const router = express.Router();
const healthController = require("../controller/healthController");
const { authenticate, authorizeRoles, authorizePermissions } = require("../middleware/auth");

/**
 * Get all health check records
 * SchoolNurse role only
 */
router.get(
  "/records",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.getHealthCheckRecords
);

/**
 * Get health statistics
 */
router.get(
  "/statistics",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.getHealthStatistics
);

/**
 * Get a specific health check record
 */
router.get(
  "/record/:id",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.getHealthCheckById
);

/**
 * Get all health records for a specific student
 */
router.get(
  "/student/:studentId",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.getStudentHealthHistory
);

/**
 * Create a new health check record
 */
router.post(
  "/record",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.createHealthCheck
);

/**
 * Update a health check record
 */
router.put(
  "/record/:id",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.updateHealthCheck
);

/**
 * Delete a health check record
 */
router.delete(
  "/record/:id",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.deleteHealthCheck
);

/**
 * Export health records for reporting
 */
router.get(
  "/export/records",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.exportHealthRecords
);

module.exports = router;

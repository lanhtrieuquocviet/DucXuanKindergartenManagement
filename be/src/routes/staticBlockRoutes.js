const express = require('express');
const staticBlockController = require('../controller/staticBlockController');
const { authenticate, authorizePermissions } = require('../middleware/auth');

const router = express.Router();

/**
 * Public routes
 */
// Get all active static blocks (for dropdown/selection - no auth required)
router.get('/active', staticBlockController.getActiveStaticBlocks);

/**
 * Protected routes (require authentication and MANAGE_STATIC_BLOCK permission)
 */
router.use(authenticate);

// Get all static blocks
router.get(
  '/',
  authorizePermissions('MANAGE_STATIC_BLOCK'),
  staticBlockController.getAllStaticBlocks
);

// Get static block by ID
router.get(
  '/:id',
  authorizePermissions('MANAGE_STATIC_BLOCK'),
  staticBlockController.getStaticBlockById
);

// Create new static block
router.post(
  '/',
  authorizePermissions('MANAGE_STATIC_BLOCK'),
  staticBlockController.createStaticBlock
);

// Update static block
router.put(
  '/:id',
  authorizePermissions('MANAGE_STATIC_BLOCK'),
  staticBlockController.updateStaticBlock
);

// Delete static block
router.delete(
  '/:id',
  authorizePermissions('MANAGE_STATIC_BLOCK'),
  staticBlockController.deleteStaticBlock
);

module.exports = router;

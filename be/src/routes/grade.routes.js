const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { listGrades, createGrade, updateGrade, deleteGrade } = require('../controller/gradeController');

const router = express.Router();

router.get('/', authenticate, authorizeRoles('SchoolAdmin'), listGrades);
router.post('/', authenticate, authorizeRoles('SchoolAdmin'), createGrade);
router.put('/:id', authenticate, authorizeRoles('SchoolAdmin'), updateGrade);
router.delete('/:id', authenticate, authorizeRoles('SchoolAdmin'), deleteGrade);

module.exports = router;

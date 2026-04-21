const HealthCheck = require("../models/HealthCheck");
const Student = require("../models/Student");
const User = require("../models/User");
const AcademicYear = require("../models/AcademicYear");

/**
 * Get all health check records
 */
exports.getHealthCheckRecords = async (req, res) => {
  try {
    const { studentId, status, academicYearId } = req.query;
    let query = {};

    if (studentId) {
      query.studentId = studentId;
    }
    if (status) {
      query.generalStatus = status;
    }
    if (academicYearId) {
      query.academicYearId = academicYearId;
    }

    const records = await HealthCheck.find(query)
      .populate("studentId", "name email")
      .populate("recordedBy", "fullName")
      .populate("academicYearId", "yearName")
      .sort({ checkDate: -1 })
      .limit(100);

    res.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    console.error("getHealthCheckRecords error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get health check record by ID
 */
exports.getHealthCheckById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await HealthCheck.findById(id)
      .populate("studentId")
      .populate("recordedBy", "fullName")
      .populate("academicYearId", "yearName");

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    console.error("getHealthCheckById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all health records for a specific student
 */
exports.getStudentHealthHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYearId } = req.query;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const query = { studentId };
    if (academicYearId) {
      query.academicYearId = academicYearId;
    }

    const records = await HealthCheck.find(query)
      .populate("recordedBy", "fullName")
      .populate("academicYearId", "yearName")
      .sort({ checkDate: -1 });

    // Calculate health trends
    const latestRecord = records[0] || null;
    const heightTrend = records.length > 1 ? records[0].height - records[1].height : null;
    const weightTrend = records.length > 1 ? records[0].weight - records[1].weight : null;

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
      latestRecord,
      records,
      trends: {
        heightTrend,
        weightTrend,
      },
    });
  } catch (error) {
    console.error("getStudentHealthHistory error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new health check record
 */
exports.createHealthCheck = async (req, res) => {
  try {
    const {
      studentId,
      academicYearId,
      height,
      weight,
      temperature,
      bloodPressure,
      heartRate,
      vision,
      teeth,
      skin,
      allergies,
      medications,
      chronicDiseases,
      notes,
      generalStatus,
      recommendations,
      followUpDate,
    } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required" });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Resolve academicYearId: dùng truyền vào hoặc tự detect năm học đang active
    let resolvedAcademicYearId = academicYearId || null;
    if (!resolvedAcademicYearId) {
      const activeYear = await AcademicYear.findOne({ status: "active" }).select("_id").lean();
      if (activeYear) resolvedAcademicYearId = activeYear._id;
    }

    const healthCheck = new HealthCheck({
      studentId,
      academicYearId: resolvedAcademicYearId,
      height,
      weight,
      temperature,
      bloodPressure,
      heartRate,
      vision,
      teeth,
      skin,
      allergies,
      medications,
      chronicDiseases,
      notes,
      generalStatus,
      recommendations,
      followUpDate,
      recordedBy: req.user.id,
    });

    await healthCheck.save();

    res.status(201).json({
      success: true,
      message: "Health check record created",
      data: healthCheck,
    });
  } catch (error) {
    console.error("createHealthCheck error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update health check record
 */
exports.updateHealthCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow changing studentId or recordedBy
    delete updates.studentId;
    delete updates.recordedBy;

    const record = await HealthCheck.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("studentId")
      .populate("recordedBy", "fullName");

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.json({
      success: true,
      message: "Health check record updated",
      data: record,
    });
  } catch (error) {
    console.error("updateHealthCheck error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete health check record
 */
exports.deleteHealthCheck = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await HealthCheck.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.json({
      success: true,
      message: "Health check record deleted",
    });
  } catch (error) {
    console.error("deleteHealthCheck error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get health statistics/summary
 */
exports.getHealthStatistics = async (req, res) => {
  try {
    const { startDate, endDate, academicYearId } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.checkDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (academicYearId) {
      query.academicYearId = academicYearId;
    }

    const totalRecords = await HealthCheck.countDocuments(query);
    const healthyCount = await HealthCheck.countDocuments({
      ...query,
      generalStatus: "healthy",
    });
    const monitorCount = await HealthCheck.countDocuments({
      ...query,
      generalStatus: "monitor",
    });
    const concerningCount = await HealthCheck.countDocuments({
      ...query,
      generalStatus: "concerning",
    });

    // Get students with follow-up needed
    const followUpNeeded = await HealthCheck.find({
      ...query,
      followUpDate: { $exists: true, $ne: null },
    })
      .populate("studentId", "name email")
      .limit(10);

    res.json({
      success: true,
      data: {
        totalRecords,
        statistics: {
          healthy: healthyCount,
          monitor: monitorCount,
          concerning: concerningCount,
        },
        followUpNeeded,
      },
    });
  } catch (error) {
    console.error("getHealthStatistics error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Export health records (for reports)
 */
exports.exportHealthRecords = async (req, res) => {
  try {
    const { startDate, endDate, status, academicYearId } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.checkDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (status) {
      query.generalStatus = status;
    }
    if (academicYearId) {
      query.academicYearId = academicYearId;
    }

    const records = await HealthCheck.find(query)
      .populate("studentId", "name email")
      .populate("recordedBy", "fullName")
      .populate("academicYearId", "yearName")
      .sort({ checkDate: -1 });

    // Format for CSV export
    const headers = [
      "Student Name",
      "Academic Year",
      "Check Date",
      "Height (cm)",
      "Weight (kg)",
      "Temperature (°C)",
      "Blood Pressure",
      "Heart Rate (bpm)",
      "General Status",
      "Notes",
      "Recorded By",
    ];

    const data = records.map((r) => [
      r.studentId?.name || "N/A",
      r.academicYearId?.yearName || "N/A",
      new Date(r.checkDate).toLocaleDateString("vi-VN"),
      r.height || "-",
      r.weight || "-",
      r.temperature || "-",
      r.bloodPressure ? `${r.bloodPressure.systolic}/${r.bloodPressure.diastolic}` : "-",
      r.heartRate || "-",
      r.generalStatus,
      r.notes || "-",
      r.recordedBy?.fullName || "N/A",
    ]);

    res.json({
      success: true,
      data: {
        headers,
        records: data,
        count: records.length,
      },
    });
  } catch (error) {
    console.error("exportHealthRecords error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * faceAttendanceController.js
 *
 * Xử lý luồng điểm danh bằng nhận diện khuôn mặt:
 *  - Đăng ký embedding (registerFaceEmbedding)
 *  - So sánh embedding để nhận diện (matchFaceEmbedding)
 *  - Sync dữ liệu điểm danh offline (syncOfflineAttendance)
 */

const Students = require('../models/Student');
const Attendances = require('../models/Attendances');
const PickupRequest = require('../models/PickupRequest');
const { createNotification } = require('../controller/notification.controller');

// ─── Hàm toán học ─────────────────────────────────────────────────────────────

/**
 * Tính cosine similarity giữa 2 vector.
 * Kết quả từ -1 đến 1. Càng gần 1 → càng giống nhau.
 * Dùng cosine thay vì Euclidean vì không bị ảnh hưởng bởi độ sáng ảnh.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return -1;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Ngưỡng nhận diện: similarity >= THRESHOLD thì coi là MATCH
// Tăng lên 0.92 vì model face-api hay nhầm người châu Á (false positive cao)
const MATCH_THRESHOLD = 0.92;

// Khoảng cách tối thiểu giữa kết quả tốt nhất và thứ 2
// Nếu 2 khuôn mặt giống nhau (margin < MIN_MARGIN), từ chối để tránh nhầm
// Tăng lên 0.04 để đồng bộ với frontend offline và tránh nhầm anh chị em có khuôn mặt tương tự
const MIN_MARGIN = 0.04;

/**
 * Lấy tất cả embeddings của một học sinh (hỗ trợ nhiều góc mặt)
 * Ưu tiên faceEmbeddings (mảng nhiều góc), fallback về faceEmbedding (góc duy nhất)
 */
function getStudentEmbeddings(student) {
  if (Array.isArray(student.faceEmbeddings) && student.faceEmbeddings.length > 0) {
    return student.faceEmbeddings.filter((e) => Array.isArray(e) && e.length === 128);
  }
  if (Array.isArray(student.faceEmbedding) && student.faceEmbedding.length === 128) {
    return [student.faceEmbedding];
  }
  return [];
}

/**
 * Similarity cao nhất giữa embedding đầu vào và tất cả góc mặt đã đăng ký của học sinh
 */
function maxSimilarityToStudent(inputEmb, student) {
  const embeddings = getStudentEmbeddings(student);
  let max = -1;
  for (const emb of embeddings) {
    const sim = cosineSimilarity(inputEmb, emb);
    if (sim > max) max = sim;
  }
  return max;
}

// ─── Controller functions ──────────────────────────────────────────────────────

/**
 * Đăng ký / cập nhật embedding khuôn mặt cho học sinh
 * POST /api/face/register
 * Body: { studentId, embedding: [128 số float] }
 *
 * Giải thích cho người mới:
 *  - Frontend dùng face-api.js để detect khuôn mặt từ ảnh
 *  - face-api.js trả ra mảng 128 số float gọi là "embedding" (dấu vân tay khuôn mặt)
 *  - Ta lưu mảng đó vào DB để dùng cho so sánh sau
 */
const registerFaceEmbedding = async (req, res) => {
  try {
    const { studentId, embedding, faceImageUrl, append = false, force = false } = req.body;

    // Validate input
    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu studentId',
      });
    }

    if (!Array.isArray(embedding) || embedding.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'embedding phải là mảng số float (128 chiều)',
      });
    }

    // face-api.js luôn trả 128 chiều
    if (embedding.length !== 128) {
      return res.status(400).json({
        status: 'error',
        message: `embedding phải có đúng 128 phần tử, nhận được ${embedding.length}`,
      });
    }

    // Kiểm tra học sinh tồn tại
    const student = await Students.findById(studentId);
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy học sinh',
      });
    }

    // Conflict check đã tắt — model face-api.js không đủ chính xác để phân biệt
    // khuôn mặt trẻ nhỏ châu Á, gây false positive cao. Bật lại khi nâng cấp model.

    const MAX_EMBEDDINGS = 5;
    const existingEmbeddings = Array.isArray(student.faceEmbeddings) ? student.faceEmbeddings : [];
    const existingImageUrls = Array.isArray(student.faceImageUrls) ? student.faceImageUrls : [];

    if (append && existingEmbeddings.length > 0) {
      // Thêm góc mặt mới (tối đa MAX_EMBEDDINGS)
      if (existingEmbeddings.length >= MAX_EMBEDDINGS) {
        return res.status(400).json({
          status: 'error',
          message: `Đã đăng ký tối đa ${MAX_EMBEDDINGS} góc mặt. Vui lòng xóa và đăng ký lại.`,
        });
      }
      student.faceEmbeddings = [...existingEmbeddings, embedding];
      student.faceImageUrls = [...existingImageUrls, faceImageUrl || ''];
    } else {
      // Đăng ký mới (ghi đè tất cả góc cũ)
      student.faceEmbeddings = [embedding];
      student.faceImageUrls = [faceImageUrl || ''];
    }

    // Giữ faceEmbedding (góc mới nhất) để backward compat
    student.faceEmbedding = embedding;
    // faceImageUrl = ảnh góc đầu tiên (để hiển thị ở những nơi chỉ dùng 1 ảnh)
    student.faceImageUrl = student.faceImageUrls[0] || faceImageUrl || '';
    student.faceRegisteredAt = new Date();
    student.markModified('faceEmbeddings');
    student.markModified('faceImageUrls');
    await student.save();

    const angleCount = student.faceEmbeddings.length;
    return res.status(200).json({
      status: 'success',
      message: `Đã lưu góc mặt ${angleCount}/${MAX_EMBEDDINGS} cho ${student.fullName}`,
      data: {
        studentId: student._id,
        fullName: student.fullName,
        angleCount,
        maxAngles: MAX_EMBEDDINGS,
        faceImageUrls: student.faceImageUrls,
        faceRegisteredAt: student.faceRegisteredAt,
      },
    });
  } catch (error) {
    console.error('registerFaceEmbedding error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi đăng ký khuôn mặt',
      error: error.message,
    });
  }
};

/**
 * So sánh embedding từ camera với tất cả học sinh trong 1 lớp
 * POST /api/face/match
 * Body: { embedding: [128 số float], classId, date? }
 *
 * Giải thích luồng:
 *  1. Frontend detect khuôn mặt → tạo embedding
 *  2. Gửi embedding + classId lên đây
 *  3. Backend lấy tất cả học sinh trong lớp có faceEmbedding
 *  4. So sánh cosine similarity với từng học sinh
 *  5. Học sinh nào có similarity cao nhất và >= THRESHOLD → MATCH
 *  6. Nếu match → tự động tạo attendance record
 */
const matchFaceEmbedding = async (req, res) => {
  try {
    const { embedding, classId, date, autoCheckIn = true, checkinImageUrl = '' } = req.body;

    // Validate embedding
    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return res.status(400).json({
        status: 'error',
        message: 'embedding phải là mảng 128 số float',
      });
    }

    if (!classId) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu classId',
      });
    }

    // Lấy tất cả học sinh trong lớp có đăng ký khuôn mặt
    const students = await Students.find({
      classId,
      status: 'active',
      faceEmbedding: { $exists: true, $not: { $size: 0 } },
    }).select('_id fullName faceEmbedding faceEmbeddings classId avatar');

    if (students.length === 0) {
      return res.status(200).json({
        status: 'no_data',
        message: 'Lớp này chưa có học sinh nào đăng ký khuôn mặt',
        matched: false,
      });
    }

    // So sánh với từng học sinh (xét tất cả góc mặt đã đăng ký)
    let bestMatch = null;
    let bestSimilarity = -1;
    let secondBestSimilarity = -1;

    for (const student of students) {
      const similarity = maxSimilarityToStudent(embedding, student);
      if (similarity > bestSimilarity) {
        secondBestSimilarity = bestSimilarity;
        bestSimilarity = similarity;
        bestMatch = student;
      } else if (similarity > secondBestSimilarity) {
        secondBestSimilarity = similarity;
      }
    }

    // Không đủ ngưỡng → không nhận diện được
    if (bestSimilarity < MATCH_THRESHOLD) {
      return res.status(200).json({
        status: 'no_match',
        message: 'Không nhận diện được khuôn mặt',
        matched: false,
        bestSimilarity: bestSimilarity.toFixed(4),
        threshold: MATCH_THRESHOLD,
      });
    }

    // Kiểm tra margin: kết quả tốt nhất phải rõ ràng hơn kết quả thứ 2
    // Tránh nhầm khi 2 học sinh có khuôn mặt giống nhau (đặc biệt anh chị em ruột)
    const margin = bestSimilarity - secondBestSimilarity;
    if (secondBestSimilarity > 0.78 && margin < MIN_MARGIN) {
      return res.status(200).json({
        status: 'ambiguous',
        message: 'Khuôn mặt quá giống nhau giữa các học sinh, không thể xác định chính xác',
        matched: false,
        bestSimilarity: bestSimilarity.toFixed(4),
        margin: margin.toFixed(4),
      });
    }

    // Đảm bảo học sinh được match thuộc đúng lớp được yêu cầu
    if (bestMatch.classId?.toString() !== classId?.toString()) {
      return res.status(200).json({
        status: 'no_match',
        message: 'Không nhận diện được khuôn mặt trong lớp này',
        matched: false,
        bestSimilarity: bestSimilarity.toFixed(4),
      });
    }

    // Đã nhận diện → tự động check-in nếu autoCheckIn = true
    let attendance = null;
    if (autoCheckIn) {
      const now = new Date();
      const attendanceDate = date ? new Date(date) : new Date(now);
      attendanceDate.setHours(0, 0, 0, 0);

      const checkInTime = now;
      const checkInTimeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Upsert: nếu đã điểm danh hôm nay thì không ghi đè
      const existingAttendance = await Attendances.findOne({
        studentId: bestMatch._id,
        date: attendanceDate,
      });

      if (existingAttendance) {
        // Đã điểm danh rồi → trả về thông báo
        return res.status(200).json({
          status: 'already_checked_in',
          message: `${bestMatch.fullName} đã được điểm danh hôm nay lúc ${existingAttendance.timeString?.checkIn || ''}`,
          matched: true,
          student: {
            _id: bestMatch._id,
            fullName: bestMatch.fullName,
            avatar: bestMatch.avatar,
            classId: bestMatch.classId,
          },
          similarity: bestSimilarity.toFixed(4),
          attendance: existingAttendance,
        });
      }

      // Tạo bản ghi điểm danh mới
      attendance = await Attendances.create({
        studentId: bestMatch._id,
        classId: bestMatch.classId,
        date: attendanceDate,
        status: 'present',
        time: { checkIn: checkInTime, checkOut: null },
        timeString: { checkIn: checkInTimeString, checkOut: '' },
        checkinImageName: checkinImageUrl,
        checkedInByAI: true,
      });

      // Gửi thông báo cho phụ huynh
      const studentFull = await Students.findById(bestMatch._id)
        .select('fullName parentId classId')
        .populate('classId', 'className');
      const parentId = studentFull?.parentId;
      if (parentId) {
        const className = studentFull?.classId?.className || '';
        await createNotification({
          title: 'Điểm danh đến trường',
          body: `${studentFull.fullName} đã đến trường lúc ${checkInTimeString}${className ? ` - Lớp ${className}` : ''}.`,
          type: 'attendance_checkin',
          targetRole: 'Parent',
          targetUserId: parentId,
          extra: { studentId: bestMatch._id, attendanceId: attendance._id },
        });
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Nhận diện thành công: ${bestMatch.fullName}`,
      matched: true,
      student: {
        _id: bestMatch._id,
        fullName: bestMatch.fullName,
        avatar: bestMatch.avatar,
        classId: bestMatch.classId,
      },
      similarity: bestSimilarity.toFixed(4),
      attendance: attendance,
    });
  } catch (error) {
    console.error('matchFaceEmbedding error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi so sánh khuôn mặt',
      error: error.message,
    });
  }
};

/**
 * Lấy danh sách embeddings của tất cả học sinh trong 1 lớp
 * (dùng cho chế độ OFFLINE: frontend tải về, lưu local, so sánh tại thiết bị)
 * GET /api/face/embeddings?classId=xxx
 *
 * Giải thích:
 *  - Khi offline, frontend không thể gọi /match
 *  - Endpoint này cho phép frontend tải trước toàn bộ embeddings của lớp
 *  - Frontend lưu vào IndexedDB, so sánh locally khi không có mạng
 */
const getClassEmbeddings = async (req, res) => {
  try {
    const { classId } = req.query;

    if (!classId) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu classId',
      });
    }

    const students = await Students.find({
      classId,
      status: 'active',
      faceEmbedding: { $exists: true, $not: { $size: 0 } },
    }).select('_id fullName avatar faceEmbedding faceEmbeddings faceRegisteredAt classId');

    return res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách embeddings thành công',
      data: students.map((s) => {
        const embeddings = Array.isArray(s.faceEmbeddings) && s.faceEmbeddings.length > 0
          ? s.faceEmbeddings
          : [s.faceEmbedding];
        return {
          studentId: s._id,
          fullName: s.fullName,
          avatar: s.avatar,
          classId: s.classId,
          embedding: s.faceEmbedding,   // backward compat
          embeddings,                    // multi-angle
          registeredAt: s.faceRegisteredAt,
        };
      }),
      total: students.length,
    });
  } catch (error) {
    console.error('getClassEmbeddings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy embeddings',
      error: error.message,
    });
  }
};

/**
 * Sync dữ liệu điểm danh offline lên server
 * POST /api/face/sync
 * Body: { records: [{ studentId, classId, date, checkInTime, checkInTimeString }] }
 *
 * Giải thích:
 *  - Khi device offline, frontend lưu kết quả điểm danh vào IndexedDB
 *  - Khi có mạng trở lại, frontend gọi API này để đẩy dữ liệu lên
 *  - Backend dùng upsert (không tạo trùng) → an toàn khi gọi nhiều lần
 */
const syncOfflineAttendance = async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'records phải là mảng và không được rỗng',
      });
    }

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        const { studentId, classId, date, checkInTime, checkInTimeString } = record;

        if (!studentId || !date) {
          errors.push({ record, reason: 'Thiếu studentId hoặc date' });
          continue;
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Upsert: không ghi đè nếu đã có bản ghi (ưu tiên dữ liệu online)
        const existing = await Attendances.findOne({
          studentId,
          date: attendanceDate,
        });

        if (existing) {
          // Đã tồn tại → bỏ qua, không ghi đè
          results.push({
            studentId,
            date,
            action: 'skipped',
            reason: 'Đã có bản ghi online',
          });
          continue;
        }

        // Tạo bản ghi mới từ dữ liệu offline
        const now = new Date(checkInTime || date);
        const timeStr = checkInTimeString || `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const newAttendance = await Attendances.create({
          studentId,
          classId,
          date: attendanceDate,
          status: 'present',
          time: { checkIn: now, checkOut: null },
          timeString: { checkIn: timeStr, checkOut: '' },
        });

        // Gửi thông báo cho phụ huynh
        const studentFull = await Students.findById(studentId)
          .select('fullName parentId classId')
          .populate('classId', 'className');
        const parentId = studentFull?.parentId;
        if (parentId) {
          const className = studentFull?.classId?.className || '';
          await createNotification({
            title: 'Điểm danh đến trường',
            body: `${studentFull.fullName} đã đến trường lúc ${timeStr}${className ? ` - Lớp ${className}` : ''}.`,
            type: 'attendance_checkin',
            targetRole: 'Parent',
            targetUserId: parentId,
            extra: { studentId, attendanceId: newAttendance._id },
          });
        }

        results.push({ studentId, date, action: 'created' });
      } catch (err) {
        errors.push({ record, reason: err.message });
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Sync hoàn tất: ${results.filter((r) => r.action === 'created').length} tạo mới, ${results.filter((r) => r.action === 'skipped').length} bỏ qua`,
      results,
      errors,
    });
  } catch (error) {
    console.error('syncOfflineAttendance error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi sync dữ liệu',
      error: error.message,
    });
  }
};

/**
 * Đăng ký / cập nhật embedding khuôn mặt cho người đưa/đón
 * POST /api/face/pickup/register
 * Body: { pickupRequestId, embedding: [128 số float] }
 * Chỉ hoạt động với pickup request đã được duyệt (status = 'approved')
 */
const registerPickupFaceEmbedding = async (req, res) => {
  try {
    const { pickupRequestId, embedding } = req.body;

    if (!pickupRequestId) {
      return res.status(400).json({ status: 'error', message: 'Thiếu pickupRequestId' });
    }
    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return res.status(400).json({ status: 'error', message: 'embedding phải là mảng 128 số float' });
    }

    const pickup = await PickupRequest.findById(pickupRequestId);
    if (!pickup) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy người đưa/đón' });
    }
    if (pickup.status !== 'approved') {
      return res.status(400).json({ status: 'error', message: 'Chỉ đăng ký khuôn mặt cho người đã được duyệt' });
    }

    pickup.faceEmbedding = embedding;
    pickup.faceRegisteredAt = new Date();
    await pickup.save();

    return res.status(200).json({
      status: 'success',
      message: `Đã đăng ký khuôn mặt cho ${pickup.fullName}`,
      data: {
        pickupRequestId: pickup._id,
        fullName: pickup.fullName,
        faceRegisteredAt: pickup.faceRegisteredAt,
      },
    });
  } catch (error) {
    console.error('registerPickupFaceEmbedding error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi server', error: error.message });
  }
};

/**
 * So sánh embedding với danh sách người đưa/đón đã duyệt của một học sinh
 * POST /api/face/pickup/match
 * Body: { embedding: [128 số float], studentId }
 */
const matchPickupFace = async (req, res) => {
  try {
    const { embedding, studentId } = req.body;

    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return res.status(400).json({ status: 'error', message: 'embedding phải là mảng 128 số float' });
    }
    if (!studentId) {
      return res.status(400).json({ status: 'error', message: 'Thiếu studentId' });
    }

    // Lấy tất cả người đưa/đón đã duyệt của học sinh và đã đăng ký khuôn mặt
    const pickupPersons = await PickupRequest.find({
      student: studentId,
      status: 'approved',
      faceEmbedding: { $exists: true, $not: { $size: 0 } },
    }).select('_id fullName relation phone imageUrl faceEmbedding faceRegisteredAt');

    if (pickupPersons.length === 0) {
      return res.status(200).json({
        status: 'no_data',
        message: 'Học sinh này chưa có người đưa/đón nào đăng ký khuôn mặt',
        matched: false,
      });
    }

    let bestMatch = null;
    let bestSimilarity = -1;

    for (const person of pickupPersons) {
      const similarity = cosineSimilarity(embedding, person.faceEmbedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = person;
      }
    }

    if (bestSimilarity < MATCH_THRESHOLD) {
      return res.status(200).json({
        status: 'no_match',
        message: 'Không nhận diện được — người này không có trong danh sách đưa đón',
        matched: false,
        bestSimilarity: bestSimilarity.toFixed(4),
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Nhận diện thành công: ${bestMatch.fullName} (${bestMatch.relation})`,
      matched: true,
      person: {
        _id: bestMatch._id,
        fullName: bestMatch.fullName,
        relation: bestMatch.relation,
        phone: bestMatch.phone,
        imageUrl: bestMatch.imageUrl,
      },
      similarity: bestSimilarity.toFixed(4),
    });
  } catch (error) {
    console.error('matchPickupFace error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi server', error: error.message });
  }
};

/**
 * Quét mặt người đến đón → tự động ghi điểm danh về cho học sinh
 * POST /api/face/pickup/checkout
 * Body: { embedding, classId, date?, checkoutImageUrl? }
 *
 * Luồng:
 *  1. Lấy tất cả học sinh trong lớp
 *  2. Lấy tất cả pickup persons đã duyệt + có embedding của cả lớp
 *  3. Match embedding với danh sách đó
 *  4. Nếu match → tìm học sinh tương ứng → ghi checkout
 */
const matchPickupFaceForCheckout = async (req, res) => {
  try {
    const { embedding, classId, date, checkoutImageUrl = '' } = req.body;

    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return res.status(400).json({ status: 'error', message: 'embedding phải là mảng 128 số float' });
    }
    if (!classId) {
      return res.status(400).json({ status: 'error', message: 'Thiếu classId' });
    }

    const now = new Date();

    // TODO: bỏ giới hạn giờ để test, bật lại sau
    // if (now.getHours() < 17) {
    //   return res.status(400).json({
    //     status: 'too_early',
    //     message: 'Chưa đến giờ điểm danh về. Điểm danh về chỉ được thực hiện từ 17:00.',
    //   });
    // }

    const attendanceDate = date ? new Date(date) : new Date(now);
    attendanceDate.setHours(0, 0, 0, 0);

    // Lấy tất cả học sinh active trong lớp
    const students = await Students.find({ classId, status: 'active' }).select('_id fullName avatar');
    if (students.length === 0) {
      return res.status(200).json({ status: 'no_data', message: 'Lớp này không có học sinh', matched: false });
    }

    const studentIds = students.map((s) => s._id);

    // Lấy tất cả pickup persons đã duyệt + có embedding của cả lớp
    const allPickupPersons = await PickupRequest.find({
      student: { $in: studentIds },
      status: 'approved',
      faceEmbedding: { $exists: true, $not: { $size: 0 } },
    }).select('_id fullName relation phone imageUrl faceEmbedding student');

    if (allPickupPersons.length === 0) {
      return res.status(200).json({
        status: 'no_data',
        message: 'Lớp này chưa có người đưa/đón nào đăng ký khuôn mặt',
        matched: false,
      });
    }

    // Match embedding với toàn bộ pickup persons của lớp
    let bestMatch = null;
    let bestSimilarity = -1;

    for (const person of allPickupPersons) {
      const similarity = cosineSimilarity(embedding, person.faceEmbedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = person;
      }
    }

    if (bestSimilarity < MATCH_THRESHOLD) {
      return res.status(200).json({
        status: 'no_match',
        message: 'Người này không có trong danh sách đưa đón của lớp',
        matched: false,
        bestSimilarity: bestSimilarity.toFixed(4),
      });
    }

    // Tìm học sinh tương ứng
    const student = students.find((s) => s._id.toString() === bestMatch.student.toString());
    if (!student) {
      return res.status(200).json({ status: 'no_match', message: 'Không tìm thấy học sinh liên quan', matched: false });
    }

    // Kiểm tra học sinh đã check-in chưa
    const existingAttendance = await Attendances.findOne({ studentId: student._id, date: attendanceDate });
    if (!existingAttendance) {
      return res.status(200).json({
        status: 'not_checked_in',
        message: `${student.fullName} chưa điểm danh đến hôm nay`,
        matched: true,
        student: { _id: student._id, fullName: student.fullName, avatar: student.avatar },
        person: { fullName: bestMatch.fullName, relation: bestMatch.relation },
      });
    }

    // Ghi checkout
    const checkOutTime = now;
    const checkOutTimeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const attendance = await Attendances.findOneAndUpdate(
      { studentId: student._id, date: attendanceDate },
      {
        $set: {
          'time.checkOut': checkOutTime,
          'timeString.checkOut': checkOutTimeString,
          checkoutImageName: checkoutImageUrl,
          receiverType: 'other',
          receiverOtherInfo: `${bestMatch.fullName} (${bestMatch.relation})`,
          receiverOtherImageName: bestMatch.imageUrl || '',
          checkedOutByAI: true,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      status: 'success',
      message: `Điểm danh về: ${student.fullName} — đón bởi ${bestMatch.fullName} (${bestMatch.relation})`,
      matched: true,
      student: { _id: student._id, fullName: student.fullName, avatar: student.avatar },
      person: {
        _id: bestMatch._id,
        fullName: bestMatch.fullName,
        relation: bestMatch.relation,
        phone: bestMatch.phone,
        imageUrl: bestMatch.imageUrl,
      },
      similarity: bestSimilarity.toFixed(4),
      attendance,
    });
  } catch (error) {
    console.error('matchPickupFaceForCheckout error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi server', error: error.message });
  }
};

/**
 * Quét khuôn mặt học sinh → tự động ghi điểm danh về
 * POST /api/face/student/checkout
 * Body: { embedding, classId, date?, checkoutImageUrl? }
 *
 * Luồng:
 *  1. Match embedding với học sinh trong lớp (dùng student.faceEmbedding)
 *  2. Nếu match → tìm bản ghi điểm danh hôm nay
 *  3. Nếu đã check-in → ghi checkout
 */
const matchStudentFaceForCheckout = async (req, res) => {
  try {
    const { embedding, classId, date, checkoutImageUrl = '' } = req.body;

    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return res.status(400).json({ status: 'error', message: 'embedding phải là mảng 128 số float' });
    }
    if (!classId) {
      return res.status(400).json({ status: 'error', message: 'Thiếu classId' });
    }

    const now = new Date();
    const attendanceDate = date ? new Date(date) : new Date(now);
    attendanceDate.setHours(0, 0, 0, 0);

    // Lấy học sinh trong lớp có đăng ký khuôn mặt
    const students = await Students.find({
      classId,
      status: 'active',
      faceEmbedding: { $exists: true, $not: { $size: 0 } },
    }).select('_id fullName avatar faceEmbedding faceEmbeddings classId');

    if (students.length === 0) {
      return res.status(200).json({
        status: 'no_data',
        message: 'Lớp này chưa có học sinh nào đăng ký khuôn mặt',
        matched: false,
      });
    }

    // So sánh embedding → tìm học sinh khớp nhất (xét tất cả góc mặt)
    let bestMatch = null;
    let bestSimilarity = -1;
    let secondBestSimilarity = -1;

    for (const student of students) {
      const similarity = maxSimilarityToStudent(embedding, student);
      if (similarity > bestSimilarity) {
        secondBestSimilarity = bestSimilarity;
        bestSimilarity = similarity;
        bestMatch = student;
      } else if (similarity > secondBestSimilarity) {
        secondBestSimilarity = similarity;
      }
    }

    if (bestSimilarity < MATCH_THRESHOLD) {
      return res.status(200).json({
        status: 'no_match',
        message: 'Không nhận diện được khuôn mặt học sinh',
        matched: false,
        bestSimilarity: bestSimilarity.toFixed(4),
      });
    }

    const margin = bestSimilarity - secondBestSimilarity;
    if (secondBestSimilarity > 0.78 && margin < MIN_MARGIN) {
      return res.status(200).json({
        status: 'ambiguous',
        message: 'Khuôn mặt quá giống nhau giữa các học sinh, không thể xác định chính xác',
        matched: false,
        bestSimilarity: bestSimilarity.toFixed(4),
        margin: margin.toFixed(4),
      });
    }

    // Đảm bảo học sinh được match thuộc đúng lớp được yêu cầu
    if (bestMatch.classId?.toString() !== classId?.toString()) {
      return res.status(200).json({
        status: 'no_match',
        message: 'Không nhận diện được khuôn mặt trong lớp này',
        matched: false,
        bestSimilarity: bestSimilarity.toFixed(4),
      });
    }

    // Kiểm tra học sinh đã check-in chưa
    const existingAttendance = await Attendances.findOne({ studentId: bestMatch._id, date: attendanceDate });
    if (!existingAttendance) {
      return res.status(200).json({
        status: 'not_checked_in',
        message: `${bestMatch.fullName} chưa điểm danh đến hôm nay`,
        matched: true,
        student: { _id: bestMatch._id, fullName: bestMatch.fullName, avatar: bestMatch.avatar },
      });
    }

    // Đã checkout rồi
    if (existingAttendance.timeString?.checkOut) {
      return res.status(200).json({
        status: 'already_checked_out',
        message: `${bestMatch.fullName} đã điểm danh về lúc ${existingAttendance.timeString.checkOut}`,
        matched: true,
        student: { _id: bestMatch._id, fullName: bestMatch.fullName, avatar: bestMatch.avatar },
        attendance: existingAttendance,
      });
    }

    // Ghi checkout
    const checkOutTimeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const attendance = await Attendances.findOneAndUpdate(
      { studentId: bestMatch._id, date: attendanceDate },
      {
        $set: {
          'time.checkOut': now,
          'timeString.checkOut': checkOutTimeString,
          checkoutImageName: checkoutImageUrl,
          checkedOutByAI: true,
        },
      },
      { new: true }
    );

    // Gửi thông báo cho phụ huynh khi điểm danh về (AI)
    const studentFull = await Students.findById(bestMatch._id)
      .select('fullName parentId classId')
      .populate('classId', 'className');
    const parentId = studentFull?.parentId;
    if (parentId) {
      const className = studentFull?.classId?.className || '';
      await createNotification({
        title: 'Điểm danh về nhà',
        body: `${bestMatch.fullName} đã về nhà lúc ${checkOutTimeString}${className ? ` - Lớp ${className}` : ''}.`,
        type: 'attendance_checkout',
        targetRole: 'Parent',
        targetUserId: parentId,
        extra: { studentId: bestMatch._id, attendanceId: attendance._id },
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Điểm danh về: ${bestMatch.fullName}`,
      matched: true,
      student: { _id: bestMatch._id, fullName: bestMatch.fullName, avatar: bestMatch.avatar },
      similarity: bestSimilarity.toFixed(4),
      attendance,
    });
  } catch (error) {
    console.error('matchStudentFaceForCheckout error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi server', error: error.message });
  }
};

/**
 * Xóa toàn bộ dữ liệu khuôn mặt của một học sinh
 * DELETE /api/face/register/:studentId
 */
const deleteFaceEmbedding = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Students.findById(studentId);
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh' });
    }

    student.faceEmbedding = [];
    student.faceEmbeddings = [];
    student.faceImageUrls = [];
    student.faceImageUrl = '';
    student.faceRegisteredAt = null;
    student.markModified('faceEmbeddings');
    student.markModified('faceImageUrls');
    await student.save();

    return res.status(200).json({
      status: 'success',
      message: `Đã xóa khuôn mặt của ${student.fullName}`,
      data: { studentId: student._id, fullName: student.fullName },
    });
  } catch (error) {
    console.error('deleteFaceEmbedding error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi server khi xóa khuôn mặt', error: error.message });
  }
};

/**
 * Xóa 1 góc mặt theo index
 * DELETE /api/face/register/:studentId/angle/:index
 */
const deleteFaceAngle = async (req, res) => {
  try {
    const { studentId, index } = req.params;
    const idx = parseInt(index, 10);

    const student = await Students.findById(studentId);
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh' });
    }

    const embeddings = Array.isArray(student.faceEmbeddings) ? [...student.faceEmbeddings] : [];
    const imageUrls = Array.isArray(student.faceImageUrls) ? [...student.faceImageUrls] : [];

    if (idx < 0 || idx >= embeddings.length) {
      return res.status(400).json({ status: 'error', message: 'Index góc mặt không hợp lệ' });
    }

    embeddings.splice(idx, 1);
    imageUrls.splice(idx, 1);

    student.faceEmbeddings = embeddings;
    student.faceImageUrls = imageUrls;
    student.faceEmbedding = embeddings[0] || [];
    student.faceImageUrl = imageUrls[0] || '';

    if (embeddings.length === 0) {
      student.faceRegisteredAt = null;
    }

    student.markModified('faceEmbeddings');
    student.markModified('faceImageUrls');
    await student.save();

    return res.status(200).json({
      status: 'success',
      message: `Đã xóa góc ${idx + 1}`,
      data: { studentId: student._id, angleCount: embeddings.length, faceImageUrls: imageUrls },
    });
  } catch (error) {
    console.error('deleteFaceAngle error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi server khi xóa góc mặt' });
  }
};

/**
 * Cập nhật thông tin người đưa/đón cho bản ghi điểm danh
 * PATCH /api/face/attendance/:id/deliverer
 * Body: { delivererType, delivererOtherInfo, receiverType, receiverOtherInfo, note, checkinBelongings, checkoutBelongings, checkoutBelongingsNote }
 */
const updateAttendanceDeliverer = async (req, res) => {
  try {
    const { delivererType, delivererOtherInfo, receiverType, receiverOtherInfo, note, checkinBelongings, checkoutBelongings, checkoutBelongingsNote } = req.body;
    const attendance = await Attendances.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy bản ghi điểm danh.' });
    }
    if (delivererType !== undefined) attendance.delivererType = delivererType;
    if (delivererOtherInfo !== undefined) attendance.delivererOtherInfo = delivererOtherInfo;
    if (receiverType !== undefined) attendance.receiverType = receiverType;
    if (receiverOtherInfo !== undefined) attendance.receiverOtherInfo = receiverOtherInfo;
    if (note !== undefined) attendance.note = note;
    if (checkinBelongings !== undefined) attendance.checkinBelongings = checkinBelongings;
    if (checkoutBelongings !== undefined) attendance.checkoutBelongings = checkoutBelongings;
    if (checkoutBelongingsNote !== undefined) attendance.checkoutBelongingsNote = checkoutBelongingsNote;
    await attendance.save();
    return res.json({ status: 'success', data: { attendance } });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  registerFaceEmbedding,
  matchFaceEmbedding,
  getClassEmbeddings,
  syncOfflineAttendance,
  registerPickupFaceEmbedding,
  matchPickupFace,
  matchPickupFaceForCheckout,
  matchStudentFaceForCheckout,
  deleteFaceEmbedding,
  deleteFaceAngle,
  updateAttendanceDeliverer,
};

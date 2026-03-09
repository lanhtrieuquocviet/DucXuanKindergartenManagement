const cron = require('node-cron');
const MealPhoto = require('../models/MealPhoto');

/**
 * Tự động duyệt mẫu thực phẩm sau 24 giờ chưa được kiểm tra.
 * Chạy mỗi giờ một lần.
 * Mọi sampleEntry có status = 'cho_kiem_tra' và uploadedAt < (now - 24h)
 * sẽ được chuyển sang 'da_ok'.
 */
function startAutoApproveSampleEntries() {
  cron.schedule('0 * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await MealPhoto.updateMany(
        {
          'sampleEntries': {
            $elemMatch: {
              status: 'cho_kiem_tra',
              uploadedAt: { $lt: cutoff },
            },
          },
        },
        {
          $set: {
            'sampleEntries.$[entry].status': 'khong_co_van_de',
          },
        },
        {
          arrayFilters: [
            {
              'entry.status': 'cho_kiem_tra',
              'entry.uploadedAt': { $lt: cutoff },
            },
          ],
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `✅ [AutoApprove] Tự động duyệt ${result.modifiedCount} tài liệu có mẫu thực phẩm quá 24h chưa kiểm tra`
        );
      }
    } catch (err) {
      console.error('❌ [AutoApprove] Lỗi khi tự động duyệt mẫu thực phẩm:', err.message);
    }
  });

  console.log('🕐 [AutoApprove] Đã đăng ký cron job tự động duyệt mẫu thực phẩm (mỗi giờ)');
}

module.exports = { startAutoApproveSampleEntries };

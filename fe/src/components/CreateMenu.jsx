import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMenu } from "../service/menu.api";
import { toast } from "react-toastify";

function CreateMenu() {
  const navigate = useNavigate();

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!month || !year) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (year < currentYear) {
      toast.error(`Năm phải lớn hơn hoặc bằng ${currentYear}`);
      return;
    }

    try {
      setLoading(true);

      await createMenu({
        month: Number(month),
        year: Number(year),
      });

      toast.success("Tạo thực đơn thành công");

      navigate("/kitchen/menus");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Tạo thực đơn thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow rounded-xl p-6">
      <h1 className="text-xl font-bold mb-4">Tạo thực đơn tháng</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Month */}
        <div>
          <label className="block text-sm font-medium mb-1">Tháng</label>
          <input
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Nhập tháng (1 - 12)"
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium mb-1">Năm</label>
          <input
            type="number"
            value={year}
            min={currentYear}
            onChange={(e) => setYear(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder={`Nhập năm (>= ${currentYear})`}
          />
        </div>

        {/* Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/kitchen/menus")}
            className="border px-4 py-2 rounded-lg"
          >
            Huỷ
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            {loading ? "Đang tạo..." : "Tạo thực đơn"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateMenu;

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const downloadExcel = async (endpoint, params, filename) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}${endpoint}?${queryString}`;
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Lỗi tải file" }));
    throw new Error(error.message || "Lỗi tải file");
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = [2024, 2025, 2026, 2027];

function MonthYearPicker({ month, year, onMonthChange, onYearChange }) {
  return (
    <div className="flex gap-2 mt-3">
      <select
        value={month}
        onChange={(e) => onMonthChange(parseInt(e.target.value))}
        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            Tháng {m}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

function ExportButton({ loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="mt-3 inline-flex items-center gap-1.5 border border-gray-300 bg-white text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Đang xuất...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Xuất
        </>
      )}
    </button>
  );
}

function MenuReport() {
  const navigate = useNavigate();
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const [weekly, setWeekly] = useState({ month: curMonth, year: curYear, weekType: "odd" });
  const [monthly, setMonthly] = useState({ month: curMonth, year: curYear });
  const [sample, setSample] = useState({ month: curMonth, year: curYear });
  const [portion, setPortion] = useState({ month: curMonth, year: curYear });

  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));
  const setErr = (key, val) => setErrors((p) => ({ ...p, [key]: val }));

  const handleExportWeekly = async () => {
    setLoad("weekly", true);
    setErr("weekly", "");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/menus?month=${weekly.month}&year=${weekly.year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const menus = data.data || [];
      const menu = menus.find(
        (m) => m.month === weekly.month && m.year === weekly.year
      );
      if (!menu) {
        setErr("weekly", "Không tìm thấy thực đơn tháng này");
        return;
      }
      await downloadExcel(
        "/reports/weekly",
        { menuId: menu._id, weekType: weekly.weekType },
        `bao-cao-tuan-${weekly.weekType === "odd" ? "le" : "chan"}-thang-${weekly.month}-${weekly.year}.xlsx`
      );
    } catch (err) {
      setErr("weekly", err.message);
    } finally {
      setLoad("weekly", false);
    }
  };

  const handleExportMonthly = async () => {
    setLoad("monthly", true);
    setErr("monthly", "");
    try {
      await downloadExcel(
        "/reports/monthly",
        { month: monthly.month, year: monthly.year },
        `bao-cao-thang-${monthly.month}-${monthly.year}.xlsx`
      );
    } catch (err) {
      setErr("monthly", err.message);
    } finally {
      setLoad("monthly", false);
    }
  };

  const handleExportSample = async () => {
    setLoad("sample", true);
    setErr("sample", "");
    try {
      await downloadExcel(
        "/reports/food-sample",
        { month: sample.month, year: sample.year },
        `bao-cao-mau-thuc-pham-thang-${sample.month}-${sample.year}.xlsx`
      );
    } catch (err) {
      setErr("sample", err.message);
    } finally {
      setLoad("sample", false);
    }
  };

  const handleExportPortion = async () => {
    setLoad("portion", true);
    setErr("portion", "");
    try {
      await downloadExcel(
        "/reports/meal-portion",
        { month: portion.month, year: portion.year },
        `bao-cao-suat-an-thang-${portion.month}-${portion.year}.xlsx`
      );
    } catch (err) {
      setErr("portion", err.message);
    } finally {
      setLoad("portion", false);
    }
  };

  const cards = [
    {
      key: "weekly",
      icon: (
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ),
      title: "Báo cáo tuần",
      desc: "Thực đơn, dinh dưỡng, suất ăn theo tuần",
      controls: (
        <>
          <MonthYearPicker
            month={weekly.month}
            year={weekly.year}
            onMonthChange={(v) => setWeekly((p) => ({ ...p, month: v }))}
            onYearChange={(v) => setWeekly((p) => ({ ...p, year: v }))}
          />
          <select
            value={weekly.weekType}
            onChange={(e) => setWeekly((p) => ({ ...p, weekType: e.target.value }))}
            className="mt-2 w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="odd">Tuần lẻ</option>
            <option value="even">Tuần chẵn</option>
          </select>
        </>
      ),
      onExport: handleExportWeekly,
    },
    {
      key: "monthly",
      icon: (
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      ),
      title: "Báo cáo tháng",
      desc: "Tổng hợp tháng, so sánh dinh dưỡng",
      controls: (
        <MonthYearPicker
          month={monthly.month}
          year={monthly.year}
          onMonthChange={(v) => setMonthly((p) => ({ ...p, month: v }))}
          onYearChange={(v) => setMonthly((p) => ({ ...p, year: v }))}
        />
      ),
      onExport: handleExportMonthly,
    },
    {
      key: "sample",
      icon: (
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      ),
      title: "Báo cáo mẫu thực phẩm",
      desc: "Lịch sử kiểm tra mẫu thực phẩm",
      controls: (
        <MonthYearPicker
          month={sample.month}
          year={sample.year}
          onMonthChange={(v) => setSample((p) => ({ ...p, month: v }))}
          onYearChange={(v) => setSample((p) => ({ ...p, year: v }))}
        />
      ),
      onExport: handleExportSample,
    },
    {
      key: "portion",
      icon: (
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      ),
      title: "Báo cáo suất ăn",
      desc: "Thống kê suất ăn theo lớp, theo ngày",
      controls: (
        <MonthYearPicker
          month={portion.month}
          year={portion.year}
          onMonthChange={(v) => setPortion((p) => ({ ...p, month: v }))}
          onYearChange={(v) => setPortion((p) => ({ ...p, year: v }))}
        />
      ),
      onExport: handleExportPortion,
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Xuất báo cáo Menu</h1>
        <p className="text-gray-500 mt-1 text-sm">Tạo báo cáo tổng hợp về thực đơn và dinh dưỡng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              {card.icon}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{card.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{card.desc}</p>
                {card.controls}
                {errors[card.key] && (
                  <p className="text-red-500 text-xs mt-2">{errors[card.key]}</p>
                )}
                <ExportButton
                  loading={!!loading[card.key]}
                  onClick={card.onExport}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuReport;

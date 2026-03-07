function KitchenDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard Nhà Bếp</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-gray-500 text-sm">Thực đơn</h2>
          <p className="text-2xl font-bold">12</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-gray-500 text-sm">Chờ duyệt</h2>
          <p className="text-2xl font-bold text-yellow-500">3</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-gray-500 text-sm">Đã duyệt</h2>
          <p className="text-2xl font-bold text-green-500">7</p>
        </div>
      </div>
    </div>
  );
}

export default KitchenDashboard;

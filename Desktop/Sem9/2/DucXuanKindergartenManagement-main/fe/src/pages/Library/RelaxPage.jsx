export default function RelaxPage() {
    return (
        <div className="min-h-screen bg-green-50 p-6">
            {/* Tiêu đề */}
            <div className="text-sm text-gray-500 mb-4">
                Trang chủ <span className="mx-1">›</span> Thư viện{" "}
                <span className="mx-1">›</span>{" "}
                <span className="text-gray-700">Thư giãn</span>
            </div>

            {/* Danh mục */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Truyện tranh */}
                <div className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer">
                    <div className="h-36 bg-pink-200 rounded-t-xl flex items-center justify-center text-5xl">
                        📖
                    </div>
                    <div className="p-4 text-center">
                        <h2 className="font-semibold text-lg text-pink-600">
                            Truyện tranh
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Truyện cổ tích, truyện ngắn cho bé
                        </p>
                    </div>
                </div>

                {/* Nhạc thiếu nhi */}
                <div className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer">
                    <div className="h-36 bg-yellow-200 rounded-t-xl flex items-center justify-center text-5xl">
                        🎵
                    </div>
                    <div className="p-4 text-center">
                        <h2 className="font-semibold text-lg text-yellow-600">
                            Nhạc thiếu nhi
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Bài hát vui nhộn, dễ thương
                        </p>
                    </div>
                </div>

                {/* Video hoạt hình */}
                <div className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer">
                    <div className="h-36 bg-blue-200 rounded-t-xl flex items-center justify-center text-5xl">
                        🎬
                    </div>
                    <div className="p-4 text-center">
                        <h2 className="font-semibold text-lg text-blue-600">
                            Hoạt hình
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Video hoạt hình giáo dục
                        </p>
                    </div>
                </div>

                {/* Trò chơi nhẹ */}
                <div className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer">
                    <div className="h-36 bg-purple-200 rounded-t-xl flex items-center justify-center text-5xl">
                        🎲
                    </div>
                    <div className="p-4 text-center">
                        <h2 className="font-semibold text-lg text-purple-600">
                            Trò chơi vui
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Trò chơi nhẹ giúp bé thư giãn
                        </p>
                    </div>
                </div>
            </div>

            {/* Gợi ý */}
            <div className="mt-10 bg-white rounded-xl p-6 shadow">
                <h3 className="font-semibold text-green-700 text-lg mb-2">
                    💡 Gợi ý cho giáo viên
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Cho bé nghe nhạc nhẹ sau giờ học</li>
                    <li>Xem truyện tranh trước giờ ngủ trưa</li>
                    <li>Hạn chế thời gian xem video quá lâu</li>
                    <li>Kết hợp vận động nhẹ nhàng</li>
                </ul>
            </div>
        </div>
    );
}

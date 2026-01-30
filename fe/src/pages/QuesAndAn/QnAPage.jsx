import { useState } from "react";
import AskQuestionModal from "./AskQuestionModal";


export default function QnAPage() {
    const [open, setOpen] = useState(false);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Search bar */}
            <div className="max-w-5xl mx-auto p-6 space-y-4">
                {/* Hàng trên */}
                <div className="flex items-center gap-4">
                    <span className="font-medium">Tìm kiếm theo:</span>

                    <select className="border-2 border-black rounded px-3 py-1 w-56">
                        <option>-- Chọn danh mục --</option>
                        <option>Hỏi đáp</option>
                    </select>

                    <button
                        onClick={() => setOpen(true)}
                        className="ml-auto bg-blue-600 text-white px-4 py-1 rounded shadow hover:bg-blue-700"
                    >
                        Gửi câu hỏi
                    </button>
                </div>

                {/* Hàng dưới */}
                <div className="flex items-center gap-4">
                    {/* Input search */}
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                            🔍
                        </span>
                        <input
                            placeholder="Tìm theo từ khóa"
                            className="w-full border-2 border-black rounded-full pl-10 pr-4 py-2 focus:outline-none"
                        />
                    </div>

                    <button className="bg-red-600 text-white px-6 py-2 rounded shadow hover:bg-red-700">
                        Tìm kiếm
                    </button>
                </div>

                {/* Box kết quả */}
                <div className="border-2 border-black rounded h-[280px] p-3">
                    <p className="text-sm text-gray-700">Kết quả tìm kiếm</p>
                </div>
            </div>

            <AskQuestionModal open={open} onClose={() => setOpen(false)} />
        </div>
    );
}

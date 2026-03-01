import React, { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";


const PAGES = [
  { path: "/screen-2", label: "Bối cảnh lịch sử" },
  { path: "/screen-3", label: "Bình minh mở cửa" },
  { path: "/phase-2", label: "Vươn Ra Khu Vực" },
  { path: "/factory",  label: `"Công Xưởng" Mới` },
  { path: "/fdi",      label: "Dòng vốn FDI" },
  { path: "/future",   label: "Tương lai Việt Nam" },
  { path: "/agro",     label: "Nông nghiệp & Công nghệ" },
  { path: "/screen-11", label: "Gặt hái trái ngọt"},
  { path: "/screen-12", label: "Chông gai phía trước"},
];

export default function Nav(){
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Xác định option đang active theo URL hiện tại
  const current = useMemo(() => {
    const hit = PAGES.find(p => pathname.startsWith(p.path));
    return hit ? hit.path : PAGES[0].path;
  }, [pathname]);

  return (
    <div className="nav noise">
      <motion.div
        className="nav-inner container"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: .5 }}
      >
        <div className="brand">MLN122 • E-BOOK</div>

        <label className="nav-sel-wrap" aria-label="Chuyển màn">
          <select
            className="nav-select"
            value={current}
            onChange={(e)=> navigate(e.target.value)}
          >
            {PAGES.map(p => (
              <option key={p.path} value={p.path}>{p.label}</option>
            ))}
          </select>
          <span className="nav-select-caret" aria-hidden>▾</span>
        </label>
      </motion.div>
      <div className="header-spacer" />
    </div>
  );
}

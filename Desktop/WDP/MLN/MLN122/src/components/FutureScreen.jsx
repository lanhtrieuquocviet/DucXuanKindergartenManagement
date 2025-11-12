import React, { useRef } from "react";
import useInViewOnce from "../hooks/useInViewOnce";
import { LuCpu, LuGlobe, LuCloud, LuLeaf, LuBatteryCharging, LuShieldCheck, LuChartBar, LuSettings } from "react-icons/lu";
import "../assets/styles/FutureScreen.css";

export default function FutureScreen(){
  const ref = useRef(null);
  const inView = useInViewOnce(ref);

  return (
    <section ref={ref} className={`future-wrap ${inView ? "is-in" : ""}`}>
      <div className="container">
        <header className="ft-hero card">
          <div className="ft-hero-left">
            <h2 className="ft-title">Hướng Tới Tương Lai — Kinh Tế Số &amp; Bền Vững</h2>
            <p className="ft-sub">
              Trọng tâm là <b>chuyển đổi số</b> (hạ tầng, dữ liệu mở, định danh số), <b>kinh tế xanh</b> (tiết kiệm năng lượng,
              tuần hoàn tài nguyên, giảm phát thải) và <b>nâng vị thế trong chuỗi giá trị</b> (tăng hàm lượng R&amp;D, thiết kế,
              thương hiệu – dịch vụ). Mục tiêu: nâng tỷ trọng kinh tế số, giảm cường độ phát thải, tăng giá trị gia tăng nội địa.
            </p>

            <div className="ft-kpis">
              <div className="kpi" aria-label="Mục tiêu kinh tế số">
                <div className="ring" style={{ "--val":"48%" }} />
                <div className="kpi-text">
                  <div className="kpi-num">48%</div>
                  <div className="kpi-cap">Tỷ trọng kinh tế số/GDP (mục tiêu tham khảo)</div>
                </div>
              </div>
              <div className="kpi" aria-label="Mục tiêu năng lượng tái tạo">
                <div className="ring green" style={{ "--val":"35%" }} />
                <div className="kpi-text">
                  <div className="kpi-num">35%</div>
                  <div className="kpi-cap">Tỷ trọng năng lượng tái tạo (tham khảo)</div>
                </div>
              </div>
            </div>

            <p className="ft-note">
              <em>Lưu ý:</em> Các KPI trên dùng để minh họa giao diện; khi thuyết trình có thể thay bằng mục tiêu chính thức/đã công bố.
            </p>
          </div>

          <div className="ft-hero-right">
            <div className="orbit" aria-hidden>
              <div className="orb center"><LuGlobe /></div>
              <div className="orb o1"><LuCpu /></div>
              <div className="orb o2"><LuCloud /></div>
              <div className="orb o3"><LuBatteryCharging /></div>
              <div className="orb o4"><LuLeaf /></div>
              <div className="orb o5"><LuShieldCheck /></div>
            </div>
          </div>
        </header>

        <div className="ft-grid">
          {/* 1. HẠ TẦNG SỐ */}
          <div className="ft-card">
            <div className="ft-row">
              <div className="ft-ico"><LuCpu /></div>
              <div className="ft-title2">Hạ tầng số</div>
            </div>
            <ul className="ft-list">
              <li>Điện toán đám mây/hybrid, trung tâm dữ liệu đạt chuẩn; kết nối 5G – IoT diện rộng.</li>
              <li>Định danh điện tử, chữ ký số; <b>dữ liệu mở</b> và <b>API-first</b> để liên thông dịch vụ công – tư.</li>
              <li>Thanh toán số/QR, thương mại điện tử xuyên biên giới; logistics số hoá từ kho đến cửa.</li>
              <li>An toàn thông tin &amp; bảo mật theo chuẩn quốc tế; quản trị rủi ro dữ liệu &amp; quyền riêng tư.</li>
              <li>Nâng kỹ năng số cho SME/lao động: phân tích dữ liệu, tự động hoá, AI trợ lý.</li>
            </ul>
          </div>

          {/* 2. KINH TẾ XANH */}
          <div className="ft-card">
            <div className="ft-row">
              <div className="ft-ico"><LuLeaf /></div>
              <div className="ft-title2">Kinh tế xanh</div>
            </div>
            <ul className="ft-list">
              <li>Lộ trình giảm phát thải &amp; thị trường carbon; kiểm kê &amp; báo cáo theo chuẩn ESG.</li>
              <li>Năng lượng tái tạo (điện gió, mặt trời), lưu trữ năng lượng, nâng hiệu suất sử dụng điện.</li>
              <li>Kinh tế tuần hoàn: tái chế – tái sử dụng – thay thế vật liệu; <em>eco-design</em> sản phẩm.</li>
              <li>Chuỗi cung ứng xanh: tối ưu vận tải, truy xuất nguồn gốc, kiểm soát dấu chân carbon.</li>
              <li>Đổi mới xanh: vật liệu sinh học, nông nghiệp thông minh khí hậu, công nghệ xử lý rác thải.</li>
            </ul>
          </div>

          {/* 3. NÂNG VỊ THẾ TRONG CHUỖI GIÁ TRỊ */}
          <div className="ft-card">
            <div className="ft-row">
              <div className="ft-ico"><LuChartBar /></div>
              <div className="ft-title2">Nâng vị thế trong chuỗi giá trị</div>
            </div>
            <ul className="ft-list">
              <li>Chuyển từ OEM/ODM sang OBM: tăng hàm lượng <b>thiết kế – thương hiệu – dịch vụ</b>.</li>
              <li>Tăng <b>giá trị gia tăng nội địa (DVA)</b> bằng công nghiệp hỗ trợ &amp; cụm liên kết ngành.</li>
              <li>Đầu tư R&amp;D, trung tâm thử nghiệm &amp; tiêu chuẩn; ươm tạo startup công nghệ.</li>
              <li>Logistics thông minh, cảng số; chuẩn hoá dữ liệu, tích hợp nền tảng số quốc gia.</li>
              <li>Xúc tiến thương mại số, marketing toàn cầu, bảo hộ SHTT và chất lượng đồng bộ.</li>
            </ul>
          </div>

          {/* 4. THỂ CHẾ & TIÊU CHUẨN */}
          <div className="ft-card">
            <div className="ft-row">
              <div className="ft-ico"><LuSettings /></div>
              <div className="ft-title2">Thể chế &amp; tiêu chuẩn</div>
            </div>
            <ul className="ft-list">
              <li>Sandbox thử nghiệm cho công nghệ mới; chuẩn mở (OpenAPI/ISO), liên thông dữ liệu.</li>
              <li>Khung pháp lý dữ liệu &amp; bảo vệ quyền riêng tư; quản trị AI có trách nhiệm.</li>
              <li>Tài chính xanh: tín dụng ưu đãi, trái phiếu xanh, PPP cho hạ tầng số – xanh.</li>
              <li>Hợp tác quốc tế, công nhận lẫn nhau về tiêu chuẩn &amp; chứng nhận.</li>
              <li>Đào tạo nguồn nhân lực chất lượng cao &amp; kỹ năng số/ xanh xuyên suốt.</li>
            </ul>
          </div>
        </div>

        {/* (tuỳ chọn) Hành động/định hướng nhanh */}
        <div className="ft-actions" style={{marginTop:16, display:"flex", gap:10, flexWrap:"wrap"}}>
          <button className="btn btn-red">Lộ trình chuyển đổi số</button>
          <button className="btn btn-gold">Bản đồ dự án xanh</button>
          <button className="btn btn-outline">Chỉ số chuỗi giá trị</button>
        </div>
      </div>
    </section>
  );
}

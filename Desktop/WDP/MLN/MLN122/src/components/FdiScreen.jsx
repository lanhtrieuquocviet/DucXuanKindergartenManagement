import React, { useMemo, useRef, useState } from "react";
import useInViewOnce from "../hooks/useInViewOnce";
import "../assets/styles/FdiScreen.css";

const COUNTRIES = [
  {
    id: "kr",
    name: "Hàn Quốc",
    value: 82.3,
    share: 18.5,
    headline: "Samsung, LG, Posco mở rộng sản xuất",
  },
  {
    id: "sg",
    name: "Singapore",
    value: 73.4,
    share: 16.5,
    headline: "Trung tâm tài chính – logistics khu vực",
  },
  {
    id: "jp",
    name: "Nhật Bản",
    value: 70.25,
    share: 15.8,
    headline: "Ô tô – cơ khí chính xác – hạ tầng",
  },
  {
    id: "tw",
    name: "Đài Loan",
    value: 40.1,
    share: 9.0,
    headline: "Chuỗi cung ứng điện tử, dệt may",
  },
  {
    id: "hk",
    name: "Hong Kong",
    value: 34.7,
    share: 7.8,
    headline: "Đầu tư tài chính và bất động sản",
  },
  {
    id: "cn",
    name: "Trung Quốc",
    value: 27.1,
    share: 6.1,
    headline: "Khu công nghiệp miền Bắc & NL tái tạo",
  },
  {
    id: "us",
    name: "Hoa Kỳ",
    value: 16.2,
    share: 3.6,
    headline: "Công nghệ cao, năng lượng sạch",
  },
  {
    id: "nl",
    name: "Hà Lan",
    value: 15.3,
    share: 3.4,
    headline: "Logistics, nông nghiệp thông minh",
  },
  {
    id: "uk",
    name: "Anh",
    value: 11.8,
    share: 2.6,
    headline: "Dịch vụ tài chính, giáo dục",
  },
  {
    id: "others",
    name: "Các quốc gia khác",
    value: 67.3,
    share: 16.7,
    headline: "Đa dạng lĩnh vực từ EU, ASEAN, Trung Đông",
  },
];

const SECTOR_DATA = [
  { id: "manufacturing", label: "Chế biến chế tạo", value: 58 },
  { id: "realestate", label: "Bất động sản", value: 16 },
  { id: "energy", label: "Năng lượng & hạ tầng", value: 11 },
  { id: "services", label: "Dịch vụ, bán lẻ", value: 8 },
  { id: "agri", label: "Nông nghiệp, thủy sản", value: 4 },
  { id: "others", label: "Lĩnh vực khác", value: 3 },
];

const PIE_COLORS = {
  manufacturing: "#E76F51",
  realestate: "#F4A261",
  energy: "#2A9D8F",
  services: "#457B9D",
  agri: "#A7C957",
  others: "#BDB2FF",
};

function layoutTreemap(items, x = 0, y = 0, width = 100, height = 100) {
  if (!items.length) return [];
  if (items.length === 1) {
    const [item] = items;
    return [{ ...item, x, y, width, height }];
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);
  let accum = 0;
  let index = 0;
  for (; index < items.length - 1; index += 1) {
    accum += items[index].value;
    if (accum >= total / 2) break;
  }

  const groupA = items.slice(0, index + 1);
  const groupB = items.slice(index + 1);
  const shareA = groupA.reduce((sum, item) => sum + item.value, 0) / total;

  if (width >= height) {
    const wA = width * shareA;
    return [
      ...layoutTreemap(groupA, x, y, wA, height),
      ...layoutTreemap(groupB, x + wA, y, width - wA, height),
    ];
  }

  const hA = height * shareA;
  return [
    ...layoutTreemap(groupA, x, y, width, hA),
    ...layoutTreemap(groupB, x, y + hA, width, height - hA),
  ];
}

function buildPieSlices(data) {
  const total = data.reduce((sum, s) => sum + s.value, 0);
  let current = -Math.PI / 2; // start at top
  return data.map((item) => {
    const angle = (item.value / total) * Math.PI * 2;
    const start = current;
    const end = current + angle;
    current = end;

    const largeArc = angle > Math.PI ? 1 : 0;
    const radius = 48;

    const x1 = 50 + radius * Math.cos(start);
    const y1 = 50 + radius * Math.sin(start);
    const x2 = 50 + radius * Math.cos(end);
    const y2 = 50 + radius * Math.sin(end);

    const path = `M50 50 L${x1.toFixed(3)} ${y1.toFixed(3)} A${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
    return { ...item, path };
  });
}

export default function FdiScreen() {
  const wrapRef = useRef(null);
  const inView = useInViewOnce(wrapRef);
  const [activeId, setActiveId] = useState(COUNTRIES[0].id);

  const layout = useMemo(
    () => layoutTreemap([...COUNTRIES].sort((a, b) => b.value - a.value)),
    []
  );
  const activeCountry = useMemo(
    () => COUNTRIES.find((c) => c.id === activeId) || COUNTRIES[0],
    [activeId]
  );
  const totalFdi = useMemo(
    () => COUNTRIES.reduce((sum, c) => sum + c.value, 0),
    []
  );
  const pieSlices = useMemo(() => buildPieSlices(SECTOR_DATA), []);

  return (
    <section ref={wrapRef} className={`fdi-wrap ${inView ? "is-in" : ""}`}>
      <div className="container">
        <header className="fdi-head">
          <h2 className="fdi-title">Màn hình 7 · Dòng Vốn FDI — “Đại Bàng Lót Tổ”</h2>
          <p className="fdi-sub">
            Làn sóng vốn ngoại dịch chuyển về Việt Nam giai đoạn hội nhập sâu rộng,
            với các đại bàng công nghệ, sản xuất và tài chính đặt nền tảng cho chuỗi
            cung ứng mới.
          </p>
        </header>

        <div className="fdi-layout">
          <div className="fdi-board card">
            <div className="board-title">Top quốc gia đầu tư vào Việt Nam</div>
            <div className="board-caption">
              Quy mô lũy kế (tỷ USD) – di chuột để xem chi tiết từng “đại bàng”.
            </div>

            <div className="treemap" role="list">
              {layout.map((tile) => {
                const isActive = tile.id === activeCountry.id;
                const share = ((tile.value / totalFdi) * 100).toFixed(1);
                return (
                  <div
                    key={tile.id}
                    role="listitem"
                    className={`treemap-tile ${isActive ? "active" : ""}`}
                    style={{
                      left: `${tile.x}%`,
                      top: `${tile.y}%`,
                      width: `${tile.width}%`,
                      height: `${tile.height}%`,
                    }}
                    tabIndex={0}
                    onMouseEnter={() => setActiveId(tile.id)}
                    onFocus={() => setActiveId(tile.id)}
                  >
                    <div className="tile-inner">
                      <div className="tile-name">{tile.name}</div>
                      <div className="tile-value">{tile.value.toFixed(1)} tỷ USD</div>
                      <div className="tile-share">{share}% tổng vốn</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="fdi-info card">
            <div className="info-label">Quốc gia nổi bật</div>
            <div className="info-name">{activeCountry.name}</div>
            <div className="info-value">
              {activeCountry.value.toFixed(1)} tỷ USD · {activeCountry.share}% tổng vốn
            </div>
            <div className="info-note">{activeCountry.headline}</div>

            <div className="info-ticker">
              <span className="tick-label">Tổng vốn FDI đăng ký</span>
              <span className="tick-value">{totalFdi.toFixed(1)} tỷ USD</span>
            </div>

            <div className="pie-card">
              <div className="pie-head">Lĩnh vực hút vốn nhiều nhất</div>
              <div className="pie-wrap">
                <svg className="pie-chart" viewBox="0 0 100 100" role="img">
                  <title>Cơ cấu vốn FDI theo lĩnh vực</title>
                  {pieSlices.map((slice) => (
                    <path
                      key={slice.id}
                      d={slice.path}
                      fill={PIE_COLORS[slice.id]}
                      className="pie-slice"
                    >
                      <title>
                        {slice.label}: {slice.value}%
                      </title>
                    </path>
                  ))}
                </svg>
                <div className="pie-legend">
                  {SECTOR_DATA.map((sector) => (
                    <div key={sector.id} className="legend-row">
                      <span
                        className="legend-dot"
                        style={{ backgroundColor: PIE_COLORS[sector.id] }}
                      />
                      <span className="legend-label">{sector.label}</span>
                      <span className="legend-value">{sector.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}


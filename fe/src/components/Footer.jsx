
function Footer() {
    const s = {
        page: {
            fontFamily: "Arial, sans-serif",
            background: "#d9f7b5",
            width: "100vw",
            overflowX: "hidden",
        },

        image: {
            width: "100%",
            height: 380,
            background: "#ddd",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
        },

        /* Footer */
        footer: {
            position: "relative",
            height: 160,
            marginTop: 24,
            overflow: "hidden",
        },

        footerImage: {
            width: "100%",
            height: "100%",
            objectFit: "cover",
        },

        footerOverlay: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            padding: "12px 24px",
            background: "rgba(0,0,0,0.15)", // lớp mờ nhẹ
            color: "#000",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
        },

        footerMenu: {
            display: "flex",
            gap: 16,
            fontSize: 14,
            fontWeight: "bold",
        },

        footerContent: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        },

        footerLeft: {
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            gap: 16,
        },

        footerLogo: {
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
        },

        footerRight: {
            textAlign: "right",
            fontSize: 14,
            lineHeight: 1.6,
        },
    };
    return (
        <div style={s.page}>
            <div style={s.footer}>
                <img
                    src="https://webmamnon.wordpress.com/wp-content/uploads/2013/08/cropped-banner.png"
                    alt="Footer background"
                    style={s.footerImage}
                />

                <div style={s.footerOverlay}>
                    {/* Menu trên */}
                    <div style={s.footerMenu}>
                        <div>Trang chủ</div>
                        <div>Thông tin công khai</div>
                        <div>Giới thiệu</div>
                        <div>Tin tức</div>
                        <div>Văn bản</div>
                        <div>Thư viện</div>
                        <div>Hỏi đáp</div>
                        <div>Liên hệ</div>
                    </div>

                    {/* Nội dung chính */}
                    <div style={s.footerContent}>
                        {/* Trái */}
                        <div style={s.footerLeft}>
                            {/* <div style={s.footerLogo}>Logo</div> */}
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgJSe-7VrwJQ7Pfb5oTd81kxK72xSG4VGh0g&s"
                                alt="Footer Logo"
                                style={s.footerLogo}
                            />
                            <div>
                                <div style={{ fontWeight: "bold", fontSize: 18, textAlign: "center" }}>
                                    Trường Mầm non Đức Xuân
                                </div>
                            </div>
                        </div>

                        {/* Phải */}
                        <div style={s.footerRight}>
                            <div>Địa chỉ: Tổ 9B, phường Đức Xuân, tỉnh Thái Nguyên</div>
                            <div>Điện thoại: 0869550151</div>
                            <div>Email: cddcuxuan_pgdtbackan@backan.edu.vn</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Footer
/* Layout admin chung cho các role: sidebar trái + nội dung phải */
import { useState } from 'react';

function RoleLayout({
  title,
  description,
  menuItems = [],
  activeKey,
  onLogout,
  userName,
  onViewProfile,
  onMenuSelect,
  children,
}) {
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  return (
    <div className="min-h-screen bg-sky-50/60">
      <div className="flex h-screen max-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-sky-100 shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-sky-100">
            <h1 className="text-base font-bold text-sky-900">DucXuan Management</h1>
            <p className="mt-1 text-xs text-sky-500">Bảng điều khiển</p>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = item.key === activeKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (onMenuSelect) onMenuSelect(item.key);
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-sky-800 hover:bg-sky-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-2 inline-flex items-center rounded-full px-2 text-[11px] font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="px-4 py-3 border-t border-sky-100">
            <button
              type="button"
              onClick={onLogout}
              className="w-full inline-flex items-center justify-center rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-red-600 transition"
            >
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
            <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-sky-900">{title}</h2>
                {description && (
                  <p className="mt-1 text-sm text-sky-600">{description}</p>
                )}
              </div>

              {userName && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenProfileMenu((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs md:text-sm font-medium text-sky-800 shadow-sm hover:bg-sky-50 transition"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-semibold">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                    <span>{userName}</span>
                  </button>

                  {openProfileMenu && (
                    <>
                      <div className="absolute right-0 mt-2 w-44 rounded-xl border border-sky-100 bg-white shadow-lg text-xs md:text-sm z-10">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-sky-50 text-sky-800 rounded-t-xl"
                          onClick={() => {
                            if (onViewProfile) {
                              onViewProfile();
                            } else {
                              // eslint-disable-next-line no-alert
                              alert('Chức năng xem hồ sơ đang được phát triển.');
                            }
                            setOpenProfileMenu(false);
                          }}
                        >
                          Xem hồ sơ
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 rounded-b-xl"
                          onClick={() => {
                            if (onLogout) {
                              onLogout();
                            }
                            setOpenProfileMenu(false);
                          }}
                        >
                          Đăng xuất
                        </button>
                      </div>
                      {/* Click outside để đóng dropdown */}
                      <div
                        className="fixed inset-0 z-0"
                        onClick={() => setOpenProfileMenu(false)}
                      />
                    </>
                  )}
                </div>
              )}
            </header>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default RoleLayout;

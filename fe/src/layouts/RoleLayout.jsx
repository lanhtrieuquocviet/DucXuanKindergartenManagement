/* Layout admin chung cho các role: sidebar trái + nội dung phải */
import { useState } from 'react';

function RoleLayout({
  title,
  description,
  menuItems = [],
  activeKey,
  onLogout,
  userName,
  userAvatar,
  onViewProfile,
  onMenuSelect,
  children,
}) {
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen max-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col">
          <div className="px-5 py-4 border-b border-gray-800">
            <h1 className="text-base font-semibold">Menu</h1>
            <p className="mt-1 text-xs text-gray-400">Bảng điều khiển</p>
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
                  className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-200 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-2 inline-flex items-center rounded-full px-2 text-[11px] font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="px-4 py-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onLogout}
              className="w-full inline-flex items-center justify-center rounded-md bg-red-500 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-red-600 transition"
            >
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6 md:py-8">
            <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h2>
                {description && (
                  <p className="mt-1 text-sm text-gray-500">{description}</p>
                )}
              </div>

              {userName && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenProfileMenu((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs md:text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 transition"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-semibold overflow-hidden">
                      {userAvatar ? (
                        <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        userName.charAt(0).toUpperCase()
                      )}
                    </span>
                    <span>{userName}</span>
                  </button>

                  {openProfileMenu && (
                    <>
                      <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-lg text-xs md:text-sm z-10">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-800 rounded-t-xl"
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

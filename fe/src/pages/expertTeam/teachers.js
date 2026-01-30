const teachers = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Giáo viên ${i + 1}`,
  position: "Giáo viên",
  phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
  email: `giaovien${i + 1}@gmail.com`,
  avatar: "https://via.placeholder.com/120x160.png?text=Avatar",
}));

export default teachers;

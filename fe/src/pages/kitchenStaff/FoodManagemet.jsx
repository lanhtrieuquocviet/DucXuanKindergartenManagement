import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getFoods,
  createFood,
  updateFood,
  deleteFood,
} from "../../service/menu.api";

const emptyFood = {
  name: "",
  calories: "",
  protein: "",
  fat: "",
  carb: "",
};

function FoodManagement() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  const [form, setForm] = useState(emptyFood);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const res = await getFoods();
      setFoods(res.data);
    } catch (error) {
      toast.error("Không thể tải danh sách món");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingFood(null);
    setForm(emptyFood);
    setErrors({});
    setShowModal(true);
  };

const handleOpenEdit = (food) => {
  setEditingFood(food);

  setForm({
    name: food.name || "",
    calories: food.calories || "",
    protein: food.protein || "",
    fat: food.fat || "",
    carb: food.carb || "",
  });

  setShowModal(true);
};

  // validate từng field
  const validateField = (name, value) => {
    let error = "";

    if (name === "name") {
      if (!value.trim()) error = "Tên món không được để trống";
      else if (value.length > 20) error = "Tên món tối đa 20 ký tự";
    }

    if (["calories", "protein", "fat", "carb"].includes(name)) {
      if (value === "") error = "Không được để trống";
      else if (!Number.isInteger(Number(value))) error = "Phải là số nguyên";
      else if (Number(value) < 0) error = "Phải là số nguyên dương";
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return error === "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    validateField(name, value);
  };

  const validateForm = () => {
    let isValid = true;

    Object.keys(form).forEach((key) => {
      const valid = validateField(key, form[key]);
      if (!valid) isValid = false;
    });

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const data = {
        ...form,
        calories: Number(form.calories),
        protein: Number(form.protein),
        fat: Number(form.fat),
        carb: Number(form.carb),
      };

      if (editingFood) {
        await updateFood(editingFood._id, data);
        toast.success("Cập nhật món ăn thành công");
      } else {
        await createFood(data);
        toast.success("Tạo món ăn thành công");
      }

      setShowModal(false);
      fetchFoods();
    } catch (error) {
      toast.error(error.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa món này?")) return;

    try {
      await deleteFood(id);
      toast.success("Xóa thành công");
      fetchFoods();
    } catch (error) {
      toast.error("Xóa thất bại");
    }
  };

  const isFormValid =
    Object.values(errors).every((e) => !e) &&
    Object.values(form).every((v) => v !== "");

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">Quản lý món ăn</h1>

        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Thêm món
        </button>
      </div>

      {/* TABLE */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Tên món</th>
              <th className="p-3 border">Calories</th>
              <th className="p-3 border">Protein</th>
              <th className="p-3 border">Fat</th>
              <th className="p-3 border">Carb</th>
              <th className="p-3 border">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {foods.map((food) => (
              <tr key={food._id} className="hover:bg-gray-50">
                <td className="border p-3">{food.name}</td>
                <td className="border p-3">{food.calories} kcal</td>
                <td className="border p-3">{food.protein} g</td>
                <td className="border p-3">{food.fat} g</td>
                <td className="border p-3">{food.carb} g</td>

                <td className="border p-3 flex gap-2 justify-center">
                  <button
                    onClick={() => handleOpenEdit(food)}
                    className="px-3 py-1 border rounded"
                  >
                    Sửa
                  </button>

                  <button
                    onClick={() => handleDelete(food._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 w-[400px] rounded-lg">
            <h2 className="font-semibold mb-4">
              {editingFood ? "Sửa món ăn" : "Thêm món ăn"}
            </h2>

            <div className="space-y-3">
              {/* name */}
              <div>
                <input
                  name="name"
                  maxLength={20}
                  placeholder="Tên món"
                  value={form.name}
                  onChange={handleChange}
                  className={`w-full border p-2 rounded ${
                    errors.name ? "border-red-500" : ""
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name}</p>
                )}
              </div>

              {/* calories */}
              <div>
                <input
                  name="calories"
                  type="number"
                  min={0}
                  placeholder="Calories"
                  value={form.calories}
                  onChange={handleChange}
                  className={`w-full border p-2 rounded ${
                    errors.calories ? "border-red-500" : ""
                  }`}
                />
                {errors.calories && (
                  <p className="text-red-500 text-xs">{errors.calories}</p>
                )}
              </div>

              {/* protein */}
              <div>
                <input
                  name="protein"
                  type="number"
                  min={0}
                  placeholder="Protein"
                  value={form.protein}
                  onChange={handleChange}
                  className={`w-full border p-2 rounded ${
                    errors.protein ? "border-red-500" : ""
                  }`}
                />
                {errors.protein && (
                  <p className="text-red-500 text-xs">{errors.protein}</p>
                )}
              </div>

              {/* fat */}
              <div>
                <input
                  name="fat"
                  type="number"
                  min={0}
                  placeholder="Fat"
                  value={form.fat}
                  onChange={handleChange}
                  className={`w-full border p-2 rounded ${
                    errors.fat ? "border-red-500" : ""
                  }`}
                />
                {errors.fat && (
                  <p className="text-red-500 text-xs">{errors.fat}</p>
                )}
              </div>

              {/* carb */}
              <div>
                <input
                  name="carb"
                  type="number"
                  min={0}
                  placeholder="Carb"
                  value={form.carb}
                  onChange={handleChange}
                  className={`w-full border p-2 rounded ${
                    errors.carb ? "border-red-500" : ""
                  }`}
                />
                {errors.carb && (
                  <p className="text-red-500 text-xs">{errors.carb}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="border px-3 py-1 rounded"
              >
                Hủy
              </button>

              <button
                disabled={!isFormValid}
                onClick={handleSubmit}
                className={`px-3 py-1 rounded text-white ${
                  isFormValid ? "bg-blue-600" : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodManagement;

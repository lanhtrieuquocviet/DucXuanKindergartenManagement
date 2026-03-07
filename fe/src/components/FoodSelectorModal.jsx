import { useEffect, useState } from "react";
import { getFoods } from "../service/menu.api";

function FoodSelectorModal({ open, onClose, onSave }) {
  const [foods, setFoods] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    const res = await getFoods();
    setFoods(res.data);
  };

  const toggleFood = (food) => {
    const exists = selectedFoods.find((f) => f._id === food._id);

    if (exists) {
      setSelectedFoods(selectedFoods.filter((f) => f._id !== food._id));
    } else {
      setSelectedFoods([...selectedFoods, food]);
    }
  };

  const totalCalories = selectedFoods.reduce(
    (sum, food) => sum + food.calories,
    0
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 w-[500px] rounded-lg">
        <h2 className="font-semibold mb-3">Chọn món ăn</h2>

        <div className="max-h-[300px] overflow-y-auto border rounded">
          {foods.map((food) => {
            const checked = selectedFoods.some((f) => f._id === food._id);

            return (
              <div
                key={food._id}
                className="flex justify-between items-center p-2 border-b"
              >
                <label className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFood(food)}
                  />

                  {food.name}
                </label>

                <span className="text-xs text-gray-500">
                  {food.calories} kcal
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-sm">
          Tổng Calories: <b>{totalCalories}</b>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="border px-3 py-1 rounded">
            Huỷ
          </button>

          <button
            onClick={() => onSave(selectedFoods)}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

export default FoodSelectorModal;

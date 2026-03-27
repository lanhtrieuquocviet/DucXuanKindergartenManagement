/**
 * Frontend Integration Example - MenuDetails.jsx
 * Cách sử dụng dữ liệu dinh dưỡng từ API trong frontend
 */

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../config/axiosConfig"; // Adjust path as needed

const MenuDetails = () => {
  const { menuId } = useParams();
  const [dailyMenu, setDailyMenu] = useState(null);
  const [selectedLunchFoods, setSelectedLunchFoods] = useState([]);
  const [selectedAfternoonFoods, setSelectedAfternoonFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch daily menu data
  useEffect(() => {
    const fetchDailyMenu = async () => {
      try {
        setLoading(true);
        // Replace with actual API endpoint
        const response = await axiosInstance.get(`/api/daily-menu/${menuId}`);
        setDailyMenu(response.data.data);
        setSelectedLunchFoods(response.data.data.lunchFoods);
        setSelectedAfternoonFoods(response.data.data.afternoonFoods);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (menuId) {
      fetchDailyMenu();
    }
  }, [menuId]);

  // Handle update daily menu
  const handleUpdateMenu = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/api/daily-menu/${menuId}`, {
        lunchFoods: selectedLunchFoods,
        afternoonFoods: selectedAfternoonFoods,
      });

      // Backend automatically calculates nutrition data!
      const updatedMenu = response.data.data;
      setDailyMenu(updatedMenu);
      // setSuccess("Cập nhật thực đơn thành công!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!dailyMenu) return <div>No data</div>;

  return (
    <div className="menu-details-container">
      {/* ... existing UI code ... */}

      {/* 🆕 NEW: Nutrition Information Section */}
      {dailyMenu && (
        <div className="nutrition-section">
          <h2>📊 Thông tin Dinh dưỡng (Nutrition Info)</h2>

          {/* Summary Cards */}
          <div className="nutrition-summary">
            <div className="nutrition-card">
              <h3>Tổng Calories</h3>
              <p className="large-number">{dailyMenu.totalCalories}</p>
              <span className="unit">Kcal</span>
            </div>

            <div className="nutrition-card">
              <h3>Protein (P)</h3>
              <p className="large-number">{dailyMenu.totalProtein.toFixed(1)}</p>
              <span className="unit">grams</span>
            </div>

            <div className="nutrition-card">
              <h3>Fat/Lipid (L)</h3>
              <p className="large-number">{dailyMenu.totalFat.toFixed(1)}</p>
              <span className="unit">grams</span>
            </div>

            <div className="nutrition-card">
              <h3>Carb/Glucid (G)</h3>
              <p className="large-number">{dailyMenu.totalCarb.toFixed(1)}</p>
              <span className="unit">grams</span>
            </div>
          </div>

          {/* Percentage Breakdown */}
          <div className="nutrition-percentages">
            <h3>Tỉ lệ % Thành phần (Percentage Breakdown)</h3>

            {/* Protein Percentage */}
            <div className="percentage-item">
              <label>Protein (P)</label>
              <div className="progress-bar">
                <div
                  className="progress-fill protein-fill"
                  style={{
                    width: `${dailyMenu.proteinPercentage}%`,
                  }}
                ></div>
              </div>
              <span className="percentage-text">
                {dailyMenu.proteinPercentage.toFixed(2)}%
              </span>
            </div>

            {/* Fat Percentage */}
            <div className="percentage-item">
              <label>Fat/Lipid (L)</label>
              <div className="progress-bar">
                <div
                  className="progress-fill fat-fill"
                  style={{
                    width: `${dailyMenu.fatPercentage}%`,
                  }}
                ></div>
              </div>
              <span className="percentage-text">
                {dailyMenu.fatPercentage.toFixed(2)}%
              </span>
            </div>

            {/* Carb Percentage */}
            <div className="percentage-item">
              <label>Carb/Glucid (G)</label>
              <div className="progress-bar">
                <div
                  className="progress-fill carb-fill"
                  style={{
                    width: `${dailyMenu.carbPercentage}%`,
                  }}
                ></div>
              </div>
              <span className="percentage-text">
                {dailyMenu.carbPercentage.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Detailed Kcal Breakdown */}
          <div className="kcal-breakdown">
            <h3>Chi tiết Quy đổi Kcal (Kcal Breakdown)</h3>

            <div className="breakdown-grid">
              <div className="breakdown-item">
                <span className="label">Protein Kcal</span>
                <span className="value">
                  {dailyMenu.nutritionDetails?.kcalFromProtein.toFixed(1)}
                </span>
                <span className="formula">
                  ({dailyMenu.totalProtein.toFixed(1)}g × 4)
                </span>
              </div>

              <div className="breakdown-item">
                <span className="label">Fat Kcal</span>
                <span className="value">
                  {dailyMenu.nutritionDetails?.kcalFromFat.toFixed(1)}
                </span>
                <span className="formula">
                  ({dailyMenu.totalFat.toFixed(1)}g × 9)
                </span>
              </div>

              <div className="breakdown-item">
                <span className="label">Carb Kcal</span>
                <span className="value">
                  {dailyMenu.nutritionDetails?.kcalFromCarb.toFixed(1)}
                </span>
                <span className="formula">
                  ({dailyMenu.totalCarb.toFixed(1)}g × 4)
                </span>
              </div>

              <div className="breakdown-item total">
                <span className="label">Tổng Kcal tính từ P-L-G</span>
                <span className="value">
                  {dailyMenu.nutritionDetails?.calculatedTotalKcal.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Chart Visualization (optional) */}
          <div className="nutrition-chart">
            <h3>Biểu đồ Thành phần (Nutritional Chart)</h3>
            {/* You can use Chart.js, Recharts, or D3.js here */}
            {/* Example with Recharts: */}
            {/* 
            <PieChart width={400} height={300}>
              <Pie
                data={[
                  { name: 'Protein', value: dailyMenu.proteinPercentage },
                  { name: 'Fat', value: dailyMenu.fatPercentage },
                  { name: 'Carb', value: dailyMenu.carbPercentage }
                ]}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
              />
              <Legend />
            </PieChart>
            */}
          </div>

          {/* Information Box */}
          <div className="nutrition-info-box">
            <h4>📌 Công thức Tính toán (Calculation Formula)</h4>
            <ul>
              <li>1g Protein = 4 Kcal</li>
              <li>1g Fat/Lipid = 9 Kcal</li>
              <li>1g Carb/Glucid = 4 Kcal</li>
              <li>
                Tỉ lệ % = (Kcal from nutrient / Total Kcal) × 100
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ... rest of the component ... */}
    </div>
  );
};

export default MenuDetails;

/**
 * =================================================================
 * CSS STYLES EXAMPLE (add to your CSS file)
 * =================================================================
 */

const styles = `
/* Nutrition Section */
.nutrition-section {
  margin-top: 40px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.nutrition-section h2 {
  color: #333;
  margin-bottom: 20px;
}

/* Summary Cards */
.nutrition-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.nutrition-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nutrition-card h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.nutrition-card .large-number {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin: 10px 0;
}

.nutrition-card .unit {
  font-size: 12px;
  color: #999;
}

/* Percentage Section */
.nutrition-percentages {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nutrition-percentages h3 {
  margin-bottom: 20px;
  color: #333;
}

.percentage-item {
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 100px 1fr 80px;
  align-items: center;
  gap: 15px;
}

.percentage-item label {
  font-weight: 500;
  color: #333;
}

.progress-bar {
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.protein-fill {
  background-color: #ff6b6b; /* Red */
}

.fat-fill {
  background-color: #ffa94d; /* Orange */
}

.carb-fill {
  background-color: #51cf66; /* Green */
}

.percentage-text {
  font-weight: bold;
  color: #333;
  text-align: right;
}

/* Kcal Breakdown */
.kcal-breakdown {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.kcal-breakdown h3 {
  margin-bottom: 20px;
  color: #333;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.breakdown-item {
  background: #f9f9f9;
  padding: 15px;
  border-left: 4px solid #3498db;
  border-radius: 4px;
}

.breakdown-item.total {
  border-left-color: #e74c3c;
  background: #ffe6e6;
  font-weight: bold;
}

.breakdown-item .label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.breakdown-item .value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.breakdown-item .formula {
  display: block;
  font-size: 12px;
  color: #999;
}

/* Info Box */
.nutrition-info-box {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.nutrition-info-box h4 {
  margin-bottom: 10px;
  color: #1565c0;
}

.nutrition-info-box ul {
  margin: 0;
  padding-left: 20px;
}

.nutrition-info-box li {
  color: #333;
  margin-bottom: 5px;
}
`;

/**
 * =================================================================
 * API RESPONSE EXAMPLE
 * =================================================================
 */

const exampleApiResponse = {
  success: true,
  data: {
    _id: "60f7b3b4d1a2c3e4f5g6h7i8j",
    menuId: "60f7b3b4d1a2c3e4f5g6h7i8",
    weekType: "odd",
    dayOfWeek: "mon",
    lunchFoods: ["food_1", "food_2"],
    afternoonFoods: ["food_3"],

    // Original fields
    totalCalories: 355,
    totalProtein: 30.7,
    totalFat: 12.5,
    totalCarb: 33,

    // 🆕 NEW FIELDS - Automatically calculated by backend
    proteinPercentage: 33.43,
    fatPercentage: 30.63,
    carbPercentage: 35.94,

    nutritionDetails: {
      kcalFromProtein: 122.8, // 30.7 * 4
      kcalFromFat: 112.5, // 12.5 * 9
      kcalFromCarb: 132, // 33 * 4
      calculatedTotalKcal: 367.3, // Total Kcal calculated from P-L-G
    },

    createdAt: "2026-03-27T10:00:00Z",
    updatedAt: "2026-03-27T10:30:00Z",
  },
};

/**
 * =================================================================
 * HOW TO USE - Step by Step
 * =================================================================
 *
 * 1. When user changes lunch/afternoon foods:
 *    setSelectedLunchFoods([...])
 *    setSelectedAfternoonFoods([...])
 *
 * 2. User clicks "Save" or "Update":
 *    handleUpdateMenu()
 *    - Calls PUT /api/daily-menu/:id with food IDs
 *    - Backend automatically calculates nutrition data
 *
 * 3. API Response includes:
 *    - totalProtein, totalFat, totalCarb (grams)
 *    - proteinPercentage, fatPercentage, carbPercentage (%)
 *    - nutritionDetails (kcal breakdown)
 *
 * 4. Display nutrition data:
 *    - Show summary cards with totals
 *    - Show progress bars with percentages
 *    - Show kcal breakdown with formulas
 *
 * 5. Frontend doesn't need to calculate anything!
 *    - All calculations done on backend
 *    - Just display the data returned from API
 * =================================================================
 */

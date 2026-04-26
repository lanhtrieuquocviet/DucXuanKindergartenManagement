import React from 'react';
import ManageCategoriesBase from './ManageCategoriesBase';

export default function ManageIngredientCategories() {
  return (
    <ManageCategoriesBase
      type="Ingredient"
      title="Danh mục Nguyên liệu"
      description="Quản lý các nhóm thực phẩm, gia vị, phụ liệu dùng trong nhà bếp."
      typeLabel="nhóm nguyên liệu"
      activeKey="meal_management"
    />
  );
}

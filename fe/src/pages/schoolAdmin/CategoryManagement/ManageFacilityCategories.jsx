import React from 'react';
import ManageCategoriesBase from './ManageCategoriesBase';

export default function ManageFacilityCategories() {
  return (
    <ManageCategoriesBase
      type="Facility"
      title="Danh mục Cơ sở vật chất"
      description="Quản lý các loại cơ sở vật chất trong trường như phòng học, thiết bị, sân chơi..."
      typeLabel="loại CSVC"
      activeKey="assets" // Using assets as parent menu
    />
  );
}

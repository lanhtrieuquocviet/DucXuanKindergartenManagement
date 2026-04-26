import React from 'react';
import ManageCategoriesBase from './ManageCategoriesBase';

export default function ManageAssetCategories() {
  return (
    <ManageCategoriesBase
      type="Asset"
      title="Danh mục Tài sản"
      description="Quản lý các nhóm tài sản, đồ dùng, đồ chơi và học liệu trong kho."
      typeLabel="nhóm tài sản"
      activeKey="assets"
    />
  );
}

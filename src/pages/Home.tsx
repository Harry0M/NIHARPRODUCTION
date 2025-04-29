
import React from "react";

const Home = () => {
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2">Orders</h2>
          <p className="text-gray-500">Manage your customer orders</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2">Production</h2>
          <p className="text-gray-500">Track production jobs and schedules</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2">Inventory</h2>
          <p className="text-gray-500">Manage materials and stock</p>
        </div>
      </div>
    </div>
  );
};

export default Home;

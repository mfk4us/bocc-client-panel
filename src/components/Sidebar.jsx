import React from 'react';

export default function Sidebar() {
  return (
    <div className="w-1/4 bg-gray-200 p-4 h-full">
      <h2 className="text-lg font-bold mb-2">Contacts</h2>
      <ul>
        <li className="p-2 border-b">+966570000001</li>
        <li className="p-2 border-b">+966570000002</li>
      </ul>
    </div>
  );
}
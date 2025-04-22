import React from 'react';

export default function ChatWindow() {
  return (
    <div className="flex-1 bg-white p-4 overflow-auto">
      <div className="mb-2">
        <div className="bg-gray-100 p-2 rounded-md w-max mb-1">Hey! How can I help you?</div>
        <div className="bg-blue-100 p-2 rounded-md w-max ml-auto">Need a haircut 🧔</div>
      </div>
    </div>
  );
}
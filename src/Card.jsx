// components/Card.jsx
export default function Card({ children, className = "" }) {
    return (
      <div className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded shadow-md ${className}`}>
        {children}
      </div>
    );
  }
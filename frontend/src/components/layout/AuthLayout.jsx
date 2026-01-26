import { Outlet } from 'react-router-dom';
import { Monitor } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">IT Asset Portal</h1>
          <p className="text-gray-400 mt-1">Enterprise Asset Management</p>
        </div>
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
          <Outlet />
        </div>
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2025 IT Asset Management Portal
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;

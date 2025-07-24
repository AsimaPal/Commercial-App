import React from 'react';

function LoadingSpinner() {
    return (
        <div className="min-h-[300px] flex items-center justify-center bg-gray-50 rounded-xl">
            <div className="text-xl font-semibold text-gray-600">Loading application...</div>
        </div>
    );
}

export default LoadingSpinner;
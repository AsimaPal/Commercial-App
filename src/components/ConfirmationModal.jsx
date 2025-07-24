import React from 'react';

function ConfirmationModal({ show, message, onConfirm, onCancel }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-overlay fade-in p-4">
            <div className="bg-white p-8 rounded-2xl shadow-3xl max-w-md w-full transform scale-100 transition-all duration-300 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Action</h3>
                <p className="text-gray-700 text-lg mb-6">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;

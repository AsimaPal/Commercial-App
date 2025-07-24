import React from 'react';

function InsightsModal({ show, projectInsights, insightsLoading, insightsError, onClose }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-overlay fade-in p-4">
            <div className="bg-white p-8 rounded-2xl shadow-3xl max-w-xl w-full transform scale-100 transition-all duration-300 border border-gray-200">
                <h3 className="text-2xl font-bold text-blue-700 mb-4">✨ Project Insights</h3>
                {insightsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="ml-3 text-gray-700">Generating insights...</p>
                    </div>
                ) : insightsError ? (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                        <p>{insightsError}</p>
                    </div>
                ) : (
                    <p className="text-gray-700 text-lg mb-6 whitespace-pre-wrap">{projectInsights}</p>
                )}
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InsightsModal;

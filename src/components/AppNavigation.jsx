import React from 'react';

function AppNavigation({ currentView, setCurrentView, setEditingProject }) {
    return (
        <nav className="mb-10 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
                onClick={() => { setCurrentView('list'); setEditingProject(null); }}
                className={`px-5 py-2 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 shadow-md
                    ${currentView === 'list'
                        ? 'bg-blue-600 text-white border border-blue-700'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200'
                    }
                `}
            >
                Project Dashboard
            </button>
            <button
                onClick={() => { setCurrentView('form'); setEditingProject(null); }}
                className={`px-5 py-2 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 shadow-md
                    ${currentView === 'form'
                        ? 'bg-blue-600 text-white border border-blue-700'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200'
                    }
                `}
            >
                {currentView === 'form' && setEditingProject ? 'Edit Current Project' : 'Add New Project'}
            </button>
        </nav>
    );
}

export default AppNavigation;

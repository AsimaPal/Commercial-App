import React, { useState, useEffect } from 'react';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

function ProjectForm({ db, userId, appId, setCurrentView, editingProject, setEditingProject }) {
    const [projectName, setProjectName] = useState('');
    const [projectCode, setProjectCode] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [clientName, setClientName] = useState('');
    const [projectManagerName, setProjectManagerName] = useState('');
    const [deliveryManagerName, setDeliveryManagerName] = useState('');
    const [monthlyData, setMonthlyData] = useState({});
    const [currentMonthKey, setCurrentMonthKey] = useState('');
    const [currentRevenue, setCurrentRevenue] = useState('');
    const [currentCost, setCurrentCost] = useState('');
    const [currentMembers, setCurrentMembers] = useState('');
    const [currentRPE, setCurrentRPE] = useState('');
    const [currentCPE, setCurrentCPE] = useState('');
    const [currentGM, setCurrentGM] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (editingProject) {
            console.log("Project updated:", projectData); // <-- HERE

            setProjectName(editingProject.projectName || '');
            setProjectCode(editingProject.projectCode || '');
            setProjectDescription(editingProject.projectDescription || '');
            setClientName(editingProject.clientName || '');
            setProjectManagerName(editingProject.projectManagerName || '');
            setDeliveryManagerName(editingProject.deliveryManagerName || '');
            setMonthlyData(editingProject.monthlyData || {});
        } else {
            
            setProjectName('');
            setProjectCode('');
            setProjectDescription('');
            setClientName('');
            setProjectManagerName('');
            setDeliveryManagerName('');
            setMonthlyData({});
         

        }
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        setCurrentMonthKey(`${year}-${month}`);

        setCurrentRevenue('');
        setCurrentCost('');
        setCurrentMembers('');
        setCurrentRPE('');
        setCurrentCPE('');
        setCurrentGM('');
    }, [editingProject]);

    useEffect(() => {
        const rev = parseFloat(currentRevenue);
        const cost = parseFloat(currentCost);
        const mem = parseInt(currentMembers, 10);

        if (!isNaN(rev) && !isNaN(mem) && mem > 0) {
            setCurrentRPE((rev / mem).toFixed(2));
        } else {
            setCurrentRPE('');
        }

        if (!isNaN(cost) && !isNaN(mem) && mem > 0) {
            setCurrentCPE((cost / mem).toFixed(2));
        } else {
            setCurrentCPE('');
        }

        if (!isNaN(rev) && !isNaN(cost) && rev !== 0) {
            setCurrentGM((((rev - cost) / rev) * 100).toFixed(2));
        } else {
            setCurrentGM('');
        }
    }, [currentRevenue, currentCost, currentMembers]);

    const handleAddOrUpdateMonthlyData = () => {
        if (!currentMonthKey || !currentRevenue || !currentCost || !currentMembers) {
            setMessage('Please fill all monthly data fields.');
            setIsError(true);
            return;
        }

        const revenue = parseFloat(currentRevenue);
        const members = parseInt(currentMembers, 10);
        const cost = parseFloat(currentCost);

        const rpe = members > 0 ? (revenue / members) : 0;
        const cpe = members > 0 ? (cost / members) : 0;
        const gm = revenue !== 0 ? (((revenue - cost) / revenue) * 100) : 0;

        const newMonthlyData = {
            revenue: revenue,
            cost: cost,
            members: members,
            rpe: rpe,
            cpe: cpe,
            gm: gm
        };

        setMonthlyData(prev => ({
            ...prev,
            [currentMonthKey]: newMonthlyData
        }));

        setCurrentRevenue('');
        setCurrentCost('');
        setCurrentMembers('');
        setCurrentRPE('');
        setCurrentCPE('');
        setCurrentGM('');
        setMessage('');
        setIsError(false);
    };

    const handleEditMonthlyEntry = (monthKey) => {
        const data = monthlyData[monthKey];
        if (data) {
            setCurrentMonthKey(monthKey);
            setCurrentRevenue(data.revenue.toString());
            setCurrentCost(data.cost.toString());
            setCurrentMembers(data.members.toString());
            setCurrentRPE(data.rpe ? data.rpe.toFixed(2) : '');
            setCurrentCPE(data.cpe ? data.cpe.toFixed(2) : '');
            setCurrentGM(data.gm ? data.gm.toFixed(2) : '');
        }
    };

    const handleDeleteMonthlyEntry = (monthKey) => {
        setMonthlyData(prev => {
            const newMonthlyData = { ...prev };
            delete newMonthlyData[monthKey];
            return newMonthlyData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsError(false);

        if (!projectName || !projectCode || !clientName || !projectManagerName || !deliveryManagerName) {
            setMessage('Please fill in all required project details.');
            setIsError(true);
            setLoading(false);
            return;
        }

        const projectData = {
            projectName,
            projectCode,
            projectDescription,
            clientName,
            projectManagerName,
            deliveryManagerName,
            monthlyData: monthlyData
        };

        try {
            const projectsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/projects`);

            if (editingProject) {
                const projectDocRef = doc(projectsCollectionRef, editingProject.id);
                await setDoc(projectDocRef, projectData, { merge: true });
                setMessage('Project updated successfully!');
            } else {
                await addDoc(projectsCollectionRef, projectData);
                setMessage('Project added successfully!');
            }
            setIsError(false);
            setTimeout(() => {
                setCurrentView('list');
                setEditingProject(null);
            }, 1500);
        } catch (error) {
            console.error("Error saving project:", error);
            setMessage(`Failed to save project: ${error.message}`);
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-blue-700 mb-6">
                {editingProject ? 'Edit Project Details' : 'Add New Project'}
            </h2>
            {message && (
                <div className={`p-4 mb-6 rounded-lg text-lg font-medium ${isError ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                    {message}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-[#F8FDFE] p-5 rounded-xl shadow-sm border border-[#EBF5F7]">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2 border-gray-200">Project Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="projectName"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="projectCode" className="block text-sm font-medium text-gray-700 mb-1">Project Code <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="projectCode"
                                    value={projectCode}
                                    onChange={(e) => setProjectCode(e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                                <textarea
                                    id="projectDescription"
                                    value={projectDescription}
                                    onChange={(e) => setProjectDescription(e.target.value)}
                                    rows="2"
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
                                ></textarea>
                            </div>
                            <div>
                                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">Client Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="clientName"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="projectManagerName" className="block text-sm font-medium text-gray-700 mb-1">Project Manager Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="projectManagerName"
                                    value={projectManagerName}
                                    onChange={(e) => setProjectManagerName(e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="deliveryManagerName" className="block text-sm font-medium text-gray-700 mb-1">Delivery Manager Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="deliveryManagerName"
                                    value={deliveryManagerName}
                                    onChange={(e) => setDeliveryManagerName(e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#F8FDFE] p-5 rounded-xl shadow-sm border border-[#EBF5F7]">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2 border-gray-200">Monthly Financials & Team</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label htmlFor="monthKey" className="block text-sm font-medium text-gray-700 mb-1">Month (YYYY-MM)</label>
                                <input
                                    type="month"
                                    id="monthKey"
                                    value={currentMonthKey}
                                    onChange={(e) => setCurrentMonthKey(e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="revenue" className="block text-sm font-medium text-gray-700 mb-1">Revenue</label>
                                <input
                                    type="number"
                                    id="revenue"
                                    value={currentRevenue}
                                    onChange={(e) => setCurrentRevenue(e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                                <input
                                    type="number"
                                    id="cost"
                                    value={currentCost}
                                    onChange={(e) => setCurrentCost(e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label htmlFor="resourceCount" className="block text-sm font-medium text-gray-700 mb-1">Resource count</label>
                                <input
                                    type="number"
                                    id="resourceCount"
                                    value={currentMembers}
                                    onChange={(e) => setCurrentMembers(e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label htmlFor="rpe" className="block text-sm font-medium text-gray-700 mb-1">RPE (Revenue Per Resource)</label>
                                <input
                                    type="text"
                                    id="rpe"
                                    value={currentRPE}
                                    readOnly
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="cpe" className="block text-sm font-medium text-gray-700 mb-1">CPE (Cost Per Resource)</label>
                                <input
                                    type="text"
                                    id="cpe"
                                    value={currentCPE}
                                    readOnly
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="gm" className="block text-sm font-medium text-gray-700 mb-1">GM% (Gross Margin %)</label>
                                <input
                                    type="text"
                                    id="gm"
                                    value={currentGM}
                                    readOnly
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddOrUpdateMonthlyData}
                                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                            >
                                {monthlyData[currentMonthKey] ? 'Update Monthly Data' : 'Add Monthly Data'}
                            </button>
                        </div>

                        {Object.keys(monthlyData).length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-base font-semibold text-gray-700 mb-3 border-b pb-1.5 border-gray-200">Recorded Monthly Data:</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {Object.entries(monthlyData)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([monthKey, data]) => (
                                        <div key={monthKey} className="bg-gray-100 p-2.5 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full sm:w-auto">
                                                <span className="font-semibold text-gray-800 text-sm mb-1 sm:mb-0">{monthKey}:</span>
                                                <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs sm:grid-cols-3 sm:gap-x-2 sm:gap-y-0">
                                                    <span className="text-gray-700"><strong className="text-gray-800">Rev:</strong> ${data.revenue.toFixed(2)}</span>
                                                    <span className="text-gray-700"><strong className="text-gray-800">Cost:</strong> ${data.cost.toFixed(2)}</span>
                                                    <span className="text-gray-700"><strong className="text-gray-800">Res:</strong> {data.members}</span>
                                                    <span className="text-gray-700"><strong className="text-gray-800">RPE:</strong> ${data.rpe ? data.rpe.toFixed(2) : 'N/A'}</span>
                                                    <span className="text-gray-700"><strong className="text-gray-800">CPE:</strong> ${data.cpe ? data.cpe.toFixed(2) : 'N/A'}</span>
                                                    <span className="text-gray-700"><strong className="text-gray-800">GM%:</strong> {data.gm ? data.gm.toFixed(2) : 'N/A'}%</span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 mt-3 sm:mt-0 sm:ml-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditMonthlyEntry(monthKey)}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMonthlyEntry(monthKey)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-center space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => { setCurrentView('list'); setEditingProject(null); }}
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-base"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (editingProject ? 'Update Project' : 'Add Project')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProjectForm;

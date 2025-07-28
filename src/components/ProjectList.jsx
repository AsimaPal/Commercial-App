import React, { useState, useEffect } from "react";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";

function ProjectList({
  db,
  userId,
  appId,
  setCurrentView,
  setEditingProject,
  showConfirmationModal,
  getLLMProjectInsights,
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterProjectName, setFilterProjectName] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterPM, setFilterPM] = useState("");
  const [filterDM, setFilterDM] = useState("");

  const [consolidatedStartMonth, setConsolidatedStartMonth] = useState("");
  const [consolidatedEndMonth, setConsolidatedEndMonth] = useState("");

  useEffect(() => {
    // We only need 'db' and 'appId' to be ready for fetching from the common collection.
    // 'userId' is used later for permission checks in rendering.
    if (!db || !appId) {
      // Removed userId from this check as it's not part of the read path
      console.log("Skipping project fetch: DB or App ID not ready.");
      return;
    }

    setLoading(true);
    setError("");

    // Query the common 'projects' collection: artifacts/{appId}/projects
    const projectsCollectionRef = collection(db, `artifacts/${appId}/projects`); // <-- UPDATED PATH

    const unsubscribe = onSnapshot(
      projectsCollectionRef,
      (snapshot) => {
        console.log(
          "onSnapshot fired for common projects collection. Docs changed:",
          snapshot.docChanges().length
        );
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(
          "Raw projects data from common collection snapshot:",
          projectsData
        );
        setProjects(projectsData);
        setLoading(false);
        console.log(
          "Projects state updated. Number of projects:",
          projectsData.length
        );
      },
      (err) => {
        console.error("Error fetching projects from common collection:", err);
        setError(
          "Failed to load projects. Please try again. Check Firestore rules."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup listener
  }, [db, appId]);

  // Log the raw projects state before filtering
  console.log("Projects state (raw):", projects);

  const filteredProjects = projects.filter((project) => {
    const matchesProjectName =
      filterProjectName === "" ||
      project.projectName
        .toLowerCase()
        .includes(filterProjectName.toLowerCase());
    const matchesClient =
      filterClient === "" ||
      project.clientName.toLowerCase().includes(filterClient.toLowerCase());
    const matchesPM =
      filterPM === "" ||
      project.projectManagerName.toLowerCase().includes(filterPM.toLowerCase());
    const matchesDM =
      filterDM === "" ||
      project.deliveryManagerName
        .toLowerCase()
        .includes(filterDM.toLowerCase());
    return matchesProjectName && matchesClient && matchesPM && matchesDM;
  });

  // Log the filtered projects AFTER the filtering is complete
  console.log("Filtered projects (after applying filters):", filteredProjects);

  const getConsolidatedData = (project) => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalMembers = 0;
    let monthsCount = 0;

    const start = consolidatedStartMonth
      ? new Date(consolidatedStartMonth + "-01")
      : null;
    const end = consolidatedEndMonth
      ? new Date(consolidatedEndMonth + "-01")
      : null;

    Object.entries(project.monthlyData || {}).forEach(([monthKey, data]) => {
      const monthDate = new Date(monthKey + "-01");
      if ((!start || monthDate >= start) && (!end || monthDate <= end)) {
        totalRevenue += data.revenue || 0;
        totalCost += data.cost || 0;
        totalMembers += data.members || 0;
        monthsCount++;
      }
    });

    const averageMembers = monthsCount > 0 ? totalMembers / monthsCount : 0;
    
    // Calculate RPE, CPE, and GM%
    const rpe = averageMembers > 0 ? totalRevenue / averageMembers : 0;
    const cpe = averageMembers > 0 ? totalCost / averageMembers : 0;
    const gm = totalRevenue !== 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalMembers,
      averageMembers,
      rpe,
      cpe,
      gm
    };
  };

  const overallConsolidated = filteredProjects.reduce(
    (acc, project) => {
      const projectData = getConsolidatedData(project);
      acc.totalRevenue += projectData.totalRevenue;
      acc.totalCost += projectData.totalCost;
      acc.totalMembers += projectData.totalMembers;
      return acc;
    },
    { totalRevenue: 0, totalCost: 0, totalMembers: 0 }
  );

  const totalProjectsCount = filteredProjects.length;
  const overallAverageResources =
    totalProjectsCount > 0
      ? overallConsolidated.totalMembers / totalProjectsCount
      : 0;

  const overallGrossMargin =
    overallConsolidated.totalRevenue !== 0
      ? ((overallConsolidated.totalRevenue - overallConsolidated.totalCost) /
          overallConsolidated.totalRevenue) *
        100
      : 0;

  const overallAverageRPE =
    overallConsolidated.totalMembers > 0
      ? overallConsolidated.totalRevenue / overallConsolidated.totalMembers
      : 0;
  const overallAverageCPE =
    overallConsolidated.totalMembers > 0
      ? overallConsolidated.totalCost / overallConsolidated.totalMembers
      : 0;

  const handleEditProject = (project) => {
    console.log("Edit button clicked for project:", project); // <--- ADDED LOG HERE

    setEditingProject(project);
    setCurrentView("form");
  };

  // Inside src/components/ProjectList.jsx
  const handleDeleteProject = async (projectToDelete) => {
    // Changed parameter to full project object
    showConfirmationModal(
      `Are you sure you want to delete project "${projectToDelete.projectName}"? This action cannot be undone.`,
      async () => {
        try {
          // Target the common projects collection
          const projectDocRef = doc(
            db,
            `artifacts/${appId}/projects`, // <-- UPDATED COMMON PATH
            projectToDelete.id
          );
          await deleteDoc(projectDocRef);
          console.log(`Project ${projectToDelete.id} deleted successfully.`);
        } catch (error) {
          console.error("Error deleting project:", error);
          setError(
            `Failed to delete project: ${error.message}. Ensure you have permissions.`
          );
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center bg-gray-50 rounded-xl">
        <div className="text-xl font-semibold text-gray-600">
          Loading projects...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">
        Project Dashboard
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
          <h3 className="text-base font-semibold text-gray-600 mb-1">
            Total Revenue
          </h3>
          <p className="text-2xl font-bold text-green-600">
            ${overallConsolidated.totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
          <h3 className="text-base font-semibold text-gray-600 mb-1">
            Total Cost
          </h3>
          <p className="text-2xl font-bold text-red-600">
            ${overallConsolidated.totalCost.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
          <h3 className="text-base font-semibold text-gray-600 mb-1">
            Avg. Resources
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {overallAverageResources.toFixed(1)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
          <h3 className="text-base font-semibold text-gray-600 mb-1">
            Gross Margin %
          </h3>
          <p
            className={`text-2xl font-bold ${
              overallGrossMargin >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {overallGrossMargin.toFixed(2)}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
          <h3 className="text-base font-semibold text-gray-600 mb-1">
            Avg. RPE
          </h3>
          <p className="text-2xl font-bold text-indigo-600">
            ${overallAverageRPE.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
          <h3 className="text-base font-semibold text-gray-600 mb-1">
            Avg. CPE
          </h3>
          <p className="text-2xl font-bold text-orange-600">
            ${overallAverageCPE.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-[#F8FDFE] p-5 rounded-xl shadow-sm mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 border border-[#EBF5F7]">
        <h3 className="col-span-full text-lg font-semibold text-gray-700 mb-2 border-b pb-2 border-gray-200">
          Filter Projects
        </h3>
        <div className="space-y-0.5">
          <label
            htmlFor="filterProjectName"
            className="block text-xs font-medium text-gray-700"
          >
            Project Name
          </label>
          <input
            type="text"
            id="filterProjectName"
            value={filterProjectName}
            onChange={(e) => setFilterProjectName(e.target.value)}
            className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
            placeholder="e.g., Project Alpha"
          />
        </div>
        <div className="space-y-0.5">
          <label
            htmlFor="filterClient"
            className="block text-xs font-medium text-gray-700"
          >
            Client Name
          </label>
          <input
            type="text"
            id="filterClient"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
            placeholder="e.g., Acme Corp"
          />
        </div>
        <div className="space-y-0.5">
          <label
            htmlFor="filterPM"
            className="block text-xs font-medium text-gray-700"
          >
            Project Manager
          </label>
          <input
            type="text"
            id="filterPM"
            value={filterPM}
            onChange={(e) => setFilterPM(e.target.value)}
            className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
            placeholder="e.g., Jane Doe"
          />
        </div>
        <div className="space-y-0.5">
          <label
            htmlFor="filterDM"
            className="block text-xs font-medium text-gray-700"
          >
            Delivery Manager
          </label>
          <input
            type="text"
            id="filterDM"
            value={filterDM}
            onChange={(e) => setFilterDM(e.target.value)}
            className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
            placeholder="e.g., John Smith"
          />
        </div>
        <div className="space-y-0.5">
          <label
            htmlFor="consolidatedStartMonth"
            className="block text-xs font-medium text-gray-700"
          >
            Consolidated View Start Month
          </label>
          <input
            type="month"
            id="consolidatedStartMonth"
            value={consolidatedStartMonth}
            onChange={(e) => setConsolidatedStartMonth(e.target.value)}
            className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
          />
        </div>
        <div className="space-y-0.5">
          <label
            htmlFor="consolidatedEndMonth"
            className="block text-xs font-medium text-gray-700"
          >
            Consolidated View End Month
          </label>
          <input
            type="month"
            id="consolidatedEndMonth"
            value={consolidatedEndMonth}
            onChange={(e) => setConsolidatedEndMonth(e.target.value)}
            className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
          />
        </div>
      </div>

       {filteredProjects.length === 0 ? (
        <div className="p-8 text-center text-gray-600 bg-white rounded-xl shadow-md border border-gray-100">
          <p className="text-xl font-medium">
            No projects found matching your criteria.
          </p>
          <p className="mt-2 text-md">
            Try adjusting your filters or add a new project!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Project Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Client
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Project Manager
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Delivery Manager
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Revenue
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Cost
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Avg. Resources
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  RPE
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  CPE
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  GM%
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((project) => {
                const consolidated = getConsolidatedData(project);
                return (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {project.projectName} <br />
                      <span className="text-gray-500 text-xs">
                        ({project.projectCode})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {project.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {project.projectManagerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {project.deliveryManagerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-semibold">
                      ${consolidated.totalRevenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-semibold">
                      ${consolidated.totalCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-800 font-semibold">
                      {consolidated.averageMembers.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-indigo-600 font-semibold">
                      ${consolidated.rpe.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-semibold">
                      ${consolidated.cpe.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                      consolidated.gm >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {consolidated.gm.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                        {/* <button
                          onClick={() => getLLMProjectInsights(project)}
                          className="px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200 text-xs shadow-sm"
                        >
                          Insights
                        </button> */}
                        <button
                          onClick={() => handleEditProject(project)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-xs shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-xs shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProjectList;

// import React, { useState, useEffect } from "react";
// import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";

// function ProjectList({
//   db,
//   userId,
//   appId,
//   setCurrentView,
//   setEditingProject,
//   showConfirmationModal,
//   getLLMProjectInsights,
// }) {
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [filterProjectName, setFilterProjectName] = useState("");
//   const [filterClient, setFilterClient] = useState("");
//   const [filterPM, setFilterPM] = useState("");
//   const [filterDM, setFilterDM] = useState("");

//   const [consolidatedStartMonth, setConsolidatedStartMonth] = useState("");
//   const [consolidatedEndMonth, setConsolidatedEndMonth] = useState("");

//   //const appId = "default-app-id"; // Placeholder, will be replaced by actual appId from App.jsx

//   useEffect(() => {
//     if (!db || !userId) return;
//     console.log("Skipping project fetch: DB, userId, or appId not ready.", {
//       db,
//       userId,
//       appId,
//     }); // <-- HERE

//     setLoading(true);
//     setError("");
//     console.log(
//       "Attempting to fetch projects for path:",
//       `artifacts/${appId}/users/${userId}/projects`
//     ); // <-- HERE

//     const projectsCollectionRef = collection(
//       db,
//       `artifacts/${appId}/users/${userId}/projects`
//     );
//     const unsubscribe = onSnapshot(
//       projectsCollectionRef,
//       (snapshot) => {
//         console.log(
//           "onSnapshot fired. Docs changed:",
//           snapshot.docChanges().length
//         ); // <-- HERE

//         const projectsData = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         console.log("Raw projects data from snapshot:", projectsData); // <-- HERE

//         setProjects(projectsData);
//         setLoading(false);
//         console.log(
//           "Projects state updated. Number of projects:",
//           projectsData.length
//         ); // <-- HERE
//       },
//       (err) => {
//         console.error("Error fetching projects:", err);
//         setError("Failed to load projects. Please try again.");
//         setLoading(false);
//       }
//     );

//     return () => unsubscribe();
//   }, [db, userId,appId]);

//   const filteredProjects = projects.filter((project) => {
//     // After the filteredProjects constant is defined, but before the return statement:
//     console.log("Projects state (raw):", projects); // <-- HERE
//     console.log(
//         filteredProjects,
//       "Filtered projects (after applying filters):",

//     ); // <-- HERE
//     const matchesProjectName =
//       filterProjectName === "" ||
//       project.projectName
//         .toLowerCase()
//         .includes(filterProjectName.toLowerCase());
//     const matchesClient =
//       filterClient === "" ||
//       project.clientName.toLowerCase().includes(filterClient.toLowerCase());
//     const matchesPM =
//       filterPM === "" ||
//       project.projectManagerName.toLowerCase().includes(filterPM.toLowerCase());
//     const matchesDM =
//       filterDM === "" ||
//       project.deliveryManagerName
//         .toLowerCase()
//         .includes(filterDM.toLowerCase());
//     return matchesProjectName && matchesClient && matchesPM && matchesDM;
//   });

//   const getConsolidatedData = (project) => {
//     let totalRevenue = 0;
//     let totalCost = 0;
//     let totalMembers = 0;
//     let monthsCount = 0;

//     const start = consolidatedStartMonth
//       ? new Date(consolidatedStartMonth + "-01")
//       : null;
//     const end = consolidatedEndMonth
//       ? new Date(consolidatedEndMonth + "-01")
//       : null;

//     Object.entries(project.monthlyData || {}).forEach(([monthKey, data]) => {
//       const monthDate = new Date(monthKey + "-01");
//       if ((!start || monthDate >= start) && (!end || monthDate <= end)) {
//         totalRevenue += data.revenue || 0;
//         totalCost += data.cost || 0;
//         totalMembers += data.members || 0;
//         monthsCount++;
//       }
//     });

//     return {
//       totalRevenue,
//       totalCost,
//       totalMembers,
//       averageMembers: monthsCount > 0 ? totalMembers / monthsCount : 0,
//     };
//   };

//   const overallConsolidated = filteredProjects.reduce(
//     (acc, project) => {
//       const projectData = getConsolidatedData(project);
//       acc.totalRevenue += projectData.totalRevenue;
//       acc.totalCost += projectData.totalCost;
//       acc.totalMembers += projectData.totalMembers;
//       return acc;
//     },
//     { totalRevenue: 0, totalCost: 0, totalMembers: 0 }
//   );

//   const totalProjectsCount = filteredProjects.length;
//   const overallAverageResources =
//     totalProjectsCount > 0
//       ? overallConsolidated.totalMembers / totalProjectsCount
//       : 0;

//   const overallGrossMargin =
//     overallConsolidated.totalRevenue !== 0
//       ? ((overallConsolidated.totalRevenue - overallConsolidated.totalCost) /
//           overallConsolidated.totalRevenue) *
//         100
//       : 0;

//   const overallAverageRPE =
//     overallConsolidated.totalMembers > 0
//       ? overallConsolidated.totalRevenue / overallConsolidated.totalMembers
//       : 0;
//   const overallAverageCPE =
//     overallConsolidated.totalMembers > 0
//       ? overallConsolidated.totalCost / overallConsolidated.totalMembers
//       : 0;

//   const handleEditProject = (project) => {
//     setEditingProject(project);
//     setCurrentView("form");
//   };

//   const handleDeleteProject = async (projectId) => {
//     showConfirmationModal(
//       "Are you sure you want to delete this project? This action cannot be undone.",
//       async () => {
//         try {
//           const projectDocRef = doc(
//             db,
//             `artifacts/${appId}/users/${userId}/projects`,
//             projectId
//           );
//           await deleteDoc(projectDocRef);
//         } catch (error) {
//           console.error("Error deleting project:", error);
//           setError(`Failed to delete project: ${error.message}`);
//         }
//       }
//     );
//   };

//   if (loading) {
//     return (
//       <div className="min-h-[300px] flex items-center justify-center bg-gray-50 rounded-xl">
//         <div className="text-xl font-semibold text-gray-600">
//           Loading projects...
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-4 bg-red-100 text-red-700 rounded-lg">
//         <p>{error}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="fade-in">
//       <h2 className="text-2xl font-bold text-blue-700 mb-6">
//         Project Dashboard
//       </h2>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
//         <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
//           <h3 className="text-base font-semibold text-gray-600 mb-1">
//             Total Revenue
//           </h3>
//           <p className="text-2xl font-bold text-green-600">
//             ${overallConsolidated.totalRevenue.toFixed(2)}
//           </p>
//         </div>
//         <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
//           <h3 className="text-base font-semibold text-gray-600 mb-1">
//             Total Cost
//           </h3>
//           <p className="text-2xl font-bold text-red-600">
//             ${overallConsolidated.totalCost.toFixed(2)}
//           </p>
//         </div>
//         <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
//           <h3 className="text-base font-semibold text-gray-600 mb-1">
//             Avg. Resources
//           </h3>
//           <p className="text-2xl font-bold text-blue-600">
//             {overallAverageResources.toFixed(1)}
//           </p>
//         </div>
//         <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
//           <h3 className="text-base font-semibold text-gray-600 mb-1">
//             Gross Margin %
//           </h3>
//           <p
//             className={`text-2xl font-bold ${
//               overallGrossMargin >= 0 ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {overallGrossMargin.toFixed(2)}%
//           </p>
//         </div>
//         <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
//           <h3 className="text-base font-semibold text-gray-600 mb-1">
//             Avg. RPE
//           </h3>
//           <p className="text-2xl font-bold text-indigo-600">
//             ${overallAverageRPE.toFixed(2)}
//           </p>
//         </div>
//         <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 text-center">
//           <h3 className="text-base font-semibold text-gray-600 mb-1">
//             Avg. CPE
//           </h3>
//           <p className="text-2xl font-bold text-orange-600">
//             ${overallAverageCPE.toFixed(2)}
//           </p>
//         </div>
//       </div>

//       <div className="bg-[#F8FDFE] p-5 rounded-xl shadow-sm mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 border border-[#EBF5F7]">
//         <h3 className="col-span-full text-lg font-semibold text-gray-700 mb-2 border-b pb-2 border-gray-200">
//           Filter Projects
//         </h3>
//         <div className="space-y-0.5">
//           <label
//             htmlFor="filterProjectName"
//             className="block text-xs font-medium text-gray-700"
//           >
//             Project Name
//           </label>
//           <input
//             type="text"
//             id="filterProjectName"
//             value={filterProjectName}
//             onChange={(e) => setFilterProjectName(e.target.value)}
//             className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
//             placeholder="e.g., Project Alpha"
//           />
//         </div>
//         <div className="space-y-0.5">
//           <label
//             htmlFor="filterClient"
//             className="block text-xs font-medium text-gray-700"
//           >
//             Client Name
//           </label>
//           <input
//             type="text"
//             id="filterClient"
//             value={filterClient}
//             onChange={(e) => setFilterClient(e.target.value)}
//             className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
//             placeholder="e.g., Acme Corp"
//           />
//         </div>
//         <div className="space-y-0.5">
//           <label
//             htmlFor="filterPM"
//             className="block text-xs font-medium text-gray-700"
//           >
//             Project Manager
//           </label>
//           <input
//             type="text"
//             id="filterPM"
//             value={filterPM}
//             onChange={(e) => setFilterPM(e.target.value)}
//             className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
//             placeholder="e.g., Jane Doe"
//           />
//         </div>
//         <div className="space-y-0.5">
//           <label
//             htmlFor="filterDM"
//             className="block text-xs font-medium text-gray-700"
//           >
//             Delivery Manager
//           </label>
//           <input
//             type="text"
//             id="filterDM"
//             value={filterDM}
//             onChange={(e) => setFilterDM(e.target.value)}
//             className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
//             placeholder="e.g., John Smith"
//           />
//         </div>
//         <div className="space-y-0.5">
//           <label
//             htmlFor="consolidatedStartMonth"
//             className="block text-xs font-medium text-gray-700"
//           >
//             Consolidated View Start Month
//           </label>
//           <input
//             type="month"
//             id="consolidatedStartMonth"
//             value={consolidatedStartMonth}
//             onChange={(e) => setConsolidatedStartMonth(e.target.value)}
//             className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
//           />
//         </div>
//         <div className="space-y-0.5">
//           <label
//             htmlFor="consolidatedEndMonth"
//             className="block text-xs font-medium text-gray-700"
//           >
//             Consolidated View End Month
//           </label>
//           <input
//             type="month"
//             id="consolidatedEndMonth"
//             value={consolidatedEndMonth}
//             onChange={(e) => setConsolidatedEndMonth(e.target.value)}
//             className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm"
//           />
//         </div>
//       </div>

//       {filteredProjects.length === 0 ? (
//         <div className="p-8 text-center text-gray-600 bg-white rounded-xl shadow-md border border-gray-100">
//           <p className="text-xl font-medium">
//             No projects found matching your criteria.
//           </p>
//           <p className="mt-2 text-md">
//             Try adjusting your filters or add a new project!
//           </p>
//         </div>
//       ) : (
//         <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-100">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                 >
//                   Project Name
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                 >
//                   Client
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                 >
//                   Project Manager
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                 >
//                   Delivery Manager
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
//                 >
//                   Revenue
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
//                 >
//                   Cost
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
//                 >
//                   Avg. Resources
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
//                 >
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredProjects.map((project) => {
//                 const consolidated = getConsolidatedData(project);
//                 return (
//                   <tr key={project.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                       {project.projectName} <br />
//                       <span className="text-gray-500 text-xs">
//                         ({project.projectCode})
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                       {project.clientName}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                       {project.projectManagerName}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                       {project.deliveryManagerName}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-semibold">
//                       ${consolidated.totalRevenue.toFixed(2)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-semibold">
//                       ${consolidated.totalCost.toFixed(2)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-800 font-semibold">
//                       {consolidated.averageMembers.toFixed(1)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                       <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2">
//                         <button
//                           onClick={() => getLLMProjectInsights(project)}
//                           className="px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200 text-xs shadow-sm"
//                         >
//                           Insights
//                         </button>
//                         <button
//                           onClick={() => handleEditProject(project)}
//                           className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-xs shadow-sm"
//                         >
//                           Edit
//                         </button>
//                         <button
//                           onClick={() => handleDeleteProject(project.id)}
//                           className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-xs shadow-sm"
//                         >
//                           Delete
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ProjectList;

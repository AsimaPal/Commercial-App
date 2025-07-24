import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import './index.css';


// Import your new components
import AppHeader from './components/AppHeader';
import AppNavigation from './components/AppNavigation';
import ConfirmationModal from './components/ConfirmationModal';
import InsightsModal from './components/InsightsModal';
import LoadingSpinner from './components/LoadingSpinner';
import ProjectForm from './components/ProjectForm';
import ProjectList from './components/ProjectList';

// Global variables for Firebase config and app ID (provided by the Canvas environment)
// IMPORTANT: Replace these with your actual Firebase project details for deployment
// Your actual Firebase configuration from the Firebase Console
// const firebaseConfig = {
//   apiKey: "AIzaSyDWuYvWTAP5N3oe92Lxy1IXNxv0y1b24nQ",
//   authDomain: "commercial-application-9c712.firebaseapp.com",
//   projectId: "commercial-application-9c712",
//   storageBucket: "commercial-application-9c712.firebasestorage.app",
//   messagingSenderId: "297572579265",
//   appId: "1:297572579265:web:0c2da20f08d965e7fb2140",
//   measurementId: "G-SNP5Z3LKH2"
// };
// Global variables for Firebase config and app ID (provided by the Canvas environment)
// IMPORTANT: For local VS Code development, you will replace these with your actual Firebase project details.
// You need to REPLACE these three lines:
// const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // This will be your Firebase Project ID
// const rawFirebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
// const firebaseConfig = rawFirebaseConfig || {}; // Your actual Firebase config object goes here for deployment

// WITH these lines, using your actual config:
const firebaseConfig = {
  apiKey: "AIzaSyC2aSLBrGJaFMA0RB__s_e3BFZvsJZ6R_U",
  authDomain: "dts-commercial-tracker.firebaseapp.com",
  projectId: "dts-commercial-tracker", // THIS IS YOUR FIREBASE PROJECT ID
  storageBucket: "dts-commercial-tracker.firebasestorage.app",
  messagingSenderId: "488145931209",
  appId: "1:488145931209:web:4675d664fb968e30f5f618", // This is your Web App's specific ID
  measurementId: "G-ZEEL4P82N1"
};

// This line is CRUCIAL for Firestore pathing. It ensures 'appId' uses your project ID.
const appId = firebaseConfig.projectId; // <-- This will set appId to "dts-commercial-tracker"

// Keep this line as is, as it's for the Canvas environment's auth token
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Utility function for generating a simple ID (to avoid crypto module issues)
function generateSimpleId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function App() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentView, setCurrentView] = useState('list');
    const [editingProject, setEditingProject] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalAction, setModalAction] = useState(null);

    const [showInsightsModal, setShowInsightsModal] = useState(false);
    const [projectInsights, setProjectInsights] = useState('');
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [insightsError, setInsightsError] = useState('');

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authInstance = getAuth(app);
            setDb(firestore);
            setAuth(authInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    console.log("Firebase authenticated. User ID:", user.uid); // <-- HERE

                } else {
                        console.log("Signed in with custom token."); // <-- HERE
                            console.log("Signed in anonymously."); // <-- HERE
                                console.log("Using fallback user ID: temp-local-user-id"); // <-- HERE



                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(authInstance, initialAuthToken);
                        } else {
                            await signInAnonymously(authInstance);
                        }
                    } catch (error) {
                        console.error("Firebase authentication error:", error);
                        // Fallback to a simple ID if anonymous sign-in fails or crypto is problematic
                        setUserId(generateSimpleId());
                    }
                }
                setIsAuthReady(true);
                console.log("Firebase auth state ready."); // <-- HERE

            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Failed to initialize Firebase:", error);
            setIsAuthReady(true);
        }
    }, []);

    const showConfirmationModal = (message, onConfirm) => {
        setModalMessage(message);
        setModalAction(() => onConfirm);
        setShowModal(true);
    };

    const handleModalConfirm = () => {
        if (modalAction) {
            modalAction();
        }
        setShowModal(false);
        setModalAction(null);
        setModalMessage('');
    };

    const handleModalCancel = () => {
        setShowModal(false);
        setModalAction(null);
        setModalMessage('');
    };

    const getLLMProjectInsights = async (project) => {
        setInsightsLoading(true);
        setInsightsError('');
        setProjectInsights('');
        setShowInsightsModal(true);

        let prompt = `Analyze the following project data and provide a concise summary of its financial performance and resource efficiency. Highlight any notable trends (positive or negative) in revenue, cost, resource count, Revenue Per Employee (RPE), Cost Per Employee (CPE), and Gross Margin (GM%). If there are specific months with significant changes, mention them.

Project Name: ${project.projectName}
Project Code: ${project.projectCode}
Project Description: ${project.projectDescription || 'No description provided.'}
Client: ${project.clientName}
Project Manager: ${project.projectManagerName}
Delivery Manager: ${project.deliveryManagerName}

Monthly Data (YYYY-MM, Revenue, Cost, Resources, RPE, CPE, GM%):
`;

        if (Object.keys(project.monthlyData).length > 0) {
            Object.entries(project.monthlyData)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([monthKey, data]) => {
                    prompt += `${monthKey}, Rev: $${data.revenue.toFixed(2)}, Cost: $${data.cost.toFixed(2)}, Res: ${data.members}, RPE: $${data.rpe ? data.rpe.toFixed(2) : 'N/A'}, CPE: $${data.cpe ? data.cpe.toFixed(2) : 'N/A'}, GM%: ${data.gm ? data.gm.toFixed(2) : 'N/A'}%\n`;
                });
        } else {
            prompt += "No monthly data available for this project.\n";
        }

        prompt += "\nProvide your analysis in a clear, professional, and actionable paragraph.";

        try {
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = { contents: chatHistory };
            const apiKey = ""; // Canvas will provide this at runtime
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${errorData.error.message || response.statusText}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setProjectInsights(text);
            } else {
                setInsightsError("Could not generate insights. Unexpected API response structure.");
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setInsightsError(`Failed to generate insights: ${error.message}`);
        } finally {
            setInsightsLoading(false);
        }
    };

    if (!isAuthReady) {
        return <LoadingSpinner />;
    }

    return (
        
        <div className="min-h-screen bg-[#F0F8FF] font-sans text-gray-800 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-2xl p-6 md:p-10 border border-gray-100 relative">
                <AppHeader />
                <p className="text-gray-600 text-lg text-center mb-8">Streamline your project financials and team management.</p>
                <AppNavigation
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    setEditingProject={setEditingProject}
                />

                {currentView === 'list' && db && userId && (
                    <ProjectList
                        db={db}
                        userId={userId}
                        appId={appId}
                        setCurrentView={setCurrentView}
                        setEditingProject={setEditingProject}
                        showConfirmationModal={showConfirmationModal}
                        getLLMProjectInsights={getLLMProjectInsights}
                    />
                )}

                {currentView === 'form' && db && userId && (
                    <ProjectForm
                        db={db}
                        userId={userId}
                        appId={appId}
                        setCurrentView={setCurrentView}
                        editingProject={editingProject}
                        setEditingProject={setEditingProject}
                    />
                )}
                
            </div>

            <ConfirmationModal
                show={showModal}
                message={modalMessage}
                onConfirm={handleModalConfirm}
                onCancel={handleModalCancel}
            />

            <InsightsModal
                show={showInsightsModal}
                projectInsights={projectInsights}
                insightsLoading={insightsLoading}
                insightsError={insightsError}
                onClose={() => { setShowInsightsModal(false); setProjectInsights(''); setInsightsError(''); }}
            />
        </div>
    );
}

export default App;

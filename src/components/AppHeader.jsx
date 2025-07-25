// import React from 'react';
// import './AppHeader.css'

// function AppHeader() {
//     return (
//         <header className="app-header flex justify-between items-center">
//             <div className="logo-container">
//                 <img
//                     src="uploaded:16516385797579520183_Experion_new (1).png-0a790551-2163-4bf1-8cdb-c90d8f5b8086"
//                     alt="Experion Logo"
//                     onError={(e) => {
//                         e.target.onerror = null;
//                         e.target.src = "https://placehold.co/120x50/E0F2F7/2C5282?text=Logo";
//                     }}
//                 />
//             </div>

//             <h1 className="header-title">
//                 Dts Commercial Tracker
//             </h1>

//             <div className="user-avatar">
//                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
//                     <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0a4.5 4.5 0 0 1 -9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1 -.437 .695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1 -.438-.695Z" clipRule="evenodd" />
//                 </svg>
//             </div>
//         </header>
//     );
// }

// export default AppHeader;

import React from "react";
import experionLogo from '../assets/Experion.png';
function AppHeader() {
  return (
    <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
      <div className="flex items-center">
        <img
          src={experionLogo}
          alt="Experion Logo"
          className="h-13 w-auto rounded-md"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://placehold.co/100x40/E0F2F7/2C5282?text=Logo";
          }}
        />
      </div>
      <h1 className="text-xl sm:text-2xl font-extrabold text-blue-800 drop-shadow-sm text-center flex-grow whitespace-nowrap overflow-hidden text-ellipsis px-4">
        Project Revenue Tracker
      </h1>
      <div className="flex items-center">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M7.5 6a4.5 4.5 0 1 1 9 0a4.5 4.5 0 0 1 -9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1 -.437 .695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1 -.438-.695Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;

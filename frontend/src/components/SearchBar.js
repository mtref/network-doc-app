// frontend/src/components/SearchBar.js
// This component provides a search input field for filtering connections.

import React from 'react';

function SearchBar({ searchTerm, onSearchChange }) {
  return (
    <div className="relative rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      <input
        type="text"
        className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        placeholder="Search connections (PC, Patch Panel, Server names or ports...)"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search connections"
      />
    </div>
  );
}

export default SearchBar;

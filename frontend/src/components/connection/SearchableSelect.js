// /frontend/src/components/connection/SearchableSelect.js
// A reusable dropdown component with a built-in search filter.

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export const SearchableSelect = ({ options, value, onChange, placeholder = "Select an option" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  const selectedOption = options.find(option => String(option.id) === String(value));

  // Effect to handle clicks outside the component to close the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.ip_address || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionId) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        className="w-full p-2 border border-gray-300 rounded-md bg-white text-left flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
          {selectedOption ? `${selectedOption.name} (${selectedOption.ip_address || "No IP"})` : placeholder}
        </span>
        <ChevronDown size={20} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="relative p-2 border-b">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-2 pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
             {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                    <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
            )}
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.id}
                  className={`p-2 cursor-pointer hover:bg-blue-50 ${String(value) === String(option.id) ? 'bg-blue-100' : ''}`}
                  onClick={() => handleSelect(String(option.id))}
                >
                  {option.name} ({option.ip_address || "No IP"})
                  <span className="text-xs text-gray-500 ml-2">
                    {option.multi_port ? "(Multi-Port)" : "(Single-Port)"}
                  </span>
                </li>
              ))
            ) : (
              <li className="p-2 text-gray-500 text-center">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

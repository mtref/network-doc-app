// frontend/src/components/PrintableConnectionForm.js
// This component renders a static, print-friendly version of the connection form
// with empty fields for manual filling and enhanced UI.

import React from "react";

function PrintableConnectionForm() {
  // Removed props as it's now static
  return (
    // Apply overall font and spacing classes to the main container
    <div className="p-8 bg-white text-gray-800 font-inter">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-800 mb-2">
          Network Connection Form
        </h1>
        <p className="text-lg text-gray-600">
          Fill out the details for your network connections.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Date: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-8">
        {/* PC Details Section */}
        <section className="p-6 border border-indigo-300 rounded-lg bg-indigo-50">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">
            PC Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                PC Name:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                IP Address:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Username:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                In Domain:
              </label>
              <div className="flex items-center p-2">
                <input type="checkbox" className="h-4 w-4 mr-2" /> Yes
                <input type="checkbox" className="h-4 w-4 ml-4 mr-2" /> No
              </div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Operating System:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Ports Name:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              {" "}
              {/* New field: Office */}
              <label className="block font-medium text-gray-700">Office:</label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block font-medium text-gray-700">
                Description:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-20"></div>
            </div>
          </div>
        </section>

        {/* Patch Panel Hops Section */}
        <section className="p-6 border border-green-300 rounded-lg bg-green-50">
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            Patch Panel Hops
          </h2>
          {/* Render 3 hops, 2 in first row, 1 in second */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map(
              (
                hopIndex // First row with 2 hops
              ) => (
                <div
                  key={hopIndex}
                  className="p-4 border border-gray-200 rounded-md bg-white shadow-sm space-y-2"
                >
                  <h3 className="text-lg font-semibold text-gray-700">
                    Patch Panel Hop {hopIndex + 1}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block font-medium text-gray-700">
                        Patch Panel Name:
                      </label>
                      <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">
                        Port:
                      </label>
                      <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">
                        Port Status:
                      </label>
                      <div className="flex items-center p-2">
                        <input type="checkbox" className="h-4 w-4 mr-2" /> Up
                        <input
                          type="checkbox"
                          className="h-4 w-4 ml-4 mr-2"
                        />{" "}
                        Down
                      </div>
                    </div>
                    <div>
                      {" "}
                      {/* New field: Location for Patch Panel Hop */}
                      <label className="block font-medium text-gray-700">
                        Location:
                      </label>
                      <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
          {/* Third hop in its own row (or could be in a new grid row if more hops are added later) */}
          <div className="grid grid-cols-1 gap-4 mt-4">
            {" "}
            {/* New grid for the third hop */}
            <div
              key={2}
              className="p-4 border border-gray-200 rounded-md bg-white shadow-sm space-y-2"
            >
              <h3 className="text-lg font-semibold text-gray-700">
                Patch Panel Hop 3
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="block font-medium text-gray-700">
                    Patch Panel Name:
                  </label>
                  <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">
                    Port:
                  </label>
                  <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">
                    Port Status:
                  </label>
                  <div className="flex items-center p-2">
                    <input type="checkbox" className="h-4 w-4 mr-2" /> Up
                    <input type="checkbox" className="h-4 w-4 ml-4 mr-2" /> Down
                  </div>
                </div>
                <div>
                  {" "}
                  {/* New field: Location for Patch Panel Hop */}
                  <label className="block font-medium text-gray-700">
                    Location:
                  </label>
                  <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Switch Details Section */}
        <section className="p-6 border border-red-300 rounded-lg bg-red-50">
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            Switch Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Switch Name:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Switch Port:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Switch Port Status:
              </label>
              <div className="flex items-center p-2">
                <input type="checkbox" className="h-4 w-4 mr-2" /> Up
                <input type="checkbox" className="h-4 w-4 ml-4 mr-2" /> Down
              </div>
            </div>
            <div className="space-y-2">
              {" "}
              {/* New field: Location for Switch */}
              <label className="block font-medium text-gray-700">
                Location:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PrintableConnectionForm;

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
                Type:
              </label> {/* New field: Type */}
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Usage:
              </label> {/* New field: Usage */}
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Operating System:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Model:
              </label> {/* Renamed from Ports Name */}
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
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

        {/* Connection Cable Details Section (for direct Switch connection) */}
        <section className="p-6 border border-blue-300 rounded-lg bg-blue-50">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">
            Connection Cable Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Cable Color:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Cable Label:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
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
            {[0, 1, 2].map( // Render 3 hops
              (
                hopIndex // First row with 2 hops, third in next row
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
                    <div className="space-y-2">
                      <label className="block font-medium text-gray-700">
                        Cable Color:
                      </label> {/* New field */}
                      <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                    </div>
                    <div className="space-y-2">
                      <label className="block font-medium text-gray-700">
                        Cable Label:
                      </label> {/* New field */}
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
                      {/* New field: Location for Patch Panel Hop including door number */}
                      <label className="block font-medium text-gray-700">
                        Location:
                      </label>
                      <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                      <label className="block text-sm text-gray-600 mt-1">
                        (Door Number:
                        <div className="inline-block border-b border-dashed border-gray-400 w-12 ml-1"></div>
                        )
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="block font-medium text-gray-700">
                        Row in Rack:
                      </label>
                      <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                    </div>
                    <div className="space-y-2">
                      <label className="block font-medium text-gray-700">
                        Rack Name:
                      </label>
                      <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                    </div>
                    <div className="space-y-2">
                      <label className="block font-medium text-gray-700">
                        Description:
                      </label>
                      <div className="p-2 border border-gray-300 rounded-md bg-white h-20"></div>
                    </div>
                  </div>
                </div>
              )
            )}
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
              {/* New field: Location for Switch including door number */}
              <label className="block font-medium text-gray-700">
                Location:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
              <label className="block text-sm text-gray-600 mt-1">
                (Door Number:
                <div className="inline-block border-b border-dashed border-gray-400 w-12 ml-1"></div>
                )
              </label>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Row in Rack:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Rack Name:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Source Port:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">Model:</label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Usage:
              </label> {/* New field: Usage */}
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
      </div>
    </div>
  );
}

export default PrintableConnectionForm;
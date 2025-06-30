// frontend/src/components/PrintableConnectionForm.js
// This component renders a static, print-friendly version of the connection form
// with empty fields for manual filling. It does not rely on dynamic data.

import React from "react";
// No need for lucide-react icons in a purely static print form, removed for minimal payload
// import { Laptop, Split, Server, MapPin, User, Monitor, Columns, Link, Info, HardDrive, Router } from 'lucide-react';

function PrintableConnectionForm() {
  // Removed props as it's now static
  return (
    <div className="p-8 bg-white">
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
        {/* Connection Details Section */}
        <section className="p-6 border border-blue-300 rounded-lg bg-blue-50">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">
            Connection Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PC Name:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Switch Name:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Switch Port:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Switch Port Status:
              </label>
              <div className="flex items-center p-2">
                <input type="checkbox" className="h-4 w-4 mr-2" /> Up
                <input type="checkbox" className="h-4 w-4 ml-4 mr-2" /> Down
              </div>
            </div>
          </div>
        </section>

        {/* Patch Panel Hops Section */}
        <section className="p-6 border border-green-300 rounded-lg bg-green-50">
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            Patch Panel Hops (Max 3 for form example)
          </h2>
          {[0, 1, 2].map((hopIndex) => (
            <div
              key={hopIndex}
              className="mb-4 p-4 border border-gray-200 rounded-md bg-white shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Patch Panel Hop {hopIndex + 1}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patch Panel Name:
                  </label>
                  <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port:
                  </label>
                  <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port Status:
                  </label>
                  <div className="flex items-center p-2">
                    <input type="checkbox" className="h-4 w-4 mr-2" /> Up
                    <input type="checkbox" className="h-4 w-4 ml-4 mr-2" /> Down
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* PC Details Section */}
        <section className="p-6 border border-indigo-300 rounded-lg bg-indigo-50">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">
            PC Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PC Name:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IP Address:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                In Domain:
              </label>
              <div className="flex items-center p-2">
                <input type="checkbox" className="h-4 w-4 mr-2" /> Yes
                <input type="checkbox" className="h-4 w-4 ml-4 mr-2" /> No
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operating System:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ports Name:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-20"></div>
            </div>
          </div>
        </section>

        {/* Switch Details Section */}
        <section className="p-6 border border-red-300 rounded-lg bg-red-50">
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            Switch Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Switch Name:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IP Address:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Row in Rack:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rack Name:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Ports:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Port:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-white h-10"></div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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

import React from 'react';

const ProjectManagement = ({ organizationSlug }) => {
  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Project Management
        </h1>
        <p className="text-gray-600">
          Welcome to Project Management! This tool is under development.
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Organization:</strong> {organizationSlug}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagement;

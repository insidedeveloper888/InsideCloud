/**
 * Utility to clear all project data for an organization
 * USE WITH CAUTION - This is for testing only
 */

const API_BASE = '/api';

export async function clearAllProjectData(organizationSlug) {
  // eslint-disable-next-line no-restricted-globals
  if (!confirm('⚠️ This will DELETE ALL projects and templates for this organization. Are you sure?')) {
    return { cancelled: true };
  }

  const results = {
    projectsDeleted: 0,
    templatesDeleted: 0,
    errors: [],
  };

  try {
    // Get all projects
    const projectsRes = await fetch(`${API_BASE}/projects?organization_slug=${organizationSlug}`);
    if (projectsRes.ok) {
      const projects = await projectsRes.json();

      // Delete all projects
      for (const project of projects) {
        try {
          const deleteRes = await fetch(
            `${API_BASE}/projects/${project.id}?organization_slug=${organizationSlug}`,
            { method: 'DELETE' }
          );
          if (deleteRes.ok) {
            results.projectsDeleted++;
          } else {
            results.errors.push(`Failed to delete project: ${project.name}`);
          }
        } catch (err) {
          results.errors.push(`Error deleting project ${project.name}: ${err.message}`);
        }
      }
    }

    // Get all templates
    const templatesRes = await fetch(`${API_BASE}/project-templates?organization_slug=${organizationSlug}`);
    if (templatesRes.ok) {
      const templates = await templatesRes.json();

      // Delete all templates
      for (const template of templates) {
        try {
          const deleteRes = await fetch(
            `${API_BASE}/project-templates/${template.id}?organization_slug=${organizationSlug}`,
            { method: 'DELETE' }
          );
          if (deleteRes.ok) {
            results.templatesDeleted++;
          } else {
            results.errors.push(`Failed to delete template: ${template.name}`);
          }
        } catch (err) {
          results.errors.push(`Error deleting template ${template.name}: ${err.message}`);
        }
      }
    }

    console.log('✅ Clear project data results:', results);
    // eslint-disable-next-line no-restricted-globals
    alert(
      `Cleared:\n- ${results.projectsDeleted} projects\n- ${results.templatesDeleted} templates` +
      (results.errors.length > 0 ? `\n\nErrors:\n${results.errors.join('\n')}` : '')
    );

    return results;
  } catch (err) {
    console.error('Error clearing project data:', err);
    // eslint-disable-next-line no-restricted-globals
    alert('Error clearing data: ' + err.message);
    return { ...results, error: err.message };
  }
}

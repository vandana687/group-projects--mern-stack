const Project = require('../models/Project');

// Check if user has permission to perform action on project
const checkProjectPermission = (requiredRole = null) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.project;
      
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required'
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user is owner
      if (project.owner.toString() === req.user._id.toString()) {
        req.project = project;
        req.userRole = 'Admin';
        return next();
      }

      // Check if user is a member
      const membership = project.members.find(
        m => m.user.toString() === req.user._id.toString()
      );

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this project'
        });
      }

      // Check role permissions if required
      if (requiredRole) {
        const roleHierarchy = {
          'Admin': 3,
          'Project Manager': 2,
          'Team Member': 1
        };

        const userRoleLevel = roleHierarchy[membership.role] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

        if (userRoleLevel < requiredRoleLevel) {
          return res.status(403).json({
            success: false,
            message: `This action requires ${requiredRole} role or higher`
          });
        }
      }

      req.project = project;
      req.userRole = membership.role;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

module.exports = { checkProjectPermission };

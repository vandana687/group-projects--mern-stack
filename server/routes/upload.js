const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'project-management/task-files',
    resource_type: 'auto', // Handle all file types
    allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif']
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
  const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not allowed. Allowed types: images, PDF, documents, archives'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// @route   POST /api/upload/task/:taskId
// @desc    Upload file to a task
// @access  Private
router.post('/task/:taskId', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      // Delete uploaded file if task not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const fileData = {
      filename: req.file.originalname,
      url: req.file.path, // Cloudinary URL
      cloudinaryPublicId: req.file.filename, // For deletion
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    task.attachments.push(fileData);
    await task.save();

    // Create activity
    await Activity.create({
      project: task.project,
      user: req.user._id,
      action: 'file_uploaded',
      entity: {
        entityType: 'Task',
        entityId: task._id
      },
      details: {
        taskTitle: task.title,
        filename: req.file.originalname
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(task.project.toString(), 'file_uploaded', {
      taskId: task._id,
      file: fileData,
      user: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileData
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    // Delete file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading file'
    });
  }
});

// @route   DELETE /api/upload/task/:taskId/file/:filename
// @desc    Delete file from task
// @access  Private
router.delete('/task/:taskId/file/:filename', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const attachment = task.attachments.find(att => att.filename === decodeURIComponent(req.params.filename));

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Only uploader can delete the file
    if (attachment.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete files you uploaded'
      });
    }

    // Delete from Cloudinary if public_id exists
    if (attachment.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(attachment.cloudinaryPublicId);
      } catch (err) {
        console.error('Cloudinary delete error:', err);
        // Continue even if Cloudinary deletion fails
      }
    }

    // Remove from task
    task.attachments = task.attachments.filter(att => att.filename !== attachment.filename);
    await task.save();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
});

// @route   POST /api/upload/task/:taskId/link
// @desc    Add a link to a task
// @access  Private
router.post('/task/:taskId/link', auth, async (req, res) => {
  try {
    const { url, title } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const linkData = {
      type: 'link',
      url: url,
      title: title || url,
      filename: title || url,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    task.attachments.push(linkData);
    await task.save();

    // Create activity
    await Activity.create({
      project: task.project,
      user: req.user._id,
      action: 'file_uploaded',
      entity: {
        entityType: 'Task',
        entityId: task._id
      },
      details: {
        taskTitle: task.title,
        filename: `Link: ${title || url}`
      }
    });

    res.json({
      success: true,
      message: 'Link added successfully',
      link: linkData
    });
  } catch (error) {
    console.error('Link add error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding link'
    });
  }
});

// @route   DELETE /api/upload/task/:taskId/link/:linkId
// @desc    Remove a link from task
// @access  Private
router.delete('/task/:taskId/link/:linkId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const linkIndex = task.attachments.findIndex(
      att => att._id && att._id.toString() === req.params.linkId
    );

    if (linkIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }

    // Only uploader can delete the link
    if (task.attachments[linkIndex].uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete links you added'
      });
    }

    // Remove link
    task.attachments.splice(linkIndex, 1);
    await task.save();

    res.json({
      success: true,
      message: 'Link removed successfully'
    });
  } catch (error) {
    console.error('Link delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing link'
    });
  }
});

module.exports = router;

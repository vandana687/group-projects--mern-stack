const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
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
      url: `/uploads/${req.file.filename}`,
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

    const attachment = task.attachments.find(
      att => att.url === `/uploads/${req.params.filename}`
    );

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

    // Remove from task
    task.attachments = task.attachments.filter(
      att => att.url !== `/uploads/${req.params.filename}`
    );
    await task.save();

    // Delete physical file
    const filePath = path.join(__dirname, '../../uploads', req.params.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

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

// Serve uploaded files
router.use('/files', express.static(path.join(__dirname, '../../uploads')));

module.exports = router;

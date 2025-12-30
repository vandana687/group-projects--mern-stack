import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../api/axios';
import './TimeTracker.css';

const TimeTracker = ({ task, onClose }) => {
  const [timeLogs, setTimeLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch existing time logs
  useEffect(() => {
    fetchTimeLogs();
  }, [task._id]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning && activeTimer) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeTimer]);

  const fetchTimeLogs = async () => {
    try {
      const res = await API.get(`/time-logs/task/${task._id}`);
      const logs = res.data.timeLogs || [];
      setTimeLogs(logs);
      // Detect active timer using backend flag
      const running = logs.find(l => l.isRunning === true);
      if (running) {
        setActiveTimer(running);
        setIsRunning(true);
        const startMs = new Date(running.startTime).getTime();
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
      } else {
        setIsRunning(false);
        setActiveTimer(null);
        setElapsedSeconds(0);
      }
    } catch (err) {
      console.error('Failed to fetch time logs:', err);
    }
  };

  const handleStartTimer = async () => {
    setLoading(true);
    try {
      const res = await API.post('/time-logs/start', {
        task: task._id,
        description: description || 'Working on task'
      });
      setActiveTimer(res.data.timeLog);
      setIsRunning(true);
      setElapsedSeconds(0);
      toast.success('Timer started!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start timer');
    } finally {
      setLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    setLoading(true);
    try {
      const res = await API.put(`/time-logs/${activeTimer._id}/stop`);
      setIsRunning(false);
      setActiveTimer(null);
      setElapsedSeconds(0);
      setDescription('');
      toast.success(`Logged ${res.data.timeLog.duration?.toFixed(2)} hours!`);
      fetchTimeLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to stop timer');
    } finally {
      setLoading(false);
    }
  };

  const formatSeconds = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const totalHours = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

  return (
    <div className="time-tracker">
      <div className="tracker-header">
        <h4>⏱️ Time Tracker: {task.title}</h4>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>

      {/* Active Timer */}
      <div className="timer-section">
        {isRunning && activeTimer ? (
          <div className="timer-display">
            <div className="timer-value">{formatSeconds(elapsedSeconds)}</div>
            <p className="timer-label">{activeTimer.description}</p>
            <button
              className="btn-stop"
              onClick={handleStopTimer}
              disabled={loading}
            >
              ⏹️ Stop Timer
            </button>
          </div>
        ) : (
          <div className="timer-start">
            <input
              type="text"
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
            <button
              className="btn-start"
              onClick={handleStartTimer}
              disabled={loading}
            >
              ▶️ Start Timer
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="timer-summary">
        <div className="summary-stat">
          <span className="summary-label">Total Time</span>
          <span className="summary-value">{formatDuration(totalHours)}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">Sessions</span>
          <span className="summary-value">{timeLogs.length}</span>
        </div>
        {task.estimatedHours > 0 && (
          <div className="summary-stat">
            <span className="summary-label">Estimated</span>
            <span className="summary-value">{task.estimatedHours}h</span>
          </div>
        )}
      </div>

      {/* Time Logs History */}
      <div className="time-logs-history">
        <h5>Time Log History</h5>
        {timeLogs.length === 0 ? (
          <p className="no-logs">No time logs yet</p>
        ) : (
          <div className="logs-list">
            {timeLogs.map((log, idx) => (
              <div key={log._id || idx} className="log-item">
                <div className="log-info">
                  <span className="log-duration">{formatDuration(log.duration || 0)}</span>
                  <span className="log-description">{log.description}</span>
                </div>
                <span className="log-date">
                  {new Date(log.startTime).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTracker;

import React, { useEffect, useState, useRef } from 'react';
import { fetchRiskTrajectory } from '../services/api';
import type { RiskSnapshot } from '../types/project';

interface RiskTrajectoryProps {
  projectId: string;
}

export const RiskTrajectory: React.FC<RiskTrajectoryProps> = ({ projectId }) => {
  const [trajectory, setTrajectory] = useState<RiskSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchRiskTrajectory(projectId)
      .then(res => setTrajectory(res.trajectory))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!canvasRef.current || trajectory.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (trajectory.length < 2) {
      ctx.fillStyle = '#888';
      ctx.font = '12px Inter';
      ctx.fillText('Insufficient data for trajectory', width/2 - 70, height/2);
      return;
    }
    
    const maxScore = 100;
    const points = trajectory.map((snap, i) => {
      const x = (i / (trajectory.length - 1)) * (width - 20) + 10;
      const y = height - (snap.risk_score / maxScore) * (height - 20) - 10;
      return { x, y, snap };
    });
    
    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(163, 113, 247, 0.2)'); // theme purple
    gradient.addColorStop(1, 'rgba(163, 113, 247, 0)');
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, height);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length-1].x, height);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#a371f7';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw points & change point markers
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.snap.is_change_point ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = p.snap.is_change_point ? '#ff4d4f' : '#1e1e2d';
      ctx.fill();
      ctx.strokeStyle = p.snap.is_change_point ? '#ff4d4f' : '#a371f7';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
  }, [trajectory]);

  if (loading) return <div className="trajectory-loading">Loading temporal data...</div>;

  const currentScore = trajectory.length > 0 ? trajectory[trajectory.length - 1].risk_score : 0;
  const initialScore = trajectory.length > 0 ? trajectory[0].risk_score : 0;
  const overallDelta = currentScore - initialScore;

  return (
    <div className="risk-trajectory-container">
      <div className="trajectory-header">
        <h4>Temporal Risk Trajectory</h4>
        <div className="trajectory-stats">
          <span className="stat-label">Overall Change:</span>
          <span className={`stat-value ${overallDelta > 0 ? 'trend-up' : overallDelta < 0 ? 'trend-down' : ''}`}>
            {overallDelta > 0 ? '+' : ''}{overallDelta.toFixed(1)}
          </span>
        </div>
      </div>
      
      <div className="trajectory-chart">
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={80} 
          className="trajectory-canvas"
        />
        {trajectory.length >= 2 && (
          <div className="trajectory-axis-labels">
            <span>First Scan</span>
            <span>Latest</span>
          </div>
        )}
      </div>
      
      {trajectory.some(t => t.is_change_point) && (
        <div className="trajectory-alert">
          ⚠️ <strong>Sudden Risk Spike Detected:</strong> Project exhibited an uncharacteristic jump in risk score between consecutive scans.
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
// --- VIBRANT CSS ENGINE IMPORT LINK ---
import '../../styles/ExpensesChart.css'; 

export default function ExpensesChart({ requests }) {
  // Aggregate live issue status states directly from maintenance pipeline
  const distribution = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, VERIFIED: 0 };
  
  requests.forEach(r => {
    if (distribution[r.status] !== undefined) {
      distribution[r.status] += 1;
    } else {
      distribution.PENDING += 1;
    }
  });

  // Calculate runtime absolute workload for gauge display
  const totalTasksCount = requests.length;

  const data = {
    datasets: [{
      data: [distribution.VERIFIED, distribution.COMPLETED, distribution.IN_PROGRESS, distribution.PENDING],
      backgroundColor: ['#10B981', '#3B82F6', '#FBBF24', '#EF4444'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  return (
    <div className="flex flex-col h-full justify-between chart-gauge-container">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-bold text-sm tracking-tight text-slate-900">Task Allocation Mix</h3>
        <span className="text-[10px] bg-slate-100 font-extrabold text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
          Tickets
        </span>
      </div>

      {/* Semi-Doughnut Gauge Frame */}
      <div className="h-28 relative overflow-hidden my-3">
        <Doughnut 
          data={data} 
          options={{
            rotation: -90,
            circumference: 180,
            plugins: { legend: { display: false } },
            maintainAspectRatio: false,
            cutout: '78%'
          }} 
        />
        {/* Dynamic Center Metric Display */}
        <div className="chart-gauge-metric">
          <span className="text-2xl font-black tracking-tight text-slate-900 block leading-none">
            {totalTasksCount}
          </span>
          <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 block mt-0.5">
            Total Issues
          </span>
        </div>
      </div>

      {/* Refactored Vibrant Data Table List */}
      <div className="space-y-1 text-xs font-bold text-slate-600">
        <div className="flex justify-between items-center legend-item-row">
          <span className="flex items-center text-slate-700">
            <span className="indicator-pill pill-verified"></span> Verified Work
          </span>
          <span className="counter-chip">{distribution.VERIFIED}</span>
        </div>
        
        <div className="flex justify-between items-center legend-item-row">
          <span className="flex items-center text-slate-700">
            <span className="indicator-pill pill-completed"></span> Completed Tasks
          </span>
          <span className="counter-chip">{distribution.COMPLETED}</span>
        </div>

        <div className="flex justify-between items-center legend-item-row">
          <span className="flex items-center text-slate-700">
            <span className="indicator-pill pill-progress"></span> In Progress
          </span>
          <span className="counter-chip">{distribution.IN_PROGRESS}</span>
        </div>

        <div className="flex justify-between items-center legend-item-row">
          <span className="flex items-center text-slate-700">
            <span className="indicator-pill pill-pending"></span> Critical Pending
          </span>
          <span className="counter-chip bg-red-50 text-red-600 border-red-100">{distribution.PENDING}</span>
        </div>
      </div>
    </div>
  );
}
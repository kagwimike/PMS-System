import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js';
// --- VIBRANT CSS ENGINE IMPORT LINK ---
import '../../styles/RevenueOverviewChart.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

export default function RevenueOverviewChart({ leases }) {
  // Aggregate live cash flows mapped across structural values
  const activeRentAggregation = leases
    .filter(l => l.status === "ACTIVE")
    .reduce((sum, c) => sum + parseFloat(c.rent_amount || 0), 0);

  const pendingSettlementAggregation = leases
    .filter(l => l.status !== "ACTIVE")
    .reduce((sum, c) => sum + parseFloat(c.rent_amount || 0), 0);

  const data = {
    labels: ['Active Leases', 'Pending/Past'],
    datasets: [
      {
        label: 'Financial Flow (KSh)',
        data: [activeRentAggregation, pendingSettlementAggregation],
        backgroundColor: ['#3B82F6', '#E2E8F0'],
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 32
      }
    ],
  };

  // Modern Chart.js display scale adjustments
  const chartOptions = {
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false }, // Hides messy vertical grid dividers
        ticks: { color: '#94a3b8', font: { weight: '600', size: 10 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' }, // Keeps clean horizontal benchmark guides
        ticks: { color: '#94a3b8', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="revenue-portfolio-card">
      {/* Dynamic Header Metrics block */}
      <div>
        <h3 className="font-bold text-xs tracking-wider uppercase text-slate-400">
          Active Portfolio Revenue
        </h3>
        <span className="text-2xl font-black block mt-1 revenue-prime-metric">
          KSh {activeRentAggregation.toLocaleString()}
        </span>
      </div>

      {/* Render Frame Canvas */}
      <div className="h-40 w-full mt-3">
        <Bar data={data} options={chartOptions} />
      </div>

      {/* Mini Color Palette Key Footer */}
      <div className="revenue-subtext-footer">
        <span className="subtext-indicator">
          <span className="bullet-dot bg-blue-500"></span> Contracted Revenue
        </span>
        <span className="subtext-indicator">
          <span className="bullet-dot bg-slate-200"></span> Historical/Unsettled
        </span>
      </div>
    </div>
  );
}
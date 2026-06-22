import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import '../../styles/PropertyTypeChart.css';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PropertyTypeChart({ properties }) {
  // 1. Isolate target structural allocations
  let apartmentCount = 0;
  let otherPropertiesCount = 0;

  properties.forEach(p => {
    const normType = String(p.property_type).toUpperCase();
    if (normType.includes("APARTMENT")) {
      apartmentCount += 1;
    } else {
      otherPropertiesCount += 1; // Groups Residential, Commercial, Villas, etc.
    }
  });

  // 2. Map dataset configuration bounds
  const data = {
    labels: ['Apartments', 'Other Spaces'],
    datasets: [{
      data: [apartmentCount, otherPropertiesCount],
      backgroundColor: ['#FBBF24', '#E2E8F0'], // Vibrant Amber yellow accent for apartments vs clean neutral fallback grey
      borderWidth: 0,
      cutout: '74%',
      hoverOffset: 4
    }]
  };

  return (
    <div className="flex flex-col h-full justify-between portfolio-mix-container">
      {/* Component Title Header */}
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-bold text-sm tracking-tight text-slate-900">Apartment Share Mix</h3>
        <span className="text-amber-600 bg-amber-50/60 border border-amber-100 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
          Units
        </span>
      </div>

      {/* Full Donut Rendering Frame with center total counter overlay */}
      <div className="h-36 relative my-2 flex items-center justify-center">
        <Doughnut 
          data={data} 
          options={{ 
            plugins: { legend: { display: false } }, 
            maintainAspectRatio: false 
          }} 
        />
        {/* Dynamic Center Value Summary Output */}
        <div className="portfolio-center-summary translate-y-[-2px]">
          <span className="text-xl font-black text-slate-900 block tracking-tight leading-none">
            {apartmentCount}
          </span>
          <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 block mt-0.5">
            Apartments
          </span>
        </div>
      </div>

      {/* Simplified Dual-Row Legend Layout Key */}
      <div className="grid grid-cols-2 gap-2 text-xs font-bold mt-2">
        <div className="type-grid-pill">
          <span className="flex items-center text-slate-500">
            <span className="tag-box tag-apt"></span> Apartments
          </span>
          <span className="tag-count-value">{apartmentCount}</span>
        </div>

        <div className="type-grid-pill">
          <span className="flex items-center text-slate-500">
            <span className="tag-box bg-slate-300 shadow-none"></span> Other Types
          </span>
          <span className="tag-count-value text-slate-400">{otherPropertiesCount}</span>
        </div>
      </div>
    </div>
  );
}
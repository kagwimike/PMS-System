import React from 'react';
// --- VIBRANT CSS ENGINE IMPORT LINK ---
import '../../styles/KPISection.css'; 

export default function KPISection({ properties, leases }) {
  // Compute absolute dynamic lengths from state models
  const totalProperties = properties.length;
  const activeLeasesCount = leases.filter(l => l.status === "ACTIVE").length;
  
  // Dynamic summation of all active rental income transactions
  const combinedMonthlyRevenue = leases
    .filter(l => l.status === "ACTIVE")
    .reduce((sum, current) => sum + parseFloat(current.rent_amount || current.unit?.rent_price || 0), 0);

  // Derive aggregate property capacities
  const derivedTotalUnitsCapacity = properties.reduce((sum, p) => sum + parseInt(p.total_units || 0, 10), 0);
  const vacantUnitsComputed = Math.max(0, derivedTotalUnitsCapacity - activeLeasesCount);

  const metrics = [
    { label: "Total Properties", value: totalProperties, icon: "🏢", highlighted: false },
    { label: "Occupied Units", value: activeLeasesCount, icon: "📋", highlighted: false },
    { label: "Vacant Capacity", value: vacantUnitsComputed, icon: "🛏️", highlighted: false },
    { label: "Active Pipelines", value: leases.length, icon: "🚀", highlighted: false },
    { 
      label: "Gross Monthly Rent", 
      value: `KSh ${combinedMonthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 
      icon: "🪙", 
      highlighted: true 
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {metrics.map((item, idx) => (
        <div 
          key={idx} 
          className={`p-5 rounded-2xl border kpi-card ${
            item.highlighted ? 'kpi-card-highlighted' : 'border-slate-100'
          }`}
        >
          {/* Card Meta Row */}
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
              {item.label}
            </span>
            <span className="kpi-icon-wrapper">
              {item.icon}
            </span>
          </div>

          {/* Core Analytical Figure Output */}
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black kpi-value-text ${
              item.highlighted ? 'text-blue-600' : 'text-slate-900'
            }`}>
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
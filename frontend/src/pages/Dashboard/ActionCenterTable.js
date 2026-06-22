import React from 'react';
// --- VIBRANT CSS ENGINE IMPORT LINK ---
import '../../styles/ActionCenterTable.css'; 

export default function ActionCenterTable({ properties, leases }) {
  // Dynamically map real properties with their occupancy states
  const tableRows = properties.map((prop) => {
    // Check if there is an active lease matching this property
    const activeLease = leases.find(l => l.unit?.property?.id === prop.id && l.status === "ACTIVE");
    const occupancyRate = activeLease ? "OCCUPIED" : "VACANT";

    return {
      id: prop.id,
      name: prop.name,
      address: `${prop.city || 'Nairobi'}, ${prop.country || 'Kenya'}`,
      agent: activeLease ? `${activeLease.tenant?.first_name} ${activeLease.tenant?.last_name}` : "Unoccupied",
      type: prop.property_type || "Apartment",
      status: occupancyRate,
      rate: activeLease ? "100%" : "0%",
      total: activeLease ? `KSh ${(parseFloat(activeLease.rent_amount || 0)).toLocaleString()}` : "KSh 0.00"
    };
  });

  return (
    <div className="action-center-card">
      {/* Table Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">System Action Center</h2>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </div>
        <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50/60 px-3 py-1 rounded-xl border border-blue-100">
          Live Operations
        </span>
      </div>

      {/* Overflow Responsive Structural Layer */}
      <div className="overflow-x-auto custom-table-scroll">
        {tableRows.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-400 italic text-sm">No logged properties data mapping currently available.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse modern-table">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50/50">
                <th className="py-3.5 px-4 rounded-l-xl">Property Name</th>
                <th className="py-3.5 px-3">Location Scope</th>
                <th className="py-3.5 px-3">Current Occupant</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-3 text-right">Unit Yield</th>
                <th className="py-3.5 px-4 text-right rounded-r-xl">Total Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
              {tableRows.slice(0, 5).map((row) => (
                <tr key={row.id} className="group">
                  {/* Property Identity Title */}
                  <td className="py-4 px-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {row.name}
                  </td>
                  {/* Location Details */}
                  <td className="py-4 px-3 text-slate-400 font-normal">{row.address}</td>
                  {/* Registered Tenant Workspace */}
                  <td className="py-4 px-3 text-slate-700 font-medium">{row.agent}</td>
                  {/* Structural Type Category Tags */}
                  <td className="py-4 px-3">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium tracking-wide">
                      {row.type}
                    </span>
                  </td>
                  {/* High Contrast Condition State Badges */}
                  <td className="py-4 px-3 text-center">
                    <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-md transition-all ${
                      row.status === 'OCCUPIED' ? 'badge-occupied' : 'badge-vacant'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  {/* Numerical Efficiency Ratios */}
                  <td className="py-4 px-3 text-right text-slate-900 font-bold tracking-tight">{row.rate}</td>
                  {/* Live Gross Yield Valuations */}
                  <td className="py-4 px-4 text-right font-black text-xs whitespace-nowrap">
                    <span className="yield-text-accent">{row.total}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
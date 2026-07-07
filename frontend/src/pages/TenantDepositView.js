import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TenantDepositView = ({ activeLeaseId }) => {
    const [summary, setSummary] = useState({
        total_deposited: 0,
        total_refunded: 0,
        total_deductions: 0,
        available_escrow: 0
    });
    const [refundHistory, setRefundHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeLeaseId) {
            fetchTenantEscrowLogs();
        }
    }, [activeLeaseId]);

    const fetchTenantEscrowLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const [balanceRes, historyRes] = await Promise.all([
                axios.get(`http://127.0.0.1:8000/api/deposit-refunds/calculate_balance/${activeLeaseId}/`, { headers }),
                axios.get(`http://127.0.0.1:8000/api/deposit-refunds/`, { headers })
            ]);

            setSummary(balanceRes.data);
            setRefundHistory(historyRes.data);
        } catch (err) {
            console.error("Could not load tenant deposit tracking ledger.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading Escrow Statement...</div>;

    return (
        <div style={{ fontFamily: 'sans-serif', padding: '15px' }}>
            <h2 style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '8px' }}>🛡️ Your Security Deposit Statement</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px', marginTop: '15px' }}>
                <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: '0.9em' }}>Total Deposited Paid</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#2b2b2b', marginTop: '5px' }}>KES {summary.total_deposited.toFixed(2)}</div>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: '0.9em' }}>Deductions Applied</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#dc3545', marginTop: '5px' }}>KES {summary.total_deductions.toFixed(2)}</div>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '6px', textAlign: 'center', backgroundColor: '#e9ecef' }}>
                    <div style={{ color: '#666', fontSize: '0.9em' }}>Net Amount Refunded</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#0056b3', marginTop: '5px' }}>KES {summary.total_refunded.toFixed(2)}</div>
                </div>
            </div>

            <div style={{ padding: '15px', borderRadius: '6px', backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', marginBottom: '30px' }}>
                <span style={{ fontSize: '1.05em', color: '#2e7d32' }}><strong>Remaining Escrow Held:</strong> KES {summary.available_escrow.toFixed(2)}</span>
            </div>

            <h3>📜 Escrow Refund Adjustments</h3>
            {refundHistory.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic' }}>No refund or settlement logs found for this active lease cycle.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f1f3f5', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Date Processed</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Returned Cash</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Withheld Deductions</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Route</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {refundHistory.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px' }}>{new Date(log.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '10px', color: '#2e7d32', fontWeight: 'bold' }}>KES {parseFloat(log.amount_refunded).toFixed(2)}</td>
                                <td style={{ padding: '10px', color: '#c62828' }}>KES {parseFloat(log.deductions_retained).toFixed(2)}</td>
                                <td style={{ padding: '10px', fontSize: '0.85em' }}>{log.payment_method} ({log.transaction_reference || 'N/A'})</td>
                                <td style={{ padding: '10px', color: '#555', fontSize: '0.9em' }}>{log.notes || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TenantDepositView;
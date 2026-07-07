import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Standard configured Axios instance wrapper

const DepositRefundForm = ({ leaseId, onRefundSuccess }) => {
    const [escrowState, setEscrowState] = useState({
        total_deposited: 0,
        total_refunded: 0,
        total_deductions: 0,
        available_escrow: 0
    });
    const [formData, setFormData] = useState({
        amount_refunded: '',
        deductions_retained: '',
        payment_method: 'BANK_TRANSFER',
        transaction_reference: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (leaseId) {
            fetchEscrowBalance();
        }
    }, [leaseId]);

    const fetchEscrowBalance = async () => {
        try {
            const token = localStorage.getItem('access_token');
            
            // 🚨 FIX: Prepend 'payments/' prefix to match your backend/payments/urls.py router mount target
            const res = await api.get(`payments/deposit-refunds/${leaseId}/calculate_balance/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEscrowState(res.data);
        } catch (err) {
            setError('Failed to compute escrow balance metrics.');
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        const totalPayoutRequest = parseFloat(formData.amount_refunded || 0) + parseFloat(formData.deductions_retained || 0);
        if (totalPayoutRequest > escrowState.available_escrow) {
            setError(`Total refund + deduction execution exceeds available escrow threshold of KES ${escrowState.available_escrow}`);
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            
            // 🚨 FIX: Prepend 'payments/' prefix here as well for consistency across your endpoints
            await api.post(`payments/deposit-refunds/`, {
                lease: leaseId,
                amount_refunded: formData.amount_refunded,
                deductions_retained: formData.deductions_retained || 0,
                payment_method: formData.payment_method,
                transaction_reference: formData.transaction_reference,
                notes: formData.notes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccessMsg('Escrow deposit refund logged and processed cleanly!');
            setFormData({ amount_refunded: '', deductions_retained: '', payment_method: 'BANK_TRANSFER', transaction_reference: '', notes: '' });
            fetchEscrowBalance();
            if (onRefundSuccess) onRefundSuccess();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'An error occurred during refund ledger assignment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>💸 Process Deposit Return / Refund</h3>
            
            <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '15px' }}>
                <p style={{ margin: '4px 0' }}><strong>Total Deposited Paid:</strong> KES {escrowState.total_deposited.toFixed(2)}</p>
                <p style={{ margin: '4px 0' }}><strong>Total Previously Refunded:</strong> KES {escrowState.total_refunded.toFixed(2)}</p>
                <p style={{ margin: '4px 0', color: '#dc3545' }}><strong>Total Deductions Withheld:</strong> KES {escrowState.total_deductions.toFixed(2)}</p>
                <hr />
                <p style={{ margin: '4px 0', fontSize: '1.1em', color: '#28a745' }}><strong>Available Escrow Float:</strong> KES {escrowState.available_escrow.toFixed(2)}</p>
            </div>

            {error && <div style={{ color: '#dc3545', marginBottom: '10px' }}>⚠️ {error}</div>}
            {successMsg && <div style={{ color: '#28a745', marginBottom: '10px' }}>✅ {successMsg}</div>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>Net Cash Amount to Return (KES):</label>
                    <input type="number" name="amount_refunded" value={formData.amount_refunded} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>Deductions Retained (Damages/Arrears):</label>
                    <input type="number" name="deductions_retained" value={formData.deductions_retained} onChange={handleInputChange} placeholder="0.00" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>Payout Settlement Route:</label>
                    <select name="payment_method" value={formData.payment_method} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="BANK_TRANSFER">Direct Bank Deposit</option>
                        <option value="MPESA">M-Pesa Business B2C Payout</option>
                        <option value="CASH">Physical Cash Handout</option>
                    </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>Reference Token / Bank Receipt Number:</label>
                    <input type="text" name="transaction_reference" value={formData.transaction_reference} onChange={handleInputChange} placeholder="e.g. BK_REF_9921" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>Reconciliation Audit Notes:</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Reasoning for partial withholdings..." style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', height: '60px' }} />
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {loading ? 'Processing Escrow Outflow...' : 'Confirm Ledger Refund'}
                </button>
            </form>
        </div>
    );
};

export default DepositRefundForm;
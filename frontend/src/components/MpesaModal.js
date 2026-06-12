import React, { useState } from 'react';
import axios from 'axios';

const MpesaModal = ({ invoice, onClose, onPaymentInitiated }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Quick structural formatting for Safaricom layout standard
    let formattedPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.replace('+', '');
    }

    try {
      // 🚨 Ensure this hits your backend payments endpoint mapping
      const token = localStorage.getItem('access_token'); // Or however you handle JWTs
      const response = await axios.post(
        'http://127.0.0.1:8000/api/payments/initiate-stk/', 
        {
          phone: formattedPhone,
          amount: invoice.amount,
          invoice_id: invoice.id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.ResponseCode === "0") {
        setMessage('✨ STK Push sent successfully! Check your phone screen for the PIN prompt.');
        if (onPaymentInitiated) onPaymentInitiated();
      } else {
        setMessage(`❌ Error: ${response.data.CustomerMessage || 'Initialization failed.'}`);
      }
    } catch (error) {
      console.error(error);
      setMessage('❌ Failed to connect to the payment gateway.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          💳 Pay Rent via M-Pesa Online
        </h3>
        
        <div className="mb-4 bg-gray-50 p-3 rounded text-sm text-gray-600">
          <p><strong>Invoice ID:</strong> #{invoice.id}</p>
          <p><strong>Amount Due:</strong> KSh {parseFloat(invoice.amount).toLocaleString()}</p>
        </div>

        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safaricom Phone Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g., 0712345678 or 254712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
            />
          </div>

          {message && (
            <div className={`text-sm p-2 rounded ${message.includes('❌') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}

          <div className="flex justify-end gap-2 text-sm pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Send STK Push'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MpesaModal;
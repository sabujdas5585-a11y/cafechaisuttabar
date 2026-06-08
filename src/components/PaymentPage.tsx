import React, { useState } from 'react';
import { PaymentSettings, Order } from '../types';
import { Upload, Check, Loader2 } from 'lucide-react';

interface PaymentPageProps {
  paymentSettings: PaymentSettings | null;
  order: Order | undefined;
  onClose: () => void;
}

export default function PaymentPage({ paymentSettings, order, onClose }: PaymentPageProps) {
  const [utrId, setUtrId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrId || !screenshot || !order) return;
    setSubmitting(true);

    // Simulate upload and submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Submitting:", { utrId, screenshot, orderId: order.id });
    
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="p-8 text-center text-stone-100 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-emerald-950/50 rounded-full flex items-center justify-center mb-4 border border-emerald-800">
          <Check className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black">Payment Submitted!</h2>
        <p className="text-stone-400 mt-2">Thank you! Your payment details are being reviewed by the admin.</p>
        <button onClick={onClose} className="mt-6 bg-stone-800 text-stone-100 px-6 py-2 rounded-xl font-bold">
          Return to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto bg-stone-900 border border-stone-800 rounded-3xl">
      <h2 className="text-xl font-black text-amber-500 mb-6">Complete Payment</h2>
      
      {paymentSettings ? (
        <div className="space-y-6">
          <div className="bg-stone-800 p-4 rounded-xl text-center">
            <img src={paymentSettings.scannerUrl} alt="Scanner" className="mx-auto w-48 h-48 mb-4 border-2 border-amber-500 p-1" />
            <p className="text-xs text-stone-400 font-mono">UPI ID: <span className="text-stone-100 font-bold">{paymentSettings.upiId}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-stone-400 block mb-1">Enter UTR ID</label>
              <input 
                type="text" 
                value={utrId} 
                onChange={e => setUtrId(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 p-2 rounded-lg text-sm"
                required
              />
            </div>
            
            <div>
              <label className="text-xs text-stone-400 block mb-1">Upload Payment Screenshot</label>
              <div className="relative border-2 border-dashed border-stone-800 p-4 text-center rounded-xl hover:border-amber-500 cursor-pointer">
                <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload className="mx-auto w-6 h-6 text-stone-600" />
                <span className="text-xs text-stone-500 mt-1 block">{screenshot ? screenshot.name : "Click to upload"}</span>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-amber-600 text-stone-950 font-bold py-3 rounded-xl disabled:opacity-50">
                {submitting ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Submit Payment Details'}
            </button>
          </form>
        </div>
      ) : (
        <p className="text-red-500">Payment configuration not set up yet.</p>
      )}
    </div>
  );
}

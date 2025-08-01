import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowRight } from 'lucide-react';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center text-white p-4 text-center" style={{ background: 'linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)' }}>
      <div className="mb-8">
        <Logo />
      </div>
      <XCircle className="w-12 h-12 text-orange-400" />
      <h1 className="text-2xl font-bold mt-4">Payment Canceled</h1>
      <p className="text-slate-300 mt-2 max-w-sm">
        Your transaction was not completed. You have not been charged.
      </p>
      <Button
        size="lg"
        className="mt-8 w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        onClick={() => navigate(createPageUrl('synthesizer'))}
      >
        Return to Spher8 <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}
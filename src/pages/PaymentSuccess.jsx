import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { verifyCheckoutSession } from '@/api/functions';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');

      if (!sessionId) {
        setStatus('error');
        setErrorMessage('No session ID found. Your payment could not be verified.');
        return;
      }

      try {
        const { error } = await verifyCheckoutSession({ sessionId });
        if (error) {
          throw new Error(error.message || 'Verification failed.');
        }
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.message || 'An unknown error occurred during verification.');
        console.error("Verification failed:", err);
      }
    };

    verifyPayment();
  }, []);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <>
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            <h1 className="text-2xl font-bold mt-4">Verifying Payment...</h1>
            <p className="text-slate-400 mt-2">Please wait while we confirm your transaction.</p>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-12 h-12 text-green-400" />
            <h1 className="text-2xl font-bold mt-4">Payment Successful!</h1>
            <p className="text-slate-300 mt-2 max-w-sm">
              Welcome to Spher8 Premium! Your account has been upgraded. You now have unlimited access.
            </p>
            <Button
              size="lg"
              className="mt-8 w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={() => navigate(createPageUrl('synthesizer'))}
            >
              Start Creating <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className="w-12 h-12 text-red-400" />
            <h1 className="text-2xl font-bold mt-4">Verification Failed</h1>
            <p className="text-slate-400 mt-2 max-w-sm">{errorMessage}</p>
            <p className="text-slate-500 text-xs mt-2">
              If payment was taken, please contact support.
            </p>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(createPageUrl('synthesizer'))}
              className="w-full max-w-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 transition-all duration-300 transform hover:scale-105 cursor-pointer"
            >
              Return to App
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center text-white p-4 text-center" style={{ background: 'linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)' }}>
      <div className="mb-8">
        <Logo />
      </div>
      {renderContent()}
    </div>
  );
}
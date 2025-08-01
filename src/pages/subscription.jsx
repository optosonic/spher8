
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, Crown, Loader2, LogIn, AlertCircle, Star, Shield, RefreshCw } from 'lucide-react';
import { createCheckoutSession } from '@/api/functions';
import { getSubscriptionStatus } from '@/api/functions'; // New import

const PlanFeature = ({ children }) => (
  <li className="flex items-center gap-3">
    <Check className="w-5 h-5 text-emerald-400" />
    <span className="text-slate-300">{children}</span>
  </li>
);

export default function SubscriptionPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Changed from isUpgrading to isLoading
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment_success') === 'true') {
      setPaymentStatus('success');
      navigate(location.pathname, { replace: true });
    } else if (params.get('payment_cancelled') === 'true') {
      setPaymentStatus('cancelled');
      navigate(location.pathname, { replace: true });
    }
    
    const loadUserData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        console.log('User loaded on subscription page:', userData.email, 'with plan:', userData.plan);
      } catch (error) {
        console.warn("User not authenticated:", error);
        setUser(null);
      } finally {
        setIsPageLoading(false);
      }
    };

    loadUserData();
  }, [location, navigate]);

  // Define the Stripe Price ID for the Premium plan.
  const PREMIUM_PRICE_ID = 'price_1Rp8N7JoEytxNWIHtop3p0ay'; // FIXED: Replaced placeholder with the real Stripe Price ID

  const handleUpgrade = async (priceId) => {
    if (!user) {
      alert("Please log in to upgrade your subscription.");
      return;
    }
    
    setIsLoading(true);
    try {
      const { data } = await createCheckoutSession({ priceId });
      
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || 'No checkout URL received from server.');
      }
    } catch (err) {
      console.error('Checkout session creation failed:', err);
      const errorMessage = err.response?.data?.details || err.message || 'Unknown error occurred';
      alert(`Error: ${errorMessage}`);
      setIsLoading(false);
    }
  };
  
  const StatusAlert = ({ status }) => {
    if (!status) return null;

    const config = {
      success: {
        icon: <Check className="w-5 h-5 text-emerald-400" />,
        title: "Payment Successful!",
        message: "Your subscription is now active! It may take a moment for the changes to apply. Please refresh the page.",
        color: "border-emerald-500/50 bg-emerald-900/40 text-emerald-200"
      },
      cancelled: {
        icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
        title: "Payment Cancelled",
        message: "Your purchase was not completed. You can try upgrading again at any time.",
        color: "border-yellow-500/50 bg-yellow-900/40 text-yellow-200"
      }
    };
    
    const { icon, title, message, color } = config[status];

    return (
      <div className={`mb-8 p-4 rounded-lg border flex items-start gap-4 ${color}`}>
        {icon}
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm opacity-90">{message}</p>
        </div>
      </div>
    );
  };

  const handleRefreshStatus = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Call the backend function to get the latest status from Stripe
      const { data: statusData } = await getSubscriptionStatus();

      if (statusData && statusData.plan) {
        // 2. Update the user's data in the Base44 database
        await User.updateMyUserData({
          plan: statusData.plan,
          payment_status: statusData.payment_status,
        });

        // 3. Refresh the user data on the page to show the new status
        const updatedUser = await User.me();
        setUser(updatedUser);
        alert('Your subscription status has been updated successfully!');
      } else {
        throw new Error('Could not retrieve subscription status.');
      }
    } catch (err) {
      console.error('Failed to refresh status:', err);
      alert(`Error: ${err.message || 'Could not refresh subscription status.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }
  
  if (!user) {
    return (
       <div className="h-screen w-screen flex flex-col items-center justify-center text-white p-4 text-center" style={{ background: 'linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)' }}>
          <Crown className="w-16 h-16 text-purple-400 mb-6" />
          <h1 className="text-2xl font-bold mt-8 mb-4">Manage Your Subscription</h1>
          <p className="text-slate-300 mb-8 max-w-sm">Please sign in to view your plan details and manage your subscription.</p>
          <Button
            size="lg"
            className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={() => User.login()}
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In with Google
          </Button>
      </div>
    );
  }

  // The 'isPremium' and 'isCancelled' variables are now derived from the 'user' object directly
  // and used within the single return block for conditional rendering.
  const isPremium = user && user.plan === 'premium';
  const isCancelled = user && user.plan === 'cancelled';

  return (
    <div className="min-h-screen w-full text-white p-4 sm:p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2">Subscription Management</h1>
        <p className="text-center text-slate-300 mb-8">Manage your plan and billing details.</p>

        {paymentStatus === 'success' && (
          <StatusAlert status="success" />
        )}
        {paymentStatus === 'cancelled' && (
          <StatusAlert status="cancelled" />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Current Plan Card */}
          <Card className="glass-panel border-purple-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-400" />
                Your Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold capitalize text-purple-300">{user.plan || 'Free'}</p>
                <p className="text-sm text-slate-400">
                  {user.plan === 'premium' && 'You have unlimited access to all features.'}
                  {user.plan === 'cancelled' && 'Your premium access has been cancelled. Resubscribe to continue.'}
                  {user.plan === 'free' && 'Limited to 5,000 notes. Upgrade for more.'}
                </p>
              </div>

              {user.plan === 'premium' && (
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full border-slate-500 hover:bg-white/10 hover:text-white"
                  // This is a placeholder for a link to Stripe's customer portal.
                  // For a real app, you would generate a portal session link here.
                  onClick={() => alert("Stripe Customer Portal integration is required to manage billing.")}
                >
                  <a href="#">Manage Billing</a>
                </Button>
              )}
            </CardContent>
            <CardFooter>
               <Button
                variant="outline"
                size="sm"
                className="w-full border-slate-500 hover:bg-white/10 hover:text-white"
                onClick={handleRefreshStatus}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh Status
              </Button>
            </CardFooter>
          </Card>
          
          {/* Upgrade Card (shown if not premium) */}
          {user.plan !== 'premium' && (
            <Card className="glass-panel border-purple-500/30">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-white flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6 text-purple-400" />
                  Premium Plan
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {isPremium ? 'Your current subscription' : 'Upgrade for unlimited access'}
                </CardDescription>
                <div className="text-3xl font-bold text-white mt-4">
                  $12<span className="text-sm text-slate-400"> / month USD</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <PlanFeature>Unlimited notes</PlanFeature>
                  <PlanFeature>Advanced 3D visualization</PlanFeature>
                  <PlanFeature>All musical scales & modes</PlanFeature>
                  <PlanFeature>MIDI export capabilities</PlanFeature>
                  <PlanFeature>AI-powered features</PlanFeature>
                  <PlanFeature>Preset saving & sharing</PlanFeature>
                  <PlanFeature>Advanced synthesis options</PlanFeature>
                  <PlanFeature>Priority customer support</PlanFeature>
                </ul>
              </CardContent>
              <CardFooter>
                  <Button
                    onClick={() => handleUpgrade(PREMIUM_PRICE_ID)}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Crown className="w-5 h-5 mr-2" />
                    )}
                    {isCancelled ? 'Reactivate Premium' : 'Upgrade to Premium'}
                  </Button>
              </CardFooter>
            </Card>
          )}

        </div>
        <div className="mt-12 text-center text-slate-400 text-sm">
          <p>Secure payment powered by Stripe • Cancel anytime • 30-day money-back guarantee</p>
        </div>
      </div>
    </div>
  );
}

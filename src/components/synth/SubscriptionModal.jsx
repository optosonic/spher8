
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, ArrowRight, Loader2 } from 'lucide-react';
import { User } from '@/api/entities';
import { createCheckoutSession } from '@/api/functions';

export default function SubscriptionModal({ isOpen, onClose }) {
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const userRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      User.me()
        .then(user => {
          userRef.current = user;
          if (user && user.email) {
            setUserEmail(user.email);
          }
        })
        .catch(() => {
          // Handle error if user is not fetched
        });
    }
  }, [isOpen]);

  const handleUpgradeToPremium = async () => {
    if (!userEmail) {
      alert("Could not identify user. Please try again or contact support.");
      return;
    }
    setIsLoading(true);
    try {
      // The Stripe Product Price ID for the $12/month plan
      const premiumPriceId = 'price_1Rp8N7JoEytxNWIHtop3p0ay';
      const { data } = await createCheckoutSession({ priceId: premiumPriceId });

      if (data && data.url) {
        // Redirect the user to Stripe's hosted checkout page
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || 'No checkout URL received from server.');
      }
    } catch (err) {
      console.error('Checkout session creation failed:', err);
      alert(`Error: ${err.message || 'Failed to create checkout session'}`);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-blue-500/50 text-white max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-blue-900/50 rounded-full p-3 w-fit mb-4 border border-blue-500/50">
            <Crown className="w-8 h-8 text-blue-300" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Unlock Premium Features</DialogTitle>
          <DialogDescription className="text-center text-slate-300 pt-2">
            {userRef.current?.plan === 'cancelled'
              ? "Your subscription was cancelled. To continue using Spher8, please resubscribe to unlock unlimited access."
              : "You've generated over 5,000 notes. To continue creating and access exclusive tools, please upgrade your account."
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="!mt-6 sm:justify-center flex-col sm:flex-col sm:space-x-0 gap-2">
          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={handleUpgradeToPremium}
            disabled={isLoading || !userEmail}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Crown className="w-5 h-5 mr-2" />
            )}
            Upgrade to Premium ($12/month USD)
            {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full border-slate-500 text-slate-700 hover:bg-white/10 hover:text-white"
            onClick={() => {
              navigate(createPageUrl('subscription'));
              onClose();
            }}
          >
            View All Plans
          </Button>
          <Button size="lg" variant="ghost" className="w-full hover:bg-white/10 hover:text-white" onClick={onClose}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

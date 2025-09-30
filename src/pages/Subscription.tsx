/**
 * Subscription Page - RevenueCat Integration Showcase
 *
 * ENHANCEMENT: Adds monetization page while maintaining app design
 * CLEAN: Reuses existing layout and component patterns
 * MODULAR: Composable subscription management interface
 */

import React from "react";
import { ArrowLeft, Crown, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SubscriptionManager } from "@/components/monetization/SubscriptionManager";

const Subscription: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <h1 className="text-xl font-semibold">Premium Plans</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Unlock Your Breathing Potential
            </h2>
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            Transform your breathing practice with AI coaching, advanced patterns, and Web3 features.
            Choose the plan that fits your wellness journey.
          </p>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-white/60 rounded-xl border border-white/50">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">AI Coaching</h3>
              <p className="text-sm text-muted-foreground">
                Personalized guidance with our Zen AI agent
              </p>
            </div>

            <div className="p-4 bg-white/60 rounded-xl border border-white/50">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-1">Advanced Patterns</h3>
              <p className="text-sm text-muted-foreground">
                Access to premium breathing techniques
              </p>
            </div>

            <div className="p-4 bg-white/60 rounded-xl border border-white/50">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1">Web3 Features</h3>
              <p className="text-sm text-muted-foreground">
                NFT creation and blockchain integration
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Manager Component */}
        <div className="max-w-6xl mx-auto">
          <SubscriptionManager variant="full" showCurrentPlan={true} />
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div className="p-6 bg-white/60 rounded-xl border border-white/50">
              <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.
              </p>
            </div>

            <div className="p-6 bg-white/60 rounded-xl border border-white/50">
              <h4 className="font-semibold mb-2">What happens to my data?</h4>
              <p className="text-muted-foreground">
                Your breathing session data, progress, and custom patterns are always yours. Downgrading only affects access to premium features, not your existing data.
              </p>
            </div>

            <div className="p-6 bg-white/60 rounded-xl border border-white/50">
              <h4 className="font-semibold mb-2">Do I need a crypto wallet for Web3 features?</h4>
              <p className="text-muted-foreground">
                Web3 features like NFT minting require a compatible wallet (Flow or Ethereum). However, all core breathing features work without any wallet connection.
              </p>
            </div>

            <div className="p-6 bg-white/60 rounded-xl border border-white/50">
              <h4 className="font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-muted-foreground">
                The Basic plan is completely free forever. Premium and Pro subscriptions include full access from day one with the ability to cancel anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
            <h3 className="text-xl font-semibold mb-2">Need Help?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here to help you get the most out of your breathing practice.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" asChild>
                <a href="mailto:support@imperfectbreath.com">Contact Support</a>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/help">View Help Center</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;

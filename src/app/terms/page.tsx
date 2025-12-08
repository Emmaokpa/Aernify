
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href="/profile">
            <ChevronLeft className="mr-2" />
            Back to Profile
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Terms and Conditions"
        description="Last updated: July 26, 2024"
      />
      <Card>
        <CardContent className="p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to Earnify! These Terms and Conditions outline the rules and regulations for the use of our application. By accessing or using Earnify, you agree to comply with and be bound by these terms. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">2. Accounts</h2>
            <p className="text-muted-foreground">
              When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">3. Earning and Redeeming Coins</h2>
            <p className="text-muted-foreground">
              Our Service allows you to earn virtual "coins" by engaging in activities such as playing games, completing offers, and watching videos. These coins have no real-world monetary value and can only be redeemed for rewards offered within the app, such as gift cards. We reserve the right to change the coin value, reward offerings, and earning rates at any time without notice.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">4. Prohibited Conduct</h2>
            <p className="text-muted-foreground">
              You agree not to use the Service to: (a) violate any local, state, national, or international law; (b) use any automated means, including bots, scripts, or spiders, to access the Service or collect coins; (c) create multiple accounts for the purpose of defrauding the system. Violation of these rules will result in immediate account termination and forfeiture of all earned coins.
            </p>
          </section>
           <section>
            <h2 className="text-xl font-semibold mb-2">5. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>
           <section>
            <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              In no event shall Earnify, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

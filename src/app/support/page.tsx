
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Mail, MessageSquare } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href="/profile">
            <ChevronLeft className="mr-2" />
            Back to Profile
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Support Center"
        description="We're here to help. Find answers to your questions below."
      />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Mail />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Have a specific question? Send us an email and our team will get back to you within 24 hours.
            </p>
            <Button asChild>
              <a href="mailto:support@aernify.app">Email Support</a>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MessageSquare />
              FAQs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Browse our frequently asked questions to find quick answers about your account, rewards, and more.
            </p>
            <Button variant="secondary" disabled>
              Browse FAQs (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Mail } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: "Is Aernify free to use?",
    answer: "Yes, Aernify is completely free to join and use. You can earn coins and redeem rewards without any cost. We also offer an optional VIP membership for users who want to unlock exclusive benefits and accelerate their earnings."
  },
  {
    question: "How do I earn coins?",
    answer: "You can earn coins in multiple ways: playing games, watching short video ads, completing affiliate offers, inviting friends with your referral code, and participating in daily challenges. The more active you are, the more you earn!"
  },
  {
    question: "What are the criteria for withdrawing coins as cash?",
    answer: "To be eligible for a cash withdrawal, you must meet two conditions: 1) You must have a minimum balance of 2,000 coins. 2) You must have successfully referred at least 2 new users to Aernify."
  },
  {
    question: "How can I redeem my coins?",
    answer: "You can redeem your coins in two main ways: for digital gift cards from popular brands or by withdrawing them as cash (Naira) directly to your Nigerian bank account. Visit the 'Redeem' and 'Withdraw' pages to see the available options."
  },
  {
    question: "How long does it take to receive my reward?",
    answer: "Gift card redemption and withdrawal requests are typically processed within 1-3 business days. You will be notified once your request has been approved and your reward has been sent."
  }
];

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
              Have a specific question not answered here? Send us an email and our team will get back to you within 24 hours.
            </p>
            <Button asChild>
              <a href="mailto:support@aernify.app">Email Support</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index + 1}`} key={index}>
                  <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

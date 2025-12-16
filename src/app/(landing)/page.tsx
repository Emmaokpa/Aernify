'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowRight,
  Gamepad2,
  Gift,
  ListChecks,
  Banknote,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    icon: <Gamepad2 className="h-8 w-8" />,
    title: 'Play Fun Games',
    description: 'Discover a library of fun and engaging games. The more you play, the more you earn.',
  },
  {
    icon: <ListChecks className="h-8 w-8" />,
    title: 'Complete Offers',
    description: 'Earn large amounts of coins by completing simple tasks and offers from our partners.',
  },
  {
    icon: <Gift className="h-8 w-8" />,
    title: 'Redeem Gift Cards',
    description: 'Exchange your coins for real-world value with gift cards from top brands.',
  },
  {
    icon: <Banknote className="h-8 w-8" />,
    title: 'Withdraw Cash',
    description: 'Convert your coins into cash and withdraw directly to your Nigerian bank account.',
  },
];

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
      question: "How can I redeem my coins?",
      answer: "You can redeem your coins in two main ways: for digital gift cards from popular brands or by withdrawing them as cash (Naira) directly to your Nigerian bank account. Visit the 'Redeem' and 'Withdraw' pages to see the available options."
    },
    {
      question: "How long does it take to receive my reward?",
      answer: "Gift card redemption and withdrawal requests are typically processed within 1-3 business days. You will be notified once your request has been approved and your reward has been sent."
    }
  ]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 text-center sm:py-32">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Turn Your Time into Rewards
          </h1>
          <p className="mx-auto mt-4 max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Play games, complete offers, and earn real rewards. Get gift cards and cash sent directly to you. It's that simple.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="text-lg">
              <Link href="/signup">
                Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="w-full bg-muted py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How It Works</h2>
            <p className="mx-auto mt-4 max-w-[600px] text-muted-foreground md:text-lg">
                Earning rewards with Aernify is as easy as 1-2-3.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                 <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="text-3xl font-bold">1</span>
                        </div>
                        <CardTitle className="mt-4 text-xl">Earn Coins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Play games, complete offers, watch videos, and invite friends to accumulate coins in your wallet.</p>
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="text-3xl font-bold">2</span>
                        </div>
                        <CardTitle className="mt-4 text-xl">Redeem Rewards</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-muted-foreground">Browse our selection of gift cards and other rewards. Choose what you want and redeem with your coins.</p>
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                             <span className="text-3xl font-bold">3</span>
                        </div>
                        <CardTitle className="mt-4 text-xl">Get Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Your rewards are sent directly to you. Get gift card codes via email or cash directly to your bank account.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Endless Ways to Earn
            </h2>
            <p className="mx-auto mt-4 max-w-[600px] text-muted-foreground md:text-lg">
              From casual gaming to completing offers, there's always something new to do.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6">
                <div className="text-primary">{feature.icon}</div>
                <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full bg-muted py-16 sm:py-24">
        <div className="container mx-auto px-4">
           <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="mx-auto mt-12 max-w-3xl">
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
          </div>
        </div>
      </section>
    </div>
  );
}

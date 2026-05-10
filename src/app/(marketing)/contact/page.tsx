'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, MessageSquare, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  company: z.string().optional(),
  subject: z.string().min(4, 'Subject is too short'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type ContactForm = z.infer<typeof contactSchema>;

const CONTACT_INFO = [
  {
    icon: Mail,
    title: 'Email',
    value: 'hello@smartretailai.com',
    sub: 'We reply within 24 hours',
  },
  {
    icon: Phone,
    title: 'Phone',
    value: '+1 (555) 123-4567',
    sub: 'Mon–Fri, 9am–6pm PT',
  },
  {
    icon: MapPin,
    title: 'Office',
    value: 'San Francisco, CA 94105',
    sub: '101 Market Street, Suite 300',
  },
  {
    icon: Clock,
    title: 'Support Hours',
    value: '24/7 AI Copilot',
    sub: 'Human support Mon–Fri 9am–6pm',
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (_data: ContactForm) => {
    // Simulate API call — replace with real endpoint
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
  };

  return (
    <div className="pt-20">

      {/* Hero */}
      <section className="py-16 sm:py-20 text-center max-w-3xl mx-auto px-4 sm:px-6">
        <Badge variant="secondary" className="mb-4">Contact Us</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          How can we help?
        </h1>
        <p className="text-muted-foreground text-lg">
          Whether you have a sales question, need technical support, or just want to learn more —
          our team is here and happy to help.
        </p>
      </section>

      {/* Main content */}
      <section className="pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">

          {/* Contact info */}
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {CONTACT_INFO.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="border-border">
                    <CardContent className="p-5">
                      <Icon className="h-5 w-5 text-primary mb-3" />
                      <p className="text-xs text-muted-foreground mb-0.5">{item.title}</p>
                      <p className="text-sm font-semibold">{item.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* FAQ prompt */}
            <Card className="border-border bg-muted/30">
              <CardContent className="p-5 flex items-start gap-4">
                <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold mb-1">Looking for quick answers?</p>
                  <p className="text-sm text-muted-foreground">
                    Check our{' '}
                    <a href="/faq" className="text-primary hover:underline underline-offset-4">
                      FAQ page
                    </a>{' '}
                    for answers to the most common questions about pricing, features, and setup.
                    Or use the AI Copilot inside the dashboard — it can answer most product questions instantly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          {submitted ? (
            <Card className="border-border">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5">
                  <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Message sent!</h3>
                <p className="text-muted-foreground text-sm">
                  Thanks for reaching out. We'll get back to you within 24 hours at the email you provided.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full name *</Label>
                      <Input id="name" placeholder="Jane Smith" {...register('name')} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email address *</Label>
                      <Input id="email" type="email" placeholder="jane@example.com" {...register('email')} />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="company">Company <span className="text-muted-foreground">(optional)</span></Label>
                    <Input id="company" placeholder="Your store name" {...register('company')} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input id="subject" placeholder="e.g. Question about AI features" {...register('subject')} />
                    {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us what you'd like to know..."
                      rows={5}
                      {...register('message')}
                    />
                    {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Send message'
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    We typically respond within 24 hours on business days.
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

    </div>
  );
}

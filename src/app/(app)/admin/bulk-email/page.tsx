'use client';
import { useState } from 'react';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from '../AdminAuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, AlertTriangle } from 'lucide-react';
import { sendBulkEmail } from '@/ai/flows/bulk-email-flow';
import { usePublicFirestoreQuery, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function BulkEmailPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');

  const { data: users, isLoading: isLoadingUsers } = usePublicFirestoreQuery(() =>
    collection(firestore, 'users')
  );

  const handleSendEmails = async () => {
    if (!subject || !htmlContent) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out both the subject and the message body.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendBulkEmail({ subject, htmlContent });
      if (result.success) {
        toast({
          title: 'Emails Sent!',
          description: `Successfully sent emails to ${result.sentCount} users.`,
        });
        setSubject('');
        setHtmlContent('');
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error: any) {
      console.error('Failed to send bulk emails:', error);
      toast({
        variant: 'destructive',
        title: 'Send Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Bulk Email Sender"
        description="Send an email to all registered users in the database."
      />
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              This email will be sent to all {isLoadingUsers ? '...' : users?.length || 0} users.
              You can use HTML for formatting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertTriangle className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Warning: Use with Extreme Caution</h4>
                <p className="text-sm">
                  This tool sends an email to every single user. Double-check your message before sending. There is no undo.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your awesome announcement"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="htmlContent">Message Body (HTML Allowed)</Label>
              <Textarea
                id="htmlContent"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<h1>Hello, Aernify User!</h1><p>Here is some great news...</p>"
                rows={10}
              />
            </div>
            <Button onClick={handleSendEmails} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Mail className="mr-2 h-4 w-4" />
              Send to All {isLoadingUsers ? '...' : users?.length || 0} Users
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminAuthWrapper>
  );
}

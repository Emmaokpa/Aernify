
import PageHeader from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Manage your app's content from here."
      />
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Admin!</CardTitle>
          <CardDescription>
            Select a category from the sidebar to start managing content for
            games, offers, the shop, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            This dashboard gives you full control over the dynamic content of
            your Earnify application.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

    
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { RelayBlockList } from '@/components/admin/relay/RelayBlockList';

export default function AdminRelayPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relay Blocks</h1>
          <p className="text-muted-foreground mt-2">
            Manage generative UI block configurations for the Relay widget
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/relay/generator">
              AI Generator
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/relay/new">
              <Plus className="mr-2 h-4 w-4" />
              New Block
            </Link>
          </Button>
        </div>
      </div>
      <RelayBlockList />
    </div>
  );
}

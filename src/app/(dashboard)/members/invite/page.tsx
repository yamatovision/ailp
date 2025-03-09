'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { InviteForm } from '@/components/members/InviteForm';
import Link from 'next/link';

export default function MemberInvitePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Link href="/members">
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            会員一覧に戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">会員を招待</h1>
          <p className="text-muted-foreground mt-1">新しい会員に招待メールを送信します</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <InviteForm />
      </div>
    </div>
  );
}
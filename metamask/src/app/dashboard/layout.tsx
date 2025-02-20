'use client';

import { useWeb3 } from '@/context/Web3Context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  return (
    <div className="flex min-h-screen">
      <nav className="w-64 bg-gray-100 p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/dashboard/send" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              Send
            </Link>
          </li>
         
        </ul>
      </nav>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
} 
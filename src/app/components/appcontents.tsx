'use client';

import React from 'react';
import Image from 'next/image';

/*
 * ヘッダ・フッタを分離
 */
export function AppContents({children}: Readonly<{children: React.ReactNode}>) {
  return (<main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 bg-gray-900 text-white">
      <div className="flex items-center">
        <Image src="/icon.png" alt="icon" width={48} height={48} className="mb-8 ml-4" />
        <h1 className="text-4xl font-bold mb-8 text-blue-400">shared crypt note</h1>
      </div>

      {children}

      <footer className="flex mt-16 text-gray-500 text-sm">
        <Image src="/dangerouswoo.png" alt="icon" width={16} height={16} className="mr-3 mb-8 ml-4" />
        Designed By DangerousWOO
      </footer>
  </main>);
}

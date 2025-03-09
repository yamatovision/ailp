import React from 'react';

export default function AssistantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-6">アシスタント管理</h1>
      {children}
    </div>
  );
}
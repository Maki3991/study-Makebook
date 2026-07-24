"use client";

import { RoleBar } from "@/app/components/console/role-bar";
import { CompilePanel } from "@/app/components/console/compile-panel";
import { AdminTable } from "@/app/components/console/admin-table";
import { FactoryPanel } from "@/app/components/console/factory-panel";

export default function ConsolePage() {
  return (
    <main className="page py-10 lg:py-16">
      <div className="space-y-6">
        <RoleBar />
        <CompilePanel />
        <FactoryPanel />
        <AdminTable />
      </div>
    </main>
  );
}

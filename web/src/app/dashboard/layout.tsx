"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import Link from "next/link";
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  
  const { user } = useGlobalContext();
  interface Option {
    href:string
    label:string
  }
  const opciones: { [key: string]: Option[] } = {
    admin: [
      { href: "/dashboard/admin/users", label: "Users Management" },
      { href: "/dashboard/admin/users/add2", label: "Add User" },
    ],
    producer: [
      { href: "/dashboard/tokenizar", label: "Tokenizar" },
      { href: "/dashboard/listatoken", label: "Lista Token" },
      { href: "/dashboard/transfer", label: "Transferir Token" },
      {
        href: "/dashboard/receivedTransfers",
        label: "Transferencias Recibidas",
      },
    ],
    factory: [
      { href: "/dashboard/tokenizar", label: "Tokenizar" },
      { href: "/dashboard/listatoken", label: "Lista Token" },
      { href: "/dashboard/transfer", label: "Transferir Token" },
      {
        href: "/dashboard/receivedTransfers",
        label: "Transferencias Recibidas",
      },
    ],
    retailer: [
      { href: "/dashboard/listatoken", label: "Lista Token" },
      { href: "/dashboard/transfer", label: "Transferir Token" },
      {
        href: "/dashboard/receivedTransfers",
        label: "Transferencias Recibidas",
      },
    ],
    consumer: [
      { href: "/dashboard/listatoken", label: "Lista Token" },
      {
        href: "/dashboard/receivedTransfers",
        label: "Transferencias Recibidas",
      },
    ],
  };

  if (!user) {
    return <p>Loading</p>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="font-medium text-bold">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.role}</div>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {opciones[user.role].map((item: Option) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  UserCircle,
  ShoppingCart,
} from "lucide-react";

function SideBar() {
  const pathname = usePathname();
  
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/categories", label: "Categories", icon: Tags },
    { href: "/dashboard/users", label: "Users", icon: Users },
    { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  ];

  const isActive = (path) => pathname === path;

  return (
    <aside className="h-screen w-64 bg-linear-to-b from-slate-800 to-slate-900 text-white flex flex-col ">
      
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${active 
                  ? 'bg-linear-to-r from-emerald-500 to-blue-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }
              `}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400'}`} />
              <span className="font-medium">{item.label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default SideBar;
import Link from "next/link";

function SideBar() {
  return (
    <main className='bg-slate-700 space-y-4'>
        <Link href="#">Dashboard</Link>
        <Link href="/products">Products</Link>
        <Link href="/categories">Categories</Link>
        <Link href="/users">Users</Link>
        <Link href="/profile">Profile</Link>
    </main>
  )
}

export default SideBar
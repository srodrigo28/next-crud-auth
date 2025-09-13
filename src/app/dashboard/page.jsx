'use client';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import ProductList from "./produto/page.jsx";

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center px-4 sm:px-6 lg:px-8">
      <Navbar />
      <main className="flex flex-col items-center w-full max-w-5xl mx-auto ">
        
        <ProductList />
        
      </main>
    </div>
  );
}
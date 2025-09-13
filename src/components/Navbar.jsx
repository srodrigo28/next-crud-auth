'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import  ProfileModal  from '../components/ProfileModal';
import Image from 'next/image';

// Importe o componente de modal, se ele estiver em um arquivo separado
// import ProfileModal from './ProfileModal';

export default function Navbar() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  // const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('loja_perfil')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        setError(profileError.message);
      } else {
        setUserProfile(profileData);
      }
      
    };
    fetchUserData();
  }, [router]);

  const openProfileModal = () => {
    setIsModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsModalOpen(false);
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div>
      <nav className="bg-slate-800 p-4 w-screen px-10">
        <div className="container mx-auto flex justify-between items-center">
          <a href="/" className="text-white text-lg font-bold w-44">MyApp</a>
          
          <div className='shadow-lg p-4 rounded-lg bg-gray-700 flex space-x-4'>
            <a href="/perfil" className="text-white mr-4">Perfil</a>
            <a href="/produtos" className="text-white">Produtos</a>
            <a href="/pedidos" className="text-white">Pedidos</a>
            <a href="/servicos" className="text-white">Serviços</a>
          </div>
          
          {/* ✅ Área do usuário com foto e nome */}
          <div className="flex items-center space-x-4 w-44">
            {userProfile && (
              <div 
                onClick={openProfileModal} 
                className="flex items-center space-x-2 cursor-pointer transition-transform duration-200 hover:scale-105"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm">
                  {userProfile.foto_perfil ? (
                    <Image 
                      src={userProfile.foto_perfil} 
                      alt="Foto de perfil" 
                      fill={true} 
                      objectFit="cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-lg font-bold">
                      {userProfile.nome ? userProfile.nome.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <span className="text-white text-md font-medium hidden md:block">{userProfile.nome || 'Usuário'}</span>
              </div>
            )}
            
            <button 
              onClick={handleLogout} 
              className="text-white px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* --- Seção de Produtos --- */}
      <section className="w-full mt-8 p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Meus Produtos</h2>
        
      </section>

      {/* --- O Modal de Perfil --- */}
      {isModalOpen && userProfile && (
        <ProfileModal 
          isOpen={isModalOpen} 
          onClose={closeProfileModal} 
          userProfile={userProfile} 
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}

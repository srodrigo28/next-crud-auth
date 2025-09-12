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
  const [products, setProducts] = useState([]);
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
      
      const { data: productsData, error: productsError } = await supabase
        .from('loja_produtos')
        .select('*');

      if (productsError) {
        console.error("Erro ao buscar produtos:", productsError);
        setError(productsError.message);
      } else {
        setProducts(productsData);
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
      <nav className="bg-gray-800 p-4 w-screen">
        <div className="container mx-auto flex justify-between items-center">
          <a href="/" className="text-white text-lg font-bold">MyApp</a>
          
          <div className='shadow-lg p-4 rounded-lg bg-gray-700 flex space-x-4'>
            <a href="/perfil" className="text-white mr-4">Perfil</a>
            <a href="/produtos" className="text-white">Produtos</a>
            <a href="/pedidos" className="text-white">Pedidos</a>
            <a href="/servicos" className="text-white">Serviços</a>
          </div>
          
          {/* ✅ Área do usuário com foto e nome */}
          <div className="flex items-center space-x-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
                {product.foto_produto && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
                    <Image 
                      src={product.foto_produto} 
                      alt={product.nome} 
                      fill={true} 
                      objectFit="cover" 
                      className="rounded-xl"
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-800">{product.nome}</h3>
                <p className="text-lg text-emerald-600 mt-2">R${product.preco.toFixed(2)}</p>
                <p className="text-gray-500 text-sm mt-1">{product.descricao}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500">
              <p>Nenhum produto cadastrado.</p>
            </div>
          )}
        </div>
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
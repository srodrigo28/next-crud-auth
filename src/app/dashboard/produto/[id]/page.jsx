'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductDetail() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado.");

        const { data: productData, error: productError } = await supabase
          .from('loja_produto')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (productError) throw productError;
        if (!productData) throw new Error("Produto não encontrado.");

        setProduct(productData);
      } catch (err) {
        console.error("Erro ao buscar produto:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleShareProduct = () => {
    if (!product) return;
    const productUrl = `${window.location.origin}/dashboard/produto/${product.id}`;
    const message = `Confira este produto: ${product.nome} - ${product.descricao || 'Sem descrição'} por ${Number(product.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}! Acesse: ${productUrl}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando produto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link
            href="/dashboard/produto"
            className="px-6 py-2 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition duration-300"
          >
            Voltar à Lista de Produtos
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Produto não encontrado.</p>
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition duration-300"
          >
            Voltar à Lista de Produtos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-emerald-800 text-center">{product.nome}</h1>
        <div className="space-y-6">
          {product.imagem && (
            <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg">
              <Image
                src={product.imagem}
                alt={product.nome}
                fill={true}
                objectFit="cover"
                className="rounded-xl"
              />
            </div>
          )}
          <div>
            <h2 className="text-lg font-medium text-gray-700">Preço</h2>
            <p className="text-2xl text-emerald-600">
              {Number(product.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-700">Descrição</h2>
            <p className="text-gray-500">{product.descricao || 'Sem descrição'}</p>
          </div>
          <div className="flex justify-between items-center mt-8">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-bold hover:bg-gray-300 transition duration-300"
            >
              Voltar
            </Link>
            <button
              onClick={handleShareProduct}
              className="px-6 py-3 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition duration-300 flex items-center space-x-2"
              aria-label={`Compartilhar ${product.nome} via WhatsApp`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.452 20.45c-1.34 1.342-3.135 2.086-5.033 2.086-1.898 0-3.694-.744-5.033-2.086-1.342-1.34-2.086-3.135-2.086-5.033s.744-3.694 2.086-5.033l4.583 4.583c.128.128.3.2.482.2s.354-.072.482-.2l4.583-4.583c1.342 1.34 2.086 3.135 2.086 5.033s-.744 3.694-2.086 5.033zm-5.515-6.615l-4.583-4.583c-.128-.128-.3-.2-.482-.2s-.354.072-.482.2l-4.583 4.583c-1.342-1.34-2.086-3.135-2.086-5.033s.744-3.694 2.086-5.033c1.34-1.342 3.135-2.086 5.033-2.086s3.694.744 5.033 2.086c1.342 1.34 2.086 3.135 2.086 5.033s-.744 3.694-2.086 5.033zm6.997-5.033c0-2.347-.914-4.55-2.568-6.204-1.654-1.654-3.857-2.568-6.204-2.568s-4.55.914-6.204 2.568c-1.654 1.654-2.568 3.857-2.568 6.204s.914 4.55 2.568 6.204c1.654 1.654 3.857 2.568 6.204 2.568s4.55-.914 6.204-2.568c1.654-1.654 2.568-3.857 2.568-6.204zm-9.934-1.416l3.416-3.416 1.416 1.416-3.416 3.416 3.416 3.416-1.416 1.416-3.416-3.416-3.416 3.416-1.416-1.416 3.416-3.416-3.416-3.416 1.416-1.416 3.416 3.416z"/>
              </svg>
              <span>Compartilhar</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
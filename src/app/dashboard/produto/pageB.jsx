'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase'; // ✅ Use a importação do lib
import Image from 'next/image';

// Este componente é o modal de CRUD de produtos
function ProductModal({ isOpen, onClose, productData, onProductSaved }) {
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        preco: '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (productData) {
                setFormData({
                    nome: productData.nome || '',
                    descricao: productData.descricao || '',
                    preco: productData.preco || '',
                });
                setImagePreview(productData.imagem || null);
            } else {
                setFormData({ nome: '', descricao: '', preco: '' });
                setImagePreview(null);
            }
            setImageFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [isOpen, productData]);

    if (!isOpen) {
        return null;
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Usuário não autenticado");

            let imageUrl = productData?.imagem;

            if (imageFile) {
                // Remove a foto antiga se houver uma nova
                if (productData?.imagem) {
                    const oldFilePath = productData.imagem.split('/').pop();
                    await supabase.storage.from('box').remove([`produtos/${session.user.id}/${oldFilePath}`]);
                }
                
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `produtos/${session.user.id}/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('box')
                    .upload(filePath, imageFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage.from('box').getPublicUrl(filePath);
                imageUrl = publicUrlData.publicUrl;
            }

            const productDataToSave = {
                nome: formData.nome,
                descricao: formData.descricao,
                preco: parseFloat(formData.preco),
                imagem: imageUrl,
                user_id: session.user.id,
            };

            let saveResult;
            if (productData) {
                saveResult = await supabase
                    .from('loja_produto')
                    .update(productDataToSave)
                    .eq('id', productData.id)
                    .select()
                    .single();
            } else {
                saveResult = await supabase
                    .from('loja_produto')
                    .insert(productDataToSave)
                    .select()
                    .single();
            }

            if (saveResult.error) throw saveResult.error;

            onProductSaved(saveResult.data);
            onClose();

        } catch (err) {
            console.error("Erro ao salvar produto:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 animate-fade-in-up">
                <h3 className="text-3xl font-bold mb-8 text-emerald-800 text-center">
                    {productData ? 'Editar Produto' : 'Adicionar Produto'}
                </h3>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleSaveProduct} className="space-y-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative w-40 h-40 rounded-xl overflow-hidden border-4 border-gray-200 shadow-lg mb-4">
                            {imagePreview ? (
                                <Image src={imagePreview} alt="Prévia do produto" fill={true} objectFit="cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                                    Sem imagem
                                </div>
                            )}
                        </div>
                        <label className="block w-full text-center">
                            <span className="sr-only">Escolher nova imagem</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                            />
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-gray-700 font-medium">Nome</span>
                        <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Nome do Produto" required className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150" />
                    </label>

                    <label className="block">
                        <span className="text-gray-700 font-medium">Descrição</span>
                        <textarea name="descricao" value={formData.descricao} onChange={handleInputChange} placeholder="Breve descrição do produto" rows="3" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150" />
                    </label>

                    <label className="block">
                        <span className="text-gray-700 font-medium">Preço</span>
                        <input type="number" step="0.01" name="preco" value={formData.preco} onChange={handleInputChange} placeholder="0.00" required className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150" />
                    </label>

                    <div className="flex justify-end space-x-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-bold hover:bg-gray-300 transition duration-300"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition duration-300 shadow-md"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar Produto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Este componente é a listagem e o gerenciador de produtos
export default function ProductListB() {
    const [products, setProducts] = useState([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuário não autenticado.");

                const { data: productsData, error: productsError } = await supabase
                    .from('loja_produto')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
    
                if (productsError) throw productsError;
                setProducts(productsData || []);

            } catch (err) {
                console.error("Erro ao buscar produtos:", err);
                setError("Erro ao carregar produtos. Tente novamente.");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const openProductModal = (product = null) => {
        setEditingProduct(product);
        setIsProductModalOpen(true);
    };

    const closeProductModal = () => {
        setIsProductModalOpen(false);
        setEditingProduct(null);
    };

    const handleProductSaved = (savedProduct) => {
        const isNew = !products.some(p => p.id === savedProduct.id);
        if (isNew) {
            setProducts(prev => [savedProduct, ...prev]);
        } else {
            setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm("Tem certeza que deseja excluir este produto?")) {
            try {
                const { error: deleteError } = await supabase
                    .from('loja_produto')
                    .delete()
                    .eq('id', productId);
                
                if (deleteError) throw deleteError;

                setProducts(prev => prev.filter(p => p.id !== productId));
            } catch (err) {
                console.error("Erro ao excluir produto:", err.message);
                setError("Erro ao excluir produto. Tente novamente.");
            }
        }
    };

    return (
        <section className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Meus Produtos</h2>
                <button
                    onClick={() => openProductModal()}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition duration-300 shadow-md flex items-center space-x-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>Adicionar Produto</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center text-gray-500">Carregando produtos...</div>
            ) : error ? (
                <div className="text-center text-red-500">{error}</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.length > 0 ? (
                        products.map((product) => (
                            <div key={product.id} className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 
                            hover:shadow-xl hover:scale-105 w-96">
                                {product.imagem && (
                                    <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
                                        <Image
                                            src={product.imagem}
                                            alt={product.nome}
                                            fill={true}
                                            objectFit="cover"
                                            className="rounded-xl"
                                        />
                                    </div>
                                )}
                                <h3 className="text-xl font-semibold text-gray-800">{product.nome}</h3>
                                
                                <p className="text-lg text-emerald-600 mt-2">
                                  {Number(product.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>

                                <p className="text-gray-500 text-sm mt-1">{product.descricao}</p>
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button
                                        onClick={() => openProductModal(product)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold hover:bg-blue-600 transition duration-300"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600 transition duration-300"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-500">
                            <p>Nenhum produto cadastrado.</p>
                        </div>
                    )}
                </div>
            )}
            
            <ProductModal
                isOpen={isProductModalOpen}
                onClose={closeProductModal}
                productData={editingProduct}
                onProductSaved={handleProductSaved}
            />
        </section>
    );
}
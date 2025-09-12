"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { Plus, Edit, Trash2, Share2 } from "lucide-react"
import ProductModal from "./ProductModal" // Importa o componente do modal

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Usuário não autenticado.")

        const { data: productsData, error: productsError } = await supabase
          .from("loja_produto")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (productsError) throw productsError
        setProducts(productsData || [])
      } catch (err) {
        console.error("Erro ao buscar produtos:", err)
        setError("Erro ao carregar produtos. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const link_interno = "http://localhost:3000/dashboard/produto"

  const handleShareProduct = (product) => {
    const productUrl = `${link_interno}/${product.id}`

    const message =
      `🛍️ *${product.image}*\n\n` +
      `🛍️ *${product.nome}*\n\n` +
      `💰 *${Number(product.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}*\n\n` +
      `${product.descricao ? `📝 ${product.descricao}\n\n` : ""}` +
      `🔗 *Veja mais detalhes:*\n${productUrl}\n\n` +
      `✨ _Produto disponível agora!_`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
  }

  const filteredProducts = products.filter(
    (product) =>
      product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.descricao && product.descricao.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const openProductModal = (product = null) => {
    setEditingProduct(product)
    setIsProductModalOpen(true)
  }

  const closeProductModal = () => {
    setIsProductModalOpen(false)
    setEditingProduct(null)
  }

  const handleProductSaved = (savedProduct) => {
    const isNew = !products.some((p) => p.id === savedProduct.id)
    if (isNew) {
      setProducts((prev) => [savedProduct, ...prev])
    } else {
      setProducts((prev) => prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)))
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        const { error: deleteError } = await supabase.from("loja_produto").delete().eq("id", productId)

        if (deleteError) throw deleteError

        setProducts((prev) => prev.filter((p) => p.id !== productId))
      } catch (err) {
        console.error("Erro ao excluir produto:", err.message)
        setError("Erro ao excluir produto. Tente novamente.")
      }
    }
  }

  return (
    <section className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Meus Produtos</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Pesquisar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 w-64 border border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150"
          />
          <button
            onClick={() => openProductModal()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition duration-300 shadow-md flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Adicionar Produto</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Carregando produtos...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden max-w-sm cursor-pointer mx-2"
              >
                <div className="relative w-full h-64 bg-gray-100">
                  {product.imagem ? (
                    <Image
                      src={product.imagem}
                      alt={product.nome}
                      fill={true}
                      style={{ objectFit: "cover" }}
                      className="transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = "/generic-product-display.png"
                      }}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Sem imagem</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">{product.nome}</h3>
                  {product.descricao && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">{product.descricao}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-2xl font-bold text-emerald-600">
                      {Number(product.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                  <div className="flex justify-between space-x-2">
                    <button
                      onClick={() => openProductModal(product)}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition duration-300 flex items-center justify-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleShareProduct(product)}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition duration-300 flex items-center justify-center space-x-1"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition duration-300 flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500">
              <p>{searchTerm ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}</p>
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
  )
}
"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { Plus, Edit, Trash2, Share2 } from "lucide-react"

function ProductModal({ isOpen, onClose, productData, onProductSaved }) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
  })
  const [formattedPrice, setFormattedPrice] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      if (productData) {
        setFormData({
          nome: productData.nome || "",
          descricao: productData.descricao || "",
          preco: productData.preco,
        })
        setFormattedPrice(formatToBRL(productData.preco))
        setImagePreview(productData.imagem || null)
      } else {
        setFormData({ nome: "", descricao: "", preco: "" })
        setFormattedPrice("")
        setImagePreview(null)
      }
      setImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [isOpen, productData])

  if (!isOpen) {
    return null
  }

  const handlePriceChange = (e) => {
    let value = e.target.value
    value = value.replace(/\D/g, "")

    let number = Number.parseInt(value, 10) / 100
    if (isNaN(number)) {
      number = ""
    }

    setFormattedPrice(formatToBRL(number))
    setFormData((prev) => ({
      ...prev,
      preco: number,
    }))
  }

  const formatToBRL = (value) => {
    if (value === null || value === undefined || value === "") return ""
    const numberValue = Number(value)
    if (isNaN(numberValue)) return ""
    return numberValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name !== "preco") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImageFile(null)
      setImagePreview(null)
    }
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error("Usuário não autenticado")

      let imageUrl = productData?.imagem

      if (imageFile) {
        if (productData?.imagem) {
          const oldFilePath = productData.imagem.split("/").pop()
          await supabase.storage.from("box").remove([`produtos/${session.user.id}/${oldFilePath}`])
        }

        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `produtos/${session.user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("box").upload(filePath, imageFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from("box").getPublicUrl(filePath)
        imageUrl = publicUrlData.publicUrl
      }

      const productDataToSave = {
        nome: formData.nome,
        descricao: formData.descricao,
        preco: formData.preco,
        imagem: imageUrl,
        user_id: session.user.id,
      }

      let saveResult
      if (productData) {
        saveResult = await supabase
          .from("loja_produto")
          .update(productDataToSave)
          .eq("id", productData.id)
          .select()
          .single()
      } else {
        saveResult = await supabase.from("loja_produto").insert(productDataToSave).select().single()
      }

      if (saveResult.error) throw saveResult.error

      onProductSaved(saveResult.data)
      onClose()
    } catch (err) {
      console.error("Erro ao salvar produto:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 animate-fade-in-up">
        <h3 className="text-3xl font-bold mb-8 text-emerald-800 text-center">
          {productData ? "Editar Produto" : "Adicionar Produto"}
        </h3>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-40 h-40 rounded-xl overflow-hidden border-4 border-gray-200 shadow-lg mb-4">
              {imagePreview ? (
                <Image
                  src={imagePreview || "/placeholder.svg"}
                  alt="Prévia do produto"
                  fill={true}
                  style={{ objectFit: "cover" }}
                  onError={(e) => {
                    e.currentTarget.src = "/generic-product-display.png"
                  }}
                />
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
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              placeholder="Nome do Produto"
              required
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150"
            />
          </label>

          <label className="block">
            <span className="text-gray-700 font-medium">Descrição</span>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleInputChange}
              placeholder="Breve descrição do produto"
              rows="3"
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150"
            />
          </label>

          <label className="block">
            <span className="text-gray-700 font-medium">Preço</span>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
              <input
                type="text"
                name="preco"
                value={formattedPrice}
                onChange={handlePriceChange}
                placeholder="0,00"
                required
                className="pl-10 block w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150"
              />
            </div>
          </label>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-white rounded-full font-bold hover:bg-gray-300 transition duration-300"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition duration-300 shadow-md"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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

  // Função para compartilhar o produto via WhatsApp
  const handleShareProduct = (product) => {
    const productUrl = `${link_interno}/${product.id}`

    // Formatação melhorada da mensagem
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
                className="bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden max-w-sm mx-auto"
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

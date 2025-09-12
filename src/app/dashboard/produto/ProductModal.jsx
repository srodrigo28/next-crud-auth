"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

export default function ProductModal({ isOpen, onClose, productData, onProductSaved }) {
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
              className="px-6 py-3 bg-red-400 text-white rounded-full font-bold cursor-pointer hover:bg-red-600 transition duration-300"
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
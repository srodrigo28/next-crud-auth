'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Image from 'next/image';

export default function ProfileModal({ isOpen, onClose, userProfile, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    nome: '',
    sexo: '',
    pais: '',
    estado: '',
  });
  const [fotoFile, setFotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userProfile && isOpen) {
      setFormData({
        nome: userProfile?.nome || '',
        sexo: userProfile?.sexo || '',
        pais: userProfile?.pais || '',
        estado: userProfile?.estado || '',
      });
      setPhotoPreview(userProfile?.foto_perfil || null);
      setFotoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [userProfile, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setFotoFile(null);
      setPhotoPreview(userProfile?.foto_perfil || null);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      let fotoUrl = userProfile?.foto_perfil;

      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `perfil/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('box')
          .upload(filePath, fotoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('box')
          .getPublicUrl(filePath);

        fotoUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('loja_perfil')
        .update({
          nome: formData.nome,
          sexo: formData.sexo,
          pais: formData.pais,
          estado: formData.estado,
          foto_perfil: fotoUrl,
        })
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;
      
      // Chama a função de callback do componente pai
      onProfileUpdate({ ...userProfile, ...formData, foto_perfil: fotoUrl });
      onClose(); // Fecha o modal após o sucesso

    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white bg-opacity-70 flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 animate-fade-in-up">
        <h3 className="text-3xl font-bold mb-8 text-emerald-800 text-center">Meu Perfil</h3>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-400 shadow-lg mb-4">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Prévia da foto de perfil"
                  layout="fill"
                  objectFit="cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-5xl font-bold">
                  {formData.nome ? formData.nome.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <label className="block w-full text-center">
              <span className="sr-only">Escolher nova foto</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer"
              />
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-gray-700 font-medium">Nome</span>
              <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Seu nome completo" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150" />
            </label>
            <label className="block">
              <span className="text-gray-700 font-medium">Email (somente leitura)</span>
              <input type="email" value={userProfile?.email || ''} disabled className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed" />
            </label>
            <label className="block">
              <span className="text-gray-700 font-medium">Sexo</span>
              <select name="sexo" value={formData.sexo} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150">
                <option value="">Selecione o sexo</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </label>
            <label className="block">
              <span className="text-gray-700 font-medium">País</span>
              <input type="text" name="pais" value={formData.pais} onChange={handleInputChange} placeholder="Seu país" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150" />
            </label>
            <label className="block col-span-full">
              <span className="text-gray-700 font-medium">Estado</span>
              <input type="text" name="estado" value={formData.estado} onChange={handleInputChange} placeholder="Seu estado" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150" />
            </label>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-bold hover:bg-gray-300 transition duration-300">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition duration-300 shadow-md">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
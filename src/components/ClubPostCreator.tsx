import React, { useState, useRef } from "react";
import { Upload, X, Send, Image as ImageIcon } from "lucide-react";

interface ClubPostCreatorProps {
  userName?: string;
  onPostSubmit?: (post: ClubPost) => void;
  className?: string;
}

export interface ClubPost {
  id?: string;
  author: string;
  testimonial: string;
  images: string[];
  createdAt?: Date;
  likes?: number;
  comments?: number;
}

export default function ClubPostCreator({
  userName = "Usuário",
  onPostSubmit,
  className = "",
}: ClubPostCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [testimonial, setTestimonial] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lidar com upload de imagens
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Máximo 3 imagens
    if (images.length >= 3) {
      alert("Máximo de 3 imagens por post");
      return;
    }

    for (let i = 0; i < Math.min(files.length, 3 - images.length); i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target?.result as string]);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  // Remover imagem
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submeter post
  const handleSubmit = async () => {
    if (!testimonial.trim()) {
      alert("Por favor, escreva um depoimento");
      return;
    }

    setIsSubmitting(true);

    try {
      const post: ClubPost = {
        author: userName,
        testimonial,
        images,
        createdAt: new Date(),
        likes: 0,
        comments: 0,
      };

      // Chamar callback ou enviar para servidor
      if (onPostSubmit) {
        onPostSubmit(post);
      } else {
        // Enviar para servidor
        const response = await fetch("/api/club/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(post),
        });

        if (!response.ok) throw new Error("Falha ao criar post");
      }

      // Reset
      setTestimonial("");
      setImages([]);
      setIsOpen(false);

      alert("Post criado com sucesso! 🎉");
    } catch (error) {
      console.error("Erro ao criar post:", error);
      alert("Erro ao criar post. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Botão para abrir criador */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-600 transition flex items-center justify-center gap-2 ${className}`}
        >
          <ImageIcon className="w-5 h-5" />
          Compartilhar Sua História
        </button>
      )}

      {/* Modal de criação */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 flex items-center justify-between border-b">
              <h3 className="text-xl font-bold">Compartilhe Seu Depoimento</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-green-600 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Autor */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={userName}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              {/* Depoimento */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Seu Depoimento
                </label>
                <textarea
                  value={testimonial}
                  onChange={(e) => setTestimonial(e.target.value)}
                  placeholder="Compartilhe sua experiência com a Planta & Raiz... Como o tratamento mudou sua vida?"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={5}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {testimonial.length}/500 caracteres
                </div>
              </div>

              {/* Imagens */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Imagens (máximo 3)
                </label>

                {/* Preview de imagens */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                {images.length < 3 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-green-500 rounded-lg p-4 text-center hover:bg-green-50 transition cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-700">
                      Clique para fazer upload
                    </p>
                    <p className="text-xs text-gray-500">
                      {3 - images.length} imagem(ns) restante(s)
                    </p>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  💡 <span className="font-bold">Dica:</span> Compartilhe fotos de antes e depois,
                  momentos especiais ou qualquer coisa que represente sua jornada de saúde!
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !testimonial.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Enviando..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

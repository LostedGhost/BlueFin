// IdentityVerification.tsx - Version complète
import { useState } from 'react';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, FileText, Camera, X } from 'lucide-react';
import { v1Api } from '../../services/api';

interface IdentityVerificationProps {
  onNavigate?: (route: any) => void;
  onVerificationComplete?: () => void;
}

export function IdentityVerification({ onNavigate, onVerificationComplete }: IdentityVerificationProps) {
  const [documentType, setDocumentType] = useState<'cni' | 'passeport'>('cni');
  const [frontDocument, setFrontDocument] = useState<File | null>(null);
  const [backDocument, setBackDocument] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontDocument(file);
      const reader = new FileReader();
      reader.onloadend = () => setFrontPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackDocument(file);
      const reader = new FileReader();
      reader.onloadend = () => setBackPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!frontDocument) {
      setError('Veuillez sélectionner le recto de votre pièce d\'identité');
      return;
    }

    if (documentType === 'cni' && !backDocument) {
      setError('Veuillez sélectionner le verso de votre CNI');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Envoyer le recto
      const formDataFront = new FormData();
      formDataFront.append('identity_document', frontDocument);
      formDataFront.append('document_type', documentType);
      
      await v1Api.post('/host/verify-identity', formDataFront, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Si CNI, envoyer aussi le verso
      if (documentType === 'cni' && backDocument) {
        const formDataBack = new FormData();
        formDataBack.append('identity_document', backDocument);
        formDataBack.append('document_type', documentType);
        await v1Api.post('/host/verify-identity', formDataBack, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setSuccess(true);
      
      setTimeout(() => {
        if (onVerificationComplete) {
          onVerificationComplete();
        } else {
          onNavigate?.({ name: 'host-listings' });
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('Erreur vérification:', error);
      setError(error.response?.data?.message || 'Erreur lors de la vérification');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#f4fffe] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F2940] mb-2">Vérification envoyée !</h2>
          <p className="text-gray-600 mb-4">
            Vos documents ont été soumis avec succès. Nous les examinerons dans les plus brefs délais.
          </p>
          <p className="text-sm text-gray-500">
            Vous recevrez une notification dès que votre identité sera vérifiée.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#f4fffe]">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-4">
        <button 
          onClick={() => onNavigate?.({ name: 'host-listings' })} 
          className="text-sm text-gray-500 flex items-center gap-2 hover:text-[#00c9a7] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Retour
        </button>
        <h1 className="text-xl font-bold text-[#0F2940] mt-2">Vérification d'identité</h1>
        <p className="text-sm text-gray-500">Vérifiez votre identité pour publier des annonces</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800">Vérification requise</h3>
              <p className="text-sm text-yellow-700">
                Pour garantir la sécurité de notre communauté, vous devez vérifier votre identité 
                avant de pouvoir publier des annonces.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de document
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDocumentType('cni')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  documentType === 'cni'
                    ? 'border-[#00c9a7] bg-[#00c9a7]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                <span className="text-sm font-medium">Carte d'identité (CNI)</span>
              </button>
              <button
                type="button"
                onClick={() => setDocumentType('passeport')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  documentType === 'passeport'
                    ? 'border-[#00c9a7] bg-[#00c9a7]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                <span className="text-sm font-medium">Passeport</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Recto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recto du document *
              </label>
              <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                frontPreview ? 'border-[#00c9a7] bg-[#00c9a7]/5' : 'border-gray-300 hover:border-[#00c9a7]'
              }`}>
                {frontPreview ? (
                  <div className="relative">
                    <img src={frontPreview} alt="Recto" className="max-h-48 mx-auto rounded-lg" />
                    <button
                      onClick={() => {
                        setFrontDocument(null);
                        setFrontPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFrontFileChange}
                      className="hidden"
                    />
                    <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Cliquez pour télécharger le recto</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG ou PDF (max 5MB)</p>
                  </label>
                )}
              </div>
            </div>

            {/* Verso (uniquement pour CNI) */}
            {documentType === 'cni' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verso du document *
                </label>
                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                  backPreview ? 'border-[#00c9a7] bg-[#00c9a7]/5' : 'border-gray-300 hover:border-[#00c9a7]'
                }`}>
                  {backPreview ? (
                    <div className="relative">
                      <img src={backPreview} alt="Verso" className="max-h-48 mx-auto rounded-lg" />
                      <button
                        onClick={() => {
                          setBackDocument(null);
                          setBackPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleBackFileChange}
                        className="hidden"
                      />
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Cliquez pour télécharger le verso</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG ou PDF (max 5MB)</p>
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !frontDocument || (documentType === 'cni' && !backDocument)}
            className="w-full mt-6 bg-gradient-to-r from-[#00c9a7] to-[#0f2940] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Envoi en cours...' : 'Soumettre pour vérification'}
          </button>
        </div>
      </div>
    </div>
  );
}
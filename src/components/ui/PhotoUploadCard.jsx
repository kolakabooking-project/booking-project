import { useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function PhotoUploadCard({ label, value, onChange, maxSizeMB = 1 }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Ukuran file maksimal adalah ${maxSizeMB}MB`);
      e.target.value = ''; // Reset input
      return;
    }

    // Check type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = (e) => {
    e.stopPropagation(); // Prevent opening file dialog
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-semibold text-[color:var(--color-heading)]">{label}</label>}
      
      <div 
        onClick={() => !value && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all
          ${value ? 'border-[color:var(--color-border)] p-2' : 'border-[color:var(--color-border)] hover:border-djp-blue hover:bg-djp-blue/[0.02] cursor-pointer py-6 px-4'}
        `}
      >
        <input 
          type="file" 
          ref={inputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        {value ? (
          <div className="relative w-full h-40 group">
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-full object-contain rounded-lg bg-gray-50 dark:bg-gray-800/50" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <button 
                type="button"
                onClick={handleClear}
                className="bg-danger text-white rounded-full p-2 hover:bg-danger-hover transition-colors"
                title="Hapus foto"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-soft)]">
              <UploadCloud size={24} />
            </div>
            <p className="text-sm font-heading font-semibold text-[color:var(--color-heading)]">
              Klik untuk unggah foto
            </p>
            <p className="mt-1 text-xs text-[color:var(--color-text-soft)]">
              Maksimal {maxSizeMB}MB. (PNG, JPG, JPEG)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

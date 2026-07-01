import { useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, ListOrdered, List,
  AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';

export default function RichTextEditor({
  label,
  value = '',
  onChange,
  placeholder = 'Tulis pesan penjelasan di sini...',
  required = false,
  error,
  disabled = false,
  className = '',
}) {
  const editorRef = useRef(null);

  // Sync value from parent when it changes externally (e.g. form reset or edit load)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleCommand = (command, arg = false) => {
    if (disabled) return;
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange && onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // If empty <br> or <div><br></div> from clearing, treat as empty string
      const cleanHtml = html === '<br>' || html === '<div><br></div>' ? '' : html;
      onChange && onChange(cleanHtml);
    }
  };

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Bold (Ctrl+B)' },
    { icon: Italic, command: 'italic', title: 'Italic (Ctrl+I)' },
    { icon: Underline, command: 'underline', title: 'Underline (Ctrl+U)' },
    { divider: true },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Penomoran (1, 2, 3)' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { divider: true },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Rata Kiri' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Rata Tengah' },
    { icon: AlignRight, command: 'justifyRight', title: 'Rata Kanan' },
    { icon: AlignJustify, command: 'justifyFull', title: 'Justify' },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-heading font-semibold text-[color:var(--color-text-muted)]">
          {label}
          {required && <span aria-hidden="true" className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div
        className={`rounded-2xl border bg-[color:var(--color-surface)] overflow-hidden transition-all duration-200 ${
          error ? 'border-danger/70 bg-danger-light/10' : 'focus-within:border-djp-blue focus-within:ring-1 focus-within:ring-djp-blue'
        }`}
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center gap-1 p-2 border-b bg-[color:var(--color-surface-elevated)]/50"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {toolbarButtons.map((btn, i) =>
            btn.divider ? (
              <div key={i} className="w-[1px] h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
            ) : (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleCommand(btn.command)}
                title={btn.title}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text)] transition-colors disabled:opacity-40"
              >
                <btn.icon size={16} />
              </button>
            )
          )}
        </div>

        {/* Editable Area */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onBlur={handleInput}
          data-placeholder={placeholder}
          className={`p-4 min-h-[140px] max-h-[300px] overflow-y-auto font-body text-[color:var(--color-text)] focus:outline-none rich-text-content max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-[color:var(--color-text-soft)] empty:before:pointer-events-none ${
            disabled ? 'opacity-60 bg-black/5 cursor-not-allowed' : ''
          }`}
          style={{
            wordBreak: 'break-word',
          }}
        />
      </div>

      {error && <p role="alert" className="text-xs text-danger font-body">{error}</p>}
    </div>
  );
}

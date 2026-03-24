import { useEffect, useRef } from 'react';
import Quill from 'quill';
import { toast } from 'react-toastify';
import 'quill/dist/quill.snow.css';
import { postFormData, ENDPOINTS } from '../service/api';

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image', 'blockquote', 'clean'],
];

function RichTextEditor({
  initialValue = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  attachmentUrl = null,
  attachmentType = null,
  onAttachFile,
  onRemoveFile,
}) {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const fileInputRef = useRef(null);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    const container = wrapperRef.current;
    if (!container) return;

    // Always wipe first — works with React StrictMode double-invoke.
    // Captured `container` stays valid even if wrapperRef.current is cleared.
    container.innerHTML = '';
    quillRef.current = null;

    const mountEl = document.createElement('div');
    container.appendChild(mountEl);

    const quill = new Quill(mountEl, {
      theme: 'snow',
      placeholder,
      readOnly: disabled,
      modules: {
        toolbar: {
          container: TOOLBAR_OPTIONS,
          handlers: {
            image: function () {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/jpeg,image/png,image/gif,image/webp';
              input.click();
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                try {
                  const formData = new FormData();
                  formData.append('image', file);
                  const res = await postFormData(ENDPOINTS.CLOUDINARY.UPLOAD_BLOG_IMAGE, formData);
                  if (res.status === 'success' && res.data?.url) {
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', res.data.url, 'user');
                    quill.setSelection(range.index + 1, 0);
                  } else {
                    toast.error('Upload ảnh thất bại');
                  }
                } catch (err) {
                  toast.error('Upload ảnh thất bại: ' + err.message);
                }
              };
            },
          },
        },
      },
    });

    if (initialValue) {
      quill.clipboard.dangerouslyPasteHTML(initialValue);
    }

    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      const isEmpty = html === '<p><br></p>' || html === '';
      onChangeRef.current(isEmpty ? '' : html);
    });

    quillRef.current = quill;

    return () => {
      quillRef.current = null;
      container.innerHTML = '';  // use captured ref — works even if wrapperRef.current was cleared
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!quillRef.current) return;
    quillRef.current.enable(!disabled);
  }, [disabled]);

  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onAttachFile) return;
    await onAttachFile(file);
    e.target.value = '';
  };

  const showAttachment = onAttachFile !== undefined || attachmentUrl !== null;

  return (
    <div className={`rounded-md border border-gray-300 overflow-hidden ${disabled ? 'opacity-60' : ''}`}>
      {/* Quill editor */}
      <div ref={wrapperRef} />

      {/* Bottom bar — file attachment */}
      {showAttachment && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-1.5">
          {attachmentUrl ? (
            /* File đã đính kèm */
            <div className="flex items-center gap-2 min-w-0">
              <span>{attachmentType === 'pdf' ? '📄' : '📝'}</span>
              <span className="truncate text-xs text-gray-600 max-w-xs">
                {decodeURIComponent(attachmentUrl.split('/').pop())}
              </span>
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline shrink-0"
              >
                Xem
              </a>
              {onRemoveFile && (
                <button
                  type="button"
                  onClick={onRemoveFile}
                  className="text-xs text-red-500 hover:text-red-700 shrink-0"
                >
                  × Xóa
                </button>
              )}
            </div>
          ) : (
            /* Nút đính kèm */
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileInputChange}
                disabled={disabled}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 transition-colors"
              >
                📎 Đính kèm tập tin
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default RichTextEditor;

'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

type Props = {
  communityId: string;
  onSuccess: (count: number) => void;
};

export default function CsvUploader({ communityId, onSuccess }: Props) {
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [parsed, setParsed] = useState<Record<string, string>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        setParsed(data);
        setPreview(data.slice(0, 3));
        setError('');
      },
      error: () => setError('Failed to parse CSV. Check the file format.'),
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  async function upload() {
    setUploading(true);
    setError('');
    const res = await fetch('/api/data/upload-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: parsed, community_id: communityId }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setUploading(false); return; }
    setParsed([]);
    setPreview([]);
    onSuccess(data.inserted);
    setUploading(false);
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-3xl mb-2">📁</div>
        <p className="text-sm text-gray-600">
          {isDragActive ? 'Drop your CSV here' : 'Drag & drop your Swiggy/Zomato CSV, or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">Columns needed: date, merchant_name / Restaurant, amount / ORDER_TOTAL</p>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

      {preview.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 font-medium">{parsed.length} rows found — preview:</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0]).slice(0, 5).map(k => (
                    <th key={k} className="px-3 py-2 text-left text-gray-500 font-medium">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {Object.values(row).slice(0, 5).map((v, j) => (
                      <td key={j} className="px-3 py-2 text-gray-700 truncate max-w-[120px]">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={upload}
            disabled={uploading}
            className="w-full bg-green-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading...' : `Upload ${parsed.length} records`}
          </button>
        </div>
      )}
    </div>
  );
}

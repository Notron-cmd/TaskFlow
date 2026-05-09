'use server'

import type { Note } from '@/stores/notesStore'

/**
 * Generate HTML for printing notes
 */
export async function generateNotesPrintHTML(notes: Note[]): Promise<string> {
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#10b981',
    yellow: '#f59e0b',
    purple: '#a855f7',
    pink: '#ec4899',
  }

  const notesHTML = notes
    .map((note) => {
      const color = colorMap[note.color || 'blue'] || colorMap.blue
      const tags = note.tags?.join(', ') || ''
      const createdDate = new Date(note.created_at).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const createdTime = new Date(note.created_at).toLocaleTimeString('id-ID')

      return `
    <div style="page-break-inside: avoid; margin-bottom: 25px; padding: 20px; border-left: 4px solid ${color}; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1f2937; word-break: break-word;">
          ${escapeHTML(note.title)}
        </h2>
        ${note.pinned ? '<span style="background-color: #fbbf24; color: #78350f; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">📌 Pinned</span>' : ''}
      </div>
      
      ${note.category ? `<p style="margin: 0 0 8px 0; color: #6366f1; font-size: 13px; font-weight: 600;">📁 ${escapeHTML(note.category)}</p>` : ''}
      
      <div style="background-color: white; padding: 15px; border-radius: 6px; margin-bottom: 12px; min-height: 80px; line-height: 1.6; color: #374151; font-size: 14px; white-space: pre-wrap; word-break: break-word;">
        ${escapeHTML(note.content)}
      </div>
      
      ${tags ? `<p style="margin: 0 0 8px 0; font-size: 12px;"><strong>Tags:</strong> ${escapeHTML(tags)}</p>` : ''}
      
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px;">
        <span>📅 ${createdDate}</span>
        <span>🕐 ${createdTime}</span>
      </div>
    </div>
  `
    })
    .join('')

  const totalNotes = notes.length
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const html = `
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notes Export</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        line-height: 1.5;
        color: #1f2937;
        background-color: white;
        padding: 40px 30px;
      }
      
      .header {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .header h1 {
        font-size: 32px;
        font-weight: 700;
        color: #000;
        margin-bottom: 5px;
      }
      
      .header .date-info {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 3px;
      }
      
      .header .total-notes {
        font-size: 13px;
        color: #9ca3af;
      }
      
      .notes-container {
        max-width: 900px;
        margin: 0 auto;
      }
      
      @media print {
        body {
          padding: 20px;
          background-color: white;
        }
        .no-print {
          display: none;
        }
        .notes-container {
          max-width: 100%;
        }
      }
      
      @page {
        margin: 2cm;
        size: A4;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>📝 Catatan Saya</h1>
      <div class="date-info">Diekspor pada: ${currentDate}</div>
      <div class="total-notes">Total Catatan: ${totalNotes}</div>
    </div>
    
    <div class="notes-container">
      ${notesHTML}
    </div>
    
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          window.print();
        }, 500);
      });
    </script>
  </body>
  </html>
  `

  return html
}

/**
 * Export notes as HTML string
 */
export async function exportNotesAsHTML(notes: Note[]): Promise<string> {
  return generateNotesPrintHTML(notes)
}

/**
 * Export notes as Markdown
 */
export async function exportNotesAsMarkdown(notes: Note[]): Promise<string> {
  const markdown = notes
    .map((note) => {
      const createdDate = new Date(note.created_at).toLocaleDateString('id-ID')
      const category = note.category ? `\n**Kategori:** ${note.category}\n` : ''
      const tags = note.tags && note.tags.length > 0 ? `\n**Tags:** ${note.tags.join(', ')}\n` : ''
      const pinned = note.pinned ? '\n⭐ **Pinned**\n' : ''

      return `## ${note.title}

${category}${tags}${pinned}
---

${note.content}

*Dibuat: ${createdDate}*

---
`
    })
    .join('\n\n')

  return `# Catatan Saya\n\nDiekspor pada: ${new Date().toLocaleDateString('id-ID')}\n\nTotal Catatan: ${notes.length}\n\n---\n\n${markdown}`
}

/**
 * Export notes as JSON
 */
export async function exportNotesAsJSON(notes: Note[]): Promise<string> {
  const data = {
    exported_at: new Date().toISOString(),
    total_notes: notes.length,
    notes: notes,
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Export notes as CSV
 */
export async function exportNotesAsCSV(notes: Note[]): Promise<string> {
  const headers = ['Title', 'Content', 'Category', 'Tags', 'Created At', 'Updated At', 'Pinned']

  const rows = notes.map((note) => [
    escapeCSV(note.title),
    escapeCSV(note.content),
    escapeCSV(note.category || ''),
    escapeCSV(note.tags?.join('; ') || ''),
    new Date(note.created_at).toLocaleString('id-ID'),
    new Date(note.updated_at).toLocaleString('id-ID'),
    note.pinned ? 'Yes' : 'No',
  ])

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')

  return csvContent
}

function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

function escapeCSV(value: string): string {
  if (!value) return ''

  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"` 
  }

  return value
}
